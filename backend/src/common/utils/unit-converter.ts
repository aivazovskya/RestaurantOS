export class UnitConverter {
  /**
   * Converts a quantity from recipe unit to the ingredient's primary warehouse unit.
   * Standard primary units: KG, L, PCS.
   * Supported recipe units: KG, G, L, ML, PCS.
   */
  static convertToMainUnit(quantity: number, recipeUnit: string, mainUnit: string): number {
    const rUnit = recipeUnit.toUpperCase();
    const mUnit = mainUnit.toUpperCase();

    if (rUnit === mUnit) {
      return quantity;
    }

    // Weight conversions (G -> KG)
    if (rUnit === 'G' && mUnit === 'KG') {
      return quantity / 1000;
    }
    if (rUnit === 'KG' && mUnit === 'G') {
      return quantity * 1000;
    }

    // Volume conversions (ML -> L)
    if (rUnit === 'ML' && mUnit === 'L') {
      return quantity / 1000;
    }
    if (rUnit === 'L' && mUnit === 'ML') {
      return quantity * 1000;
    }

    // Default fallback if units are equivalent or non-convertible
    return quantity;
  }
}
