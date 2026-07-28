import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UnitConverter } from '../utils/unit-converter';

export interface IngredientRequirement {
  ingredientId: string;
  name: string;
  mainUnit: string;
  requiredGrossAmount: number;
  unitCost: number;
}

@Injectable()
export class RecipeResolverService {
  private readonly logger = new Logger(RecipeResolverService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recursively resolves all base ingredient requirements for a given recipe card.
   * @param recipeItems Array of recipe items (with populated `ingredient`)
   * @param dishPortionQuantity Number of dish portions being calculated (e.g. 1 portion for availability check, N for POS sale)
   */
  async resolveIngredientRequirements(
    recipeItems: any[],
    dishPortionQuantity: number = 1.0,
  ): Promise<IngredientRequirement[]> {
    const requirementsMap = new Map<string, IngredientRequirement>();
    await this.traverseRecipe(recipeItems, dishPortionQuantity, requirementsMap);
    return Array.from(requirementsMap.values());
  }

  private async traverseRecipe(
    recipeItems: any[],
    multiplier: number,
    accumulator: Map<string, IngredientRequirement>,
  ) {
    if (!recipeItems || !Array.isArray(recipeItems)) return;

    for (const item of recipeItems) {
      const ingredient = item.ingredient;
      if (!ingredient) continue;

      // Convert recipe item gross amount to ingredient's primary unit
      const grossInMainUnit = UnitConverter.convertToMainUnit(
        item.grossAmount,
        item.unit,
        ingredient.mainUnit,
      );

      const totalRequired = grossInMainUnit * multiplier;

      // Handle semi-finished items (полуфабрикаты) recursively
      if (ingredient.isSemiFinished && ingredient.subRecipeId) {
        const subRecipe = await this.prisma.recipeCard.findUnique({
          where: { id: ingredient.subRecipeId },
          include: {
            items: {
              include: { ingredient: true },
            },
          },
        });

        if (subRecipe && subRecipe.items && subRecipe.items.length > 0) {
          const subYield = subRecipe.yieldAmount || 1.0;
          const subFactor = totalRequired / subYield;
          await this.traverseRecipe(subRecipe.items, subFactor, accumulator);
          continue;
        }
      }

      // Aggregate into accumulator
      const existing = accumulator.get(ingredient.id);
      if (existing) {
        existing.requiredGrossAmount += totalRequired;
      } else {
        accumulator.set(ingredient.id, {
          ingredientId: ingredient.id,
          name: ingredient.name,
          mainUnit: ingredient.mainUnit,
          requiredGrossAmount: totalRequired,
          unitCost: ingredient.costPerUnit || 0,
        });
      }
    }
  }
}
