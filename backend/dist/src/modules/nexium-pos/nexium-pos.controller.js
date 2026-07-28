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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NexiumPosController = void 0;
const common_1 = require("@nestjs/common");
const auto_deduction_service_1 = require("../auto-deduction/auto-deduction.service");
const process_receipt_dto_1 = require("../auto-deduction/dto/process-receipt.dto");
let NexiumPosController = class NexiumPosController {
    autoDeductionService;
    constructor(autoDeductionService) {
        this.autoDeductionService = autoDeductionService;
    }
    async handleWebhook(payload) {
        return await this.autoDeductionService.processReceipt(payload);
    }
    async simulateReceipt(customPayload) {
        const defaultPayload = {
            eventId: `evt_${Date.now()}`,
            receiptId: `REC-KZ-${Math.floor(1000 + Math.random() * 9000)}`,
            totalAmount: 8500,
            tableNumber: `Стол ${Math.floor(1 + Math.random() * 15)}`,
            items: [
                {
                    posItemId: 'NEX-DISH-001',
                    name: 'Бургер Говяжий Классический',
                    quantity: 2,
                    price: 3500,
                },
                {
                    posItemId: 'NEX-DISH-002',
                    name: 'Лимонад Классический 0.5L',
                    quantity: 1,
                    price: 1500,
                },
            ],
        };
        const finalPayload = { ...defaultPayload, ...customPayload };
        return await this.autoDeductionService.processReceipt(finalPayload);
    }
};
exports.NexiumPosController = NexiumPosController;
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [process_receipt_dto_1.ProcessPosReceiptDto]),
    __metadata("design:returntype", Promise)
], NexiumPosController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Post)('simulate-receipt'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NexiumPosController.prototype, "simulateReceipt", null);
exports.NexiumPosController = NexiumPosController = __decorate([
    (0, common_1.Controller)('api/v1/nexium'),
    __metadata("design:paramtypes", [auto_deduction_service_1.AutoDeductionService])
], NexiumPosController);
//# sourceMappingURL=nexium-pos.controller.js.map