import { PrismaService } from '../../prisma/prisma.service';
export declare class MenuService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMenuItems(): Promise<{
        calculatedPrimeCost: number;
        foodCostPercent: number;
        recipeCard: ({
            items: ({
                ingredient: {
                    id: string;
                    name: string;
                    organizationId: string;
                    isSemiFinished: boolean;
                    code: string | null;
                    category: string;
                    mainUnit: string;
                    costPerUnit: number;
                    minStockLevel: number;
                    lossPercentage: number;
                    subRecipeId: string | null;
                };
            } & {
                id: string;
                ingredientId: string;
                grossAmount: number;
                netAmount: number;
                unit: string;
                recipeCardId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            yieldAmount: number;
            yieldUnit: string;
            menuItemId: string | null;
        }) | null;
        id: string;
        createdAt: Date;
        name: string;
        organizationId: string;
        category: string;
        posItemId: string;
        description: string | null;
        sellingPrice: number;
        imageUrl: string | null;
        isAvailable: boolean;
        stopListSource: string | null;
        stopListReason: string | null;
        stopListUpdatedAt: Date | null;
    }[]>;
    createMenuItem(data: any): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        organizationId: string;
        category: string;
        posItemId: string;
        description: string | null;
        sellingPrice: number;
        imageUrl: string | null;
        isAvailable: boolean;
        stopListSource: string | null;
        stopListReason: string | null;
        stopListUpdatedAt: Date | null;
    }>;
    saveRecipeCard(menuItemId: string, recipeItems: Array<{
        ingredientId: string;
        grossAmount: number;
        netAmount?: number;
        unit?: string;
    }>): Promise<{
        items: ({
            ingredient: {
                id: string;
                name: string;
                organizationId: string;
                isSemiFinished: boolean;
                code: string | null;
                category: string;
                mainUnit: string;
                costPerUnit: number;
                minStockLevel: number;
                lossPercentage: number;
                subRecipeId: string | null;
            };
        } & {
            id: string;
            ingredientId: string;
            grossAmount: number;
            netAmount: number;
            unit: string;
            recipeCardId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        yieldAmount: number;
        yieldUnit: string;
        menuItemId: string | null;
    }>;
}
