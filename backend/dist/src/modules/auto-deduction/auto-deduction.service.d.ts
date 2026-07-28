import { PrismaService } from '../../prisma/prisma.service';
import { ProcessPosReceiptDto } from './dto/process-receipt.dto';
export declare class AutoDeductionService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    processReceipt(payload: ProcessPosReceiptDto): Promise<{
        status: string;
        message: string;
        movementId: string;
        receiptId?: undefined;
        warehouseId?: undefined;
        warehouseName?: undefined;
        deductedIngredientsCount?: undefined;
        deductions?: undefined;
        incidents?: undefined;
    } | {
        status: string;
        message: string;
        receiptId: string;
        movementId?: undefined;
        warehouseId?: undefined;
        warehouseName?: undefined;
        deductedIngredientsCount?: undefined;
        deductions?: undefined;
        incidents?: undefined;
    } | {
        status: string;
        receiptId: string;
        warehouseId: string;
        warehouseName: string;
        movementId: string;
        deductedIngredientsCount: number;
        deductions: {
            ingredientId: string;
            name: string;
            mainUnit: string;
            qty: number;
            unitCost: number;
        }[];
        incidents: {
            ingredientId: string;
            name: string;
            requested: number;
            available: number;
            shortage: number;
        }[];
        message?: undefined;
    }>;
    private resolveRecipeDeductions;
}
