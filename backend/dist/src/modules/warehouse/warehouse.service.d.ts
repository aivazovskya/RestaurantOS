import { PrismaService } from '../../prisma/prisma.service';
export declare class WarehouseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getIngredients(): Promise<{
        id: string;
        name: string;
        organizationId: string;
        code: string | null;
        category: string;
        mainUnit: string;
        costPerUnit: number;
        minStockLevel: number;
        lossPercentage: number;
        isSemiFinished: boolean;
        subRecipeId: string | null;
    }[]>;
    createIngredient(data: any): Promise<{
        id: string;
        name: string;
        organizationId: string;
        code: string | null;
        category: string;
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
    addStockReceipt(dto: {
        warehouseId?: string;
        invoiceNumber?: string;
        items: Array<{
            ingredientId: string;
            quantity: number;
            unitCost: number;
        }>;
    }): Promise<{
        items: ({
            ingredient: {
                id: string;
                name: string;
                organizationId: string;
                code: string | null;
                category: string;
                mainUnit: string;
                costPerUnit: number;
                minStockLevel: number;
                lossPercentage: number;
                isSemiFinished: boolean;
                subRecipeId: string | null;
            };
        } & {
            id: string;
            quantity: number;
            ingredientId: string;
            unitCost: number;
            stockMovementId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        warehouseId: string;
        type: string;
        referenceId: string | null;
        comment: string | null;
    }>;
    addManualWriteOff(dto: {
        warehouseId?: string;
        reason?: string;
        items: Array<{
            ingredientId: string;
            quantity: number;
        }>;
    }): Promise<{
        items: ({
            ingredient: {
                id: string;
                name: string;
                organizationId: string;
                code: string | null;
                category: string;
                mainUnit: string;
                costPerUnit: number;
                minStockLevel: number;
                lossPercentage: number;
                isSemiFinished: boolean;
                subRecipeId: string | null;
            };
        } & {
            id: string;
            quantity: number;
            ingredientId: string;
            unitCost: number;
            stockMovementId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        warehouseId: string;
        type: string;
        referenceId: string | null;
        comment: string | null;
    }>;
    getMovements(): Promise<({
        warehouse: {
            id: string;
            name: string;
            isMain: boolean;
            branchId: string;
        };
        items: ({
            ingredient: {
                id: string;
                name: string;
                organizationId: string;
                code: string | null;
                category: string;
                mainUnit: string;
                costPerUnit: number;
                minStockLevel: number;
                lossPercentage: number;
                isSemiFinished: boolean;
                subRecipeId: string | null;
            };
        } & {
            id: string;
            quantity: number;
            ingredientId: string;
            unitCost: number;
            stockMovementId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        warehouseId: string;
        type: string;
        referenceId: string | null;
        comment: string | null;
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
