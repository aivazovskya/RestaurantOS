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
var AutoDeductionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoDeductionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const recipe_resolver_service_1 = require("../../common/services/recipe-resolver.service");
const stop_list_service_1 = require("../stop-list/stop-list.service");
const customer_service_1 = require("../customer/customer.service");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const coupon_service_1 = require("../coupon/coupon.service");
let AutoDeductionService = AutoDeductionService_1 = class AutoDeductionService {
    prisma;
    recipeResolver;
    stopListService;
    customerService;
    loyaltyService;
    couponService;
    logger = new common_1.Logger(AutoDeductionService_1.name);
    constructor(prisma, recipeResolver, stopListService, customerService, loyaltyService, couponService) {
        this.prisma = prisma;
        this.recipeResolver = recipeResolver;
        this.stopListService = stopListService;
        this.customerService = customerService;
        this.loyaltyService = loyaltyService;
        this.couponService = couponService;
    }
    async processReceipt(payload) {
        const existingMovement = await this.prisma.stockMovement.findFirst({
            where: { referenceId: payload.receiptId },
        });
        if (existingMovement) {
            return {
                status: 'SKIPPED',
                message: `Receipt ${payload.receiptId} has already been processed for auto-deduction.`,
                movementId: existingMovement.id,
            };
        }
        let warehouse = await this.prisma.warehouse.findFirst({
            where: payload.branchId ? { branchId: payload.branchId } : {},
        });
        if (!warehouse) {
            warehouse = await this.prisma.warehouse.findFirst();
        }
        if (!warehouse) {
            throw new common_1.NotFoundException('No active warehouse found for auto-deduction.');
        }
        const deductionsMap = new Map();
        const incidentsList = [];
        if (payload.items && Array.isArray(payload.items)) {
            for (const posItem of payload.items) {
                const menuItem = await this.prisma.menuItem.findUnique({
                    where: { posItemId: posItem.posItemId },
                    include: {
                        recipeCard: {
                            include: {
                                items: {
                                    include: {
                                        ingredient: true,
                                    },
                                },
                            },
                        },
                    },
                });
                if (!menuItem || !menuItem.recipeCard || !menuItem.recipeCard.items) {
                    this.logger.warn(`No recipe card found for POS Item ${posItem.posItemId} (${posItem.name})`);
                    continue;
                }
                const requirements = await this.recipeResolver.resolveIngredientRequirements(menuItem.recipeCard.items, posItem.quantity);
                for (const req of requirements) {
                    const existing = deductionsMap.get(req.ingredientId);
                    if (existing) {
                        existing.qty += req.requiredGrossAmount;
                    }
                    else {
                        deductionsMap.set(req.ingredientId, {
                            ingredientId: req.ingredientId,
                            name: req.name,
                            mainUnit: req.mainUnit,
                            qty: req.requiredGrossAmount,
                            unitCost: req.unitCost,
                        });
                    }
                }
            }
        }
        if (deductionsMap.size === 0) {
            return {
                status: 'NO_OP',
                message: 'No ingredients matched recipe cards for this receipt.',
                receiptId: payload.receiptId,
            };
        }
        const movementItemsData = [];
        for (const [ingredientId, deduction] of deductionsMap.entries()) {
            let balance = await this.prisma.stockBalance.findUnique({
                where: {
                    warehouseId_ingredientId: {
                        warehouseId: warehouse.id,
                        ingredientId: ingredientId,
                    },
                },
            });
            const currentQty = balance ? balance.quantity : 0.0;
            const newQty = currentQty - deduction.qty;
            if (balance) {
                await this.prisma.stockBalance.update({
                    where: { id: balance.id },
                    data: { quantity: newQty },
                });
            }
            else {
                await this.prisma.stockBalance.create({
                    data: {
                        warehouseId: warehouse.id,
                        ingredientId: ingredientId,
                        quantity: newQty,
                    },
                });
            }
            if (newQty < 0) {
                incidentsList.push({
                    ingredientId,
                    name: deduction.name,
                    requested: deduction.qty,
                    available: currentQty,
                    shortage: Math.abs(newQty),
                });
                await this.prisma.deductionIncident.create({
                    data: {
                        receiptId: payload.receiptId,
                        ingredientId,
                        ingredientName: deduction.name,
                        requestedQty: deduction.qty,
                        availableQty: currentQty,
                        shortageQty: Math.abs(newQty),
                    },
                });
            }
            movementItemsData.push({
                ingredientId,
                quantity: -deduction.qty,
                unitCost: deduction.unitCost,
            });
        }
        const movement = await this.prisma.stockMovement.create({
            data: {
                warehouseId: warehouse.id,
                type: 'AUTO_DEDUCTION',
                referenceId: payload.receiptId,
                comment: `Автосписание по чеку Nexium ${payload.receiptId} (Стол: ${payload.tableNumber || 'N/A'})`,
                items: {
                    create: movementItemsData,
                },
            },
            include: {
                items: true,
            },
        });
        await this.stopListService.recalculateForIngredients(Array.from(deductionsMap.keys()), warehouse.id);
        let createdOrder = null;
        if (!payload.receiptId.startsWith('ONLINE-')) {
            let customer = null;
            if (payload.customerPhone) {
                customer = await this.customerService.findOrCreateByPhone(payload.customerPhone, payload.customerName);
            }
            let discountAmount = 0;
            let couponId = null;
            if (payload.couponCode) {
                try {
                    const validated = await this.couponService.validateCoupon(payload.couponCode, payload.totalAmount, customer?.id);
                    discountAmount = validated.discountAmount;
                    couponId = validated.couponId;
                    await this.couponService.markCouponUsed(validated.couponId);
                }
                catch (e) {
                    this.logger.warn(`Coupon validation failed for receipt ${payload.receiptId}: ${e.message}`);
                }
            }
            const count = await this.prisma.order.count();
            const orderNumber = `POS-${1001 + count}`;
            const orderItems = (payload.items || []).map((i) => ({
                posItemId: i.posItemId,
                name: i.name,
                quantity: i.quantity,
                price: i.price,
            }));
            const finalAmount = Math.max(0, payload.totalAmount - discountAmount - (payload.appliedPoints || 0));
            createdOrder = await this.prisma.order.create({
                data: {
                    branchId: warehouse.branchId,
                    orderNumber,
                    type: 'POS_CASHIER',
                    status: 'COMPLETED',
                    customerId: customer?.id || null,
                    customerPhone: customer?.phone || payload.customerPhone || null,
                    totalAmount: finalAmount,
                    discountAmount,
                    appliedPoints: payload.appliedPoints || 0,
                    couponId,
                    comment: `Чек кассы Nexium ${payload.receiptId} (Стол: ${payload.tableNumber || 'Касса'})`,
                    items: {
                        create: orderItems,
                    },
                },
            });
            if (customer) {
                if (payload.appliedPoints && payload.appliedPoints > 0) {
                    try {
                        await this.loyaltyService.redeemPoints(customer.id, payload.appliedPoints, createdOrder.id, createdOrder.orderNumber);
                    }
                    catch (e) {
                        this.logger.warn(`Failed to redeem points for POS receipt ${payload.receiptId}: ${e.message}`);
                    }
                }
                await this.customerService.updateCustomerStats(customer.id, finalAmount, 1);
                await this.loyaltyService.earnPointsForOrder(customer.id, createdOrder.id, createdOrder.orderNumber, finalAmount);
            }
        }
        return {
            status: 'SUCCESS',
            receiptId: payload.receiptId,
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            movementId: movement.id,
            orderId: createdOrder?.id || null,
            deductedIngredientsCount: deductionsMap.size,
            deductions: Array.from(deductionsMap.values()),
            incidents: incidentsList,
        };
    }
};
exports.AutoDeductionService = AutoDeductionService;
exports.AutoDeductionService = AutoDeductionService = AutoDeductionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        recipe_resolver_service_1.RecipeResolverService,
        stop_list_service_1.StopListService,
        customer_service_1.CustomerService,
        loyalty_service_1.LoyaltyService,
        coupon_service_1.CouponService])
], AutoDeductionService);
//# sourceMappingURL=auto-deduction.service.js.map