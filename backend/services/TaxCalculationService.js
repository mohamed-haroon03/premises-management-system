/**
 * Service to calculate property tax based on different Indian municipal methods.
 */

class TaxCalculationService {
    /**
     * Annual Rental Value (ARV) - Used in Chennai/Kolkata
     * Formula: ARV = Monthly Rent * 12; Tax = ARV * Tax Rate %
     */
    static calculateARV(monthlyRent, taxRatePercent) {
        const arv = monthlyRent * 12;
        return arv * (taxRatePercent / 100);
    }

    /**
     * Unit Area Value (UAV) - Used in Bangalore/Delhi/Hyderabad
     * Formula: UAV = Area * Rate per sqft * Occupancy Factor * Usage Factor * Age Factor
     * Tax = UAV * Tax %
     */
    static calculateUAV(area, ratePerSqft, occupancyFactor, usageFactor, ageFactor, taxRatePercent) {
        const uav = area * ratePerSqft * occupancyFactor * usageFactor * ageFactor;
        return uav * (taxRatePercent / 100);
    }

    /**
     * Capital Value System (CVS) - Used in Mumbai
     * Formula: Capital Value = Market rate per sqft * Builtup area
     * Tax = Capital Value * Tax %
     */
    static calculateCVS(marketRatePerSqft, builtupArea, taxRatePercent) {
        const capitalValue = marketRatePerSqft * builtupArea;
        // Simplified based on user prompt. Real CVS includes factors like age and occupancy on the capital value.
        // I will adhere to the user's provided formula: Tax = Capital Value * Tax %
        return capitalValue * (taxRatePercent / 100);
    }

    /**
     * Fixed Tax / Panchayat Tax
     * Flat yearly tax amount
     */
    static calculateFixed(fixedAmount) {
        return fixedAmount;
    }

    /**
     * Master strategy calculator
     */
    static calculateTax(method, payload) {
        switch (method) {
            case 'ARV':
                return this.calculateARV(
                    parseFloat(payload.monthlyRent || 0),
                    parseFloat(payload.taxRatePercent || 0)
                );
            case 'UAV':
                return this.calculateUAV(
                    parseFloat(payload.area || 0),
                    parseFloat(payload.ratePerSqft || 0),
                    parseFloat(payload.occupancyFactor || 1),
                    parseFloat(payload.usageFactor || 1),
                    parseFloat(payload.ageFactor || 1),
                    parseFloat(payload.taxRatePercent || 0)
                );
            case 'CVS':
                return this.calculateCVS(
                    parseFloat(payload.marketRatePerSqft || 0),
                    parseFloat(payload.builtupArea || 0),
                    parseFloat(payload.taxRatePercent || 0)
                );
            case 'FIXED':
                return this.calculateFixed(
                    parseFloat(payload.fixedAmount || 0)
                );
            default:
                throw new Error(`Unsupported tax calculation method: ${method}`);
        }
    }
}

module.exports = TaxCalculationService;
