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
                    organizationId: string;
                    name: string;
                    category: string;
                    code: string | null;
                    mainUnit: string;
                    costPerUnit: number;
                    minStockLevel: number;
                    lossPercentage: number;
                    isSemiFinished: boolean;
                    subRecipeId: string | null;
                };
            } & {
                id: string;
                recipeCardId: string;
                ingredientId: string;
                grossAmount: number;
                netAmount: number;
                unit: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            menuItemId: string | null;
            yieldAmount: number;
            yieldUnit: string;
            updatedAt: Date;
        }) | null;
        description: string | null;
        id: string;
        posItemId: string;
        organizationId: string;
        name: string;
        category: string;
        sellingPrice: number;
        imageUrl: string | null;
        isAvailable: boolean;
        stopListSource: string | null;
        stopListReason: string | null;
        stopListUpdatedAt: Date | null;
        createdAt: Date;
    }[]>;
    createMenuItem(data: any): Promise<{
        description: string | null;
        id: string;
        posItemId: string;
        organizationId: string;
        name: string;
        category: string;
        sellingPrice: number;
        imageUrl: string | null;
        isAvailable: boolean;
        stopListSource: string | null;
        stopListReason: string | null;
        stopListUpdatedAt: Date | null;
        createdAt: Date;
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
                organizationId: string;
                name: string;
                category: string;
                code: string | null;
                mainUnit: string;
                costPerUnit: number;
                minStockLevel: number;
                lossPercentage: number;
                isSemiFinished: boolean;
                subRecipeId: string | null;
            };
        } & {
            id: string;
            recipeCardId: string;
            ingredientId: string;
            grossAmount: number;
            netAmount: number;
            unit: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        menuItemId: string | null;
        yieldAmount: number;
        yieldUnit: string;
        updatedAt: Date;
    }>;
}
