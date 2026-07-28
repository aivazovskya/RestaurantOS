import { PrismaService } from '../../prisma/prisma.service';
import { StopListService } from '../stop-list/stop-list.service';
export declare class WarehouseService {
    private readonly prisma;
    private readonly stopListService;
    constructor(prisma: PrismaService, stopListService: StopListService);
    getIngredients(): Promise<{
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
    }[]>;
    createIngredient(data: any): Promise<{
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
            quantity: number;
            ingredientId: string;
            unitCost: number;
            stockMovementId: string;
        })[];
    } & {
        id: string;
        type: string;
        comment: string | null;
        createdAt: Date;
        warehouseId: string;
        referenceId: string | null;
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
            quantity: number;
            ingredientId: string;
            unitCost: number;
            stockMovementId: string;
        })[];
    } & {
        id: string;
        type: string;
        comment: string | null;
        createdAt: Date;
        warehouseId: string;
        referenceId: string | null;
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
            quantity: number;
            ingredientId: string;
            unitCost: number;
            stockMovementId: string;
        })[];
    } & {
        id: string;
        type: string;
        comment: string | null;
        createdAt: Date;
        warehouseId: string;
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
