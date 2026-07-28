import { PrismaService } from '../../prisma/prisma.service';
export declare class OrganizationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboardSummary(): Promise<{
        organization: ({
            branches: ({
                warehouses: {
                    id: string;
                    name: string;
                    isMain: boolean;
                    branchId: string;
                }[];
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                address: string | null;
                phone: string | null;
                organizationId: string;
            })[];
        } & {
            id: string;
            name: string;
            bin: string | null;
            createdAt: Date;
            updatedAt: Date;
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
        })[];
    }>;
}
