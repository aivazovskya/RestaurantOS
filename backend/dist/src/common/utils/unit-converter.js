"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitConverter = void 0;
class UnitConverter {
    static convertToMainUnit(quantity, recipeUnit, mainUnit) {
        const rUnit = recipeUnit.toUpperCase();
        const mUnit = mainUnit.toUpperCase();
        if (rUnit === mUnit) {
            return quantity;
        }
        if (rUnit === 'G' && mUnit === 'KG') {
            return quantity / 1000;
        }
        if (rUnit === 'KG' && mUnit === 'G') {
            return quantity * 1000;
        }
        if (rUnit === 'ML' && mUnit === 'L') {
            return quantity / 1000;
        }
        if (rUnit === 'L' && mUnit === 'ML') {
            return quantity * 1000;
        }
        return quantity;
    }
}
exports.UnitConverter = UnitConverter;
//# sourceMappingURL=unit-converter.js.map