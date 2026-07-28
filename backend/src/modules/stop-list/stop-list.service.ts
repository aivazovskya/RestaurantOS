import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecipeResolverService } from '../../common/services/recipe-resolver.service';

@Injectable()
export class StopListService {
  private readonly logger = new Logger(StopListService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recipeResolver: RecipeResolverService,
  ) {}

  /**
   * Recalculates availability for all MenuItems affected by changes in the specified ingredient IDs.
   * Triggered automatically after POS sales, supplier receipts, and manual write-offs.
   */
  async recalculateForIngredients(ingredientIds: string[], warehouseId?: string): Promise<void> {
    if (!ingredientIds || ingredientIds.length === 0) return;

    // Resolve target warehouse
    let targetWarehouse = warehouseId
      ? await this.prisma.warehouse.findUnique({ where: { id: warehouseId } })
      : await this.prisma.warehouse.findFirst();

    if (!targetWarehouse) {
      targetWarehouse = await this.prisma.warehouse.findFirst();
    }

    if (!targetWarehouse) return;

    // Fetch all MenuItems with their recipe cards
    const menuItems = await this.prisma.menuItem.findMany({
      include: {
        recipeCard: {
          include: {
            items: {
              include: { ingredient: true },
            },
          },
        },
      },
    });

    const affectedIdsSet = new Set(ingredientIds);

    for (const menuItem of menuItems) {
      if (!menuItem.recipeCard || !menuItem.recipeCard.items || menuItem.recipeCard.items.length === 0) {
        continue;
      }

      // 1. Skip items under MANUAL stop-list (manual manager override must not be overwritten automatically)
      if (menuItem.stopListSource === 'MANUAL') {
        continue;
      }

      // 2. Resolve 1-portion base ingredient requirements
      const requirements = await this.recipeResolver.resolveIngredientRequirements(
        menuItem.recipeCard.items,
        1.0,
      );

      // Check if this menuItem is affected by the changed ingredient IDs
      const isAffected = requirements.some((req) => affectedIdsSet.has(req.ingredientId));
      if (!isAffected && menuItem.isAvailable) {
        // If not affected and currently available, no state transition needed
        continue;
      }

      // 3. Evaluate stock sufficiency for all required ingredients
      let shortageReason: string | null = null;

      for (const req of requirements) {
        const balance = await this.prisma.stockBalance.findUnique({
          where: {
            warehouseId_ingredientId: {
              warehouseId: targetWarehouse.id,
              ingredientId: req.ingredientId,
            },
          },
        });

        const availableQty = balance ? balance.quantity : 0.0;

        if (availableQty < req.requiredGrossAmount) {
          const shortageAmount = req.requiredGrossAmount - availableQty;
          shortageReason = `Нет: ${req.name} (осталось ${Math.max(0, availableQty)} ${req.mainUnit}, нужно ${req.requiredGrossAmount} ${req.mainUnit})`;
          break; // Stop at first shortage
        }
      }

      // 4. Handle State Transitions
      if (shortageReason && menuItem.isAvailable) {
        // TRANSITION: Available -> Auto Stop-List
        await this.prisma.menuItem.update({
          where: { id: menuItem.id },
          data: {
            isAvailable: false,
            stopListSource: 'AUTO',
            stopListReason: shortageReason,
            stopListUpdatedAt: new Date(),
          },
        });

        await this.prisma.stopListEvent.create({
          data: {
            menuItemId: menuItem.id,
            menuItemName: menuItem.name,
            action: 'AUTO_DISABLED',
            reason: shortageReason,
          },
        });

        this.logger.warn(`AUTO STOP-LIST ACTIVATED for "${menuItem.name}": ${shortageReason}`);
      } else if (!shortageReason && !menuItem.isAvailable && menuItem.stopListSource === 'AUTO') {
        // TRANSITION: Auto Stop-List -> Available (Stock restored)
        await this.prisma.menuItem.update({
          where: { id: menuItem.id },
          data: {
            isAvailable: true,
            stopListSource: null,
            stopListReason: null,
            stopListUpdatedAt: new Date(),
          },
        });

        await this.prisma.stopListEvent.create({
          data: {
            menuItemId: menuItem.id,
            menuItemName: menuItem.name,
            action: 'AUTO_ENABLED',
            reason: 'Запасы сырья пополнены',
          },
        });

        this.logger.log(`AUTO STOP-LIST CLEARED for "${menuItem.name}": Stock restored.`);
      }
    }
  }

  /**
   * Sets manual stop-list status for a MenuItem (Manager override).
   */
  async setManualStatus(
    menuItemId: string,
    isAvailable: boolean,
    reason?: string,
    userId?: string,
  ) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      throw new NotFoundException(`MenuItem ${menuItemId} not found.`);
    }

    const action = isAvailable ? 'MANUAL_ENABLED' : 'MANUAL_DISABLED';
    const stopListReason = isAvailable ? null : reason || 'Снято с продажи менеджером';
    const stopListSource = isAvailable ? null : 'MANUAL';

    const updated = await this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        isAvailable,
        stopListSource,
        stopListReason,
        stopListUpdatedAt: new Date(),
      },
    });

    await this.prisma.stopListEvent.create({
      data: {
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        action,
        reason: stopListReason || 'Возобновлено менеджером',
        triggeredBy: userId || 'MANAGER',
      },
    });

    return updated;
  }

  /**
   * Returns all items currently on the stop-list.
   */
  async getStopList() {
    return await this.prisma.menuItem.findMany({
      where: { isAvailable: false },
      orderBy: { stopListUpdatedAt: 'desc' },
    });
  }

  /**
   * Returns audit log of StopListEvents.
   */
  async getStopListHistory() {
    return await this.prisma.stopListEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
