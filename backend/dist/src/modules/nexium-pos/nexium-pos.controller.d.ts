import { AutoDeductionService } from '../auto-deduction/auto-deduction.service';
import { ProcessPosReceiptDto } from '../auto-deduction/dto/process-receipt.dto';
export declare class NexiumPosController {
    private readonly autoDeductionService;
    constructor(autoDeductionService: AutoDeductionService);
    handleWebhook(payload: ProcessPosReceiptDto): Promise<{
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
    simulateReceipt(customPayload?: Partial<ProcessPosReceiptDto>): Promise<{
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
}
