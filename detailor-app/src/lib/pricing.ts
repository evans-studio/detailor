// Pricing calculation utilities

export interface PriceBreakdown {
  base: number;
  vehicleMultiplier: number;
  addons: number;
  distanceSurcharge: number;
  taxRate: number;
  tax: number;
  total: number;
}

export interface VehicleTiers {
  [key: string]: number;
}

export interface DistancePolicy {
  free_radius: number;
  surcharge_per_mile: number;
}

export interface TaxConfig {
  rate: number;
  inclusive?: boolean;
}

/**
 * Computes the price breakdown for a quote or booking
 */
export function computePriceBreakdown(
  basePrice: number,
  vehicleMultiplier: number,
  addonsTotal: number,
  distanceSurcharge: number,
  taxRate: number
): PriceBreakdown {
  // Ensure all inputs are valid numbers, handle negatives appropriately
  const validBasePrice = Math.max(0, Number(basePrice) || 0);
  const validVehicleMultiplier = Number(vehicleMultiplier) > 0 ? Number(vehicleMultiplier) : 1;
  const validAddonsTotal = Math.max(0, Number(addonsTotal) || 0);
  const validDistanceSurcharge = Math.max(0, Number(distanceSurcharge) || 0);
  const validTaxRate = Math.max(0, Number(taxRate) || 0);

  // Calculate subtotal
  const subtotal = validBasePrice * validVehicleMultiplier + validAddonsTotal + validDistanceSurcharge;
  
  // Calculate tax (rounded to nearest cent)
  const tax = Math.round(subtotal * validTaxRate * 100) / 100;
  
  // Calculate total (rounded to nearest cent)  
  const total = Math.round((subtotal + tax) * 100) / 100;

  return {
    base: validBasePrice,
    vehicleMultiplier: validVehicleMultiplier,
    addons: validAddonsTotal,
    distanceSurcharge: validDistanceSurcharge,
    taxRate: validTaxRate,
    tax,
    total,
  };
}

/**
 * Calculate distance surcharge based on distance and policy
 */
export function calculateDistanceSurcharge(
  distanceMiles: number,
  distancePolicy: DistancePolicy
): number {
  const distance = Number(distanceMiles) || 0;
  const freeRadius = Number(distancePolicy.free_radius) || 0;
  const perMile = Number(distancePolicy.surcharge_per_mile) || 0;
  
  const billableMiles = Math.max(0, distance - freeRadius);
  return Math.round(billableMiles * perMile * 100) / 100;
}

/**
 * Get vehicle multiplier from tiers configuration
 */
export function getVehicleMultiplier(
  vehicleTier: string,
  vehicleTiers: VehicleTiers
): number {
  return Number(vehicleTiers[vehicleTier]) || 1;
}

/**
 * Calculate total add-ons price from array of add-ons
 */
export function calculateAddonsTotal(addons: Array<{ price_delta: number }>): number {
  if (!Array.isArray(addons)) return 0;
  
  return addons.reduce((total, addon) => {
    return total + (Number(addon.price_delta) || 0);
  }, 0);
}

/**
 * Validate pricing inputs
 */
export function validatePricingInputs(inputs: {
  basePrice?: number;
  vehicleMultiplier?: number;
  addonsTotal?: number;
  distanceSurcharge?: number;
  taxRate?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (inputs.basePrice !== undefined) {
    const basePrice = Number(inputs.basePrice);
    if (isNaN(basePrice) || basePrice < 0) {
      errors.push('Base price must be a non-negative number');
    }
  }
  
  if (inputs.vehicleMultiplier !== undefined) {
    const multiplier = Number(inputs.vehicleMultiplier);
    if (isNaN(multiplier) || multiplier <= 0) {
      errors.push('Vehicle multiplier must be a positive number');
    }
  }
  
  if (inputs.addonsTotal !== undefined) {
    const addons = Number(inputs.addonsTotal);
    if (isNaN(addons) || addons < 0) {
      errors.push('Add-ons total must be a non-negative number');
    }
  }
  
  if (inputs.distanceSurcharge !== undefined) {
    const distance = Number(inputs.distanceSurcharge);
    if (isNaN(distance) || distance < 0) {
      errors.push('Distance surcharge must be a non-negative number');
    }
  }
  
  if (inputs.taxRate !== undefined) {
    const taxRate = Number(inputs.taxRate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 1) {
      errors.push('Tax rate must be a number between 0 and 1');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}