"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let OrganizationService = class OrganizationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardSummary() {
        const org = await this.prisma.organization.findFirst({
            include: {
                branches: {
                    include: { warehouses: true },
                },
            },
        });
        const balances = await this.prisma.stockBalance.findMany({
            include: { ingredient: true },
        });
        let totalStockValue = 0;
        let lowStockCount = 0;
        let negativeStockCount = 0;
        for (const b of balances) {
            totalStockValue += b.quantity * b.ingredient.costPerUnit;
            if (b.quantity <= b.ingredient.minStockLevel) {
                lowStockCount++;
            }
            if (b.quantity < 0) {
                negativeStockCount++;
            }
        }
        const movementsCount = await this.prisma.stockMovement.count();
        const autoDeductionsCount = await this.prisma.stockMovement.count({
            where: { type: 'AUTO_DEDUCTION' },
        });
        const incidentsCount = await this.prisma.deductionIncident.count();
        const recentMovements = await this.prisma.stockMovement.findMany({
            take: 6,
            orderBy: { createdAt: 'desc' },
            include: {
                items: { include: { ingredient: true } },
            },
        });
        return {
            organization: org,
            stats: {
                totalStockValue: Math.round(totalStockValue),
                totalIngredients: balances.length,
                lowStockCount,
                negativeStockCount,
                totalMovements: movementsCount,
                autoDeductionsCount,
                incidentsCount,
            },
            recentMovements,
        };
    }
};
exports.OrganizationService = OrganizationService;
exports.OrganizationService = OrganizationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationService);
//# sourceMappingURL=organization.service.js.map