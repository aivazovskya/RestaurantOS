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
                createdAt: Date;
                name: string;
                updatedAt: Date;
                address: string | null;
                phone: string | null;
                organizationId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            name: string;
            bin: string | null;
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
        })[];
    }>;
}
