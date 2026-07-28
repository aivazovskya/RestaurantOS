import { MenuService } from './menu.service';
export declare class MenuController {
    private readonly menuService;
    constructor(menuService: MenuService);
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
    saveRecipeCard(menuItemId: string, body: {
        recipeItems: any[];
    }): Promise<{
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
