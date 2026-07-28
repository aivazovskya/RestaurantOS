import { WarehouseService } from './warehouse.service';
export declare class WarehouseController {
    private readonly warehouseService;
    constructor(warehouseService: WarehouseService);
    getIngredients(): Promise<{
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
    }[]>;
    createIngredient(data: any): Promise<{
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
    }>;
    getBalances(warehouseId?: string): Promise<{
        id: string;
        ingredientId: string;
        name: string;
        code: string | null;
        category: string;
        quantity: number;
        unit: string;
        costPerUnit: number;
        totalCost: number;
        minStockLevel: number;
        isLowStock: boolean;
        isNegative: boolean;
    }[]>;
    addStockReceipt(dto: any): Promise<{
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
            ingredientId: string;
            quantity: number;
            unitCost: number;
            stockMovementId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        warehouseId: string;
        type: string;
        comment: string | null;
        referenceId: string | null;
    }>;
    addManualWriteOff(dto: any): Promise<{
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
            ingredientId: string;
            quantity: number;
            unitCost: number;
            stockMovementId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        warehouseId: string;
        type: string;
        comment: string | null;
        referenceId: string | null;
    }>;
    getMovements(): Promise<({
        warehouse: {
            branchId: string;
            id: string;
            name: string;
            isMain: boolean;
        };
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
            ingredientId: string;
            quantity: number;
            unitCost: number;
            stockMovementId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        warehouseId: string;
        type: string;
        comment: string | null;
        referenceId: string | null;
    })[]>;
    getIncidents(): Promise<{
        id: string;
        createdAt: Date;
        ingredientId: string;
        receiptId: string;
        ingredientName: string;
        requestedQty: number;
        availableQty: number;
        shortageQty: number;
    }[]>;
}
