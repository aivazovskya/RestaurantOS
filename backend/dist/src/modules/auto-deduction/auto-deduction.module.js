"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoDeductionModule = void 0;
const common_1 = require("@nestjs/common");
const auto_deduction_service_1 = require("./auto-deduction.service");
const stop_list_module_1 = require("../stop-list/stop-list.module");
let AutoDeductionModule = class AutoDeductionModule {
};
exports.AutoDeductionModule = AutoDeductionModule;
exports.AutoDeductionModule = AutoDeductionModule = __decorate([
    (0, common_1.Module)({
        imports: [stop_list_module_1.StopListModule],
        providers: [auto_deduction_service_1.AutoDeductionService],
        exports: [auto_deduction_service_1.AutoDeductionService],
    })
], AutoDeductionModule);
//# sourceMappingURL=auto-deduction.module.js.map