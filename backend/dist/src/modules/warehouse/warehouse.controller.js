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
exports.WarehouseController = void 0;
const common_1 = require("@nestjs/common");
const warehouse_service_1 = require("./warehouse.service");
let WarehouseController = class WarehouseController {
    warehouseService;
    constructor(warehouseService) {
        this.warehouseService = warehouseService;
    }
    async getIngredients() {
        return await this.warehouseService.getIngredients();
    }
    async createIngredient(data) {
        return await this.warehouseService.createIngredient(data);
    }
    async getBalances(warehouseId) {
        return await this.warehouseService.getBalances(warehouseId);
    }
    async addStockReceipt(dto) {
        return await this.warehouseService.addStockReceipt(dto);
    }
    async addManualWriteOff(dto) {
        return await this.warehouseService.addManualWriteOff(dto);
    }
    async getMovements() {
        return await this.warehouseService.getMovements();
    }
    async getIncidents() {
        return await this.warehouseService.getIncidents();
    }
};
exports.WarehouseController = WarehouseController;
__decorate([
    (0, common_1.Get)('ingredients'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "getIngredients", null);
__decorate([
    (0, common_1.Post)('ingredients'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "createIngredient", null);
__decorate([
    (0, common_1.Get)('balances'),
    __param(0, (0, common_1.Query)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "getBalances", null);
__decorate([
    (0, common_1.Post)('receipts'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "addStockReceipt", null);
__decorate([
    (0, common_1.Post)('write-offs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "addManualWriteOff", null);
__decorate([
    (0, common_1.Get)('movements'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "getMovements", null);
__decorate([
    (0, common_1.Get)('incidents'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "getIncidents", null);
exports.WarehouseController = WarehouseController = __decorate([
    (0, common_1.Controller)('api/v1/warehouse'),
    __metadata("design:paramtypes", [warehouse_service_1.WarehouseService])
], WarehouseController);
//# sourceMappingURL=warehouse.controller.js.map