import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecipeResolverService } from '../../common/services/recipe-resolver.service';
import { EventsGateway } from '../../common/gateways/events.gateway';

@Injectable()
export class StopListService {
  private readonly logger = new Logger(StopListService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recipeResolver: RecipeResolverService,
    private readonly eventsGateway: EventsGateway,
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

    const branchId = targetWarehouse.branchId;

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

      // 1. Skip items under MANUAL stop-list
      if (menuItem.stopListSource === 'MANUAL') {
        continue;
      }

      // 2. Resolve 1-portion base ingredient requirements
      const requirements = await this.recipeResolver.resolveIngredientRequirements(
        menuItem.recipeCard.items,
        1.0,
      );

      const isAffected = requirements.some((req) => affectedIdsSet.has(req.ingredientId));
      if (!isAffected && menuItem.isAvailable) {
        continue;
      }

      // 3. Evaluate stock sufficiency
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
          shortageReason = `Нет: ${req.name} (осталось ${Math.max(0, availableQty)} ${req.mainUnit}, нужно ${req.requiredGrossAmount} ${req.mainUnit})`;
          break;
        }
      }

      // 4. Handle State Transitions
      if (shortageReason && menuItem.isAvailable) {
        // TRANSITION: Available -> Auto Stop-List
        const updated = await this.prisma.menuItem.update({
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

        // Emit WS Event
        this.eventsGateway.emitStopListChanged(branchId, {
          menuItemId: menuItem.id,
          posItemId: menuItem.posItemId,
          isAvailable: false,
          stopListSource: 'AUTO',
          stopListReason: shortageReason,
        });

      } else if (!shortageReason && !menuItem.isAvailable && menuItem.stopListSource === 'AUTO') {
        // TRANSITION: Auto Stop-List -> Available (Stock restored)
        const updated = await this.prisma.menuItem.update({
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

        // Emit WS Event
        this.eventsGateway.emitStopListChanged(branchId, {
          menuItemId: menuItem.id,
          posItemId: menuItem.posItemId,
          isAvailable: true,
          stopListSource: null,
          stopListReason: null,
        });
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
    branchId?: string,
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

    // Resolve specific branch ID for WS broadcast
    let targetBranchId = branchId;
    if (!targetBranchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { organizationId: menuItem.organizationId },
      }) || await this.prisma.branch.findFirst();
      targetBranchId = branch ? branch.id : 'default-branch';
    }

    this.eventsGateway.emitStopListChanged(targetBranchId, {
      menuItemId: menuItem.id,
      posItemId: menuItem.posItemId,
      isAvailable,
      stopListSource,
      stopListReason,
    });

    return updated;
  }

  async getStopList() {
    return await this.prisma.menuItem.findMany({
      where: { isAvailable: false },
      orderBy: { stopListUpdatedAt: 'desc' },
    });
  }

  async getStopListHistory() {
    return await this.prisma.stopListEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
