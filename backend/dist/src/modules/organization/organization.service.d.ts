import { PrismaService } from '../../prisma/prisma.service';
export declare class OrganizationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboardSummary(): Promise<{
        organization: ({
            branches: ({
                warehouses: {
                    branchId: string;
                    id: string;
                    name: string;
                    isMain: boolean;
                }[];
            } & {
                id: string;
                organizationId: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                address: string | null;
                phone: string | null;
            })[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            bin: string | null;
        }) | null;
        stats: {
            totalStockValue: number;
            totalIngredients: number;
            lowStockCount: number;
            negativeStockCount: number;
            totalMovements: number;
            autoDeductionsCount: number;
            incidentsCount: number;
        };
        recentMovements: ({
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
        })[];
    }>;
}
