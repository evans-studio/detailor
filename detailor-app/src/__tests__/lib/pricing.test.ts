import { describe, it, expect } from 'vitest';
import {
  computePriceBreakdown,
  calculateDistanceSurcharge,
  getVehicleMultiplier,
  calculateAddonsTotal,
  validatePricingInputs,
  type PriceBreakdown,
  type DistancePolicy,
  type VehicleTiers,
} from '@/lib/pricing';

describe('pricing utilities', () => {
  describe('computePriceBreakdown', () => {
    it('should calculate correct pricing with valid inputs', () => {
      const result = computePriceBreakdown(50.00, 1.2, 25.00, 5.00, 0.20);
      
      expect(result).toEqual({
        base: 50.00,
        vehicleMultiplier: 1.2,
        addons: 25.00,
        distanceSurcharge: 5.00,
        taxRate: 0.20,
        tax: 18.00, // (50*1.2 + 25 + 5) * 0.20 = 90 * 0.20 = 18
        total: 108.00, // 90 + 18
      });
    });

    it('should handle zero values correctly', () => {
      const result = computePriceBreakdown(0, 0, 0, 0, 0);
      
      expect(result).toEqual({
        base: 0,
        vehicleMultiplier: 1, // Should default to 1 when 0 is provided
        addons: 0,
        distanceSurcharge: 0,
        taxRate: 0,
        tax: 0,
        total: 0,
      });
    });

    it('should handle negative inputs by converting to positive or zero', () => {
      const result = computePriceBreakdown(-50, -1.2, -25, -5, -0.20);
      
      // Negative values should be treated as 0, except vehicleMultiplier defaults to 1
      expect(result.base).toBe(0);
      expect(result.vehicleMultiplier).toBe(1);
      expect(result.addons).toBe(0);
      expect(result.distanceSurcharge).toBe(0);
      expect(result.taxRate).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle string inputs by converting to numbers', () => {
      const result = computePriceBreakdown(
        '50.00' as any,
        '1.2' as any,
        '25.00' as any,
        '5.00' as any,
        '0.20' as any
      );
      
      expect(result.base).toBe(50);
      expect(result.vehicleMultiplier).toBe(1.2);
      expect(result.addons).toBe(25);
      expect(result.distanceSurcharge).toBe(5);
      expect(result.taxRate).toBe(0.2);
    });

    it('should handle invalid string inputs by defaulting to safe values', () => {
      const result = computePriceBreakdown(
        'invalid' as any,
        'not-a-number' as any,
        'abc' as any,
        'xyz' as any,
        'bad-tax' as any
      );
      
      expect(result.base).toBe(0);
      expect(result.vehicleMultiplier).toBe(1);
      expect(result.addons).toBe(0);
      expect(result.distanceSurcharge).toBe(0);
      expect(result.taxRate).toBe(0);
    });

    it('should round tax and total to 2 decimal places', () => {
      // Create a scenario that would result in more than 2 decimal places
      // Using a more predictable example: 100 * 0.125 = 12.5, so we get precise results
      const result = computePriceBreakdown(100.00, 1.0, 0, 0, 0.125);
      
      expect(result.tax).toBe(12.50);
      expect(result.total).toBe(112.50);
      
      // Test with a value that would create rounding
      const result2 = computePriceBreakdown(33.34, 1.0, 0, 0, 1/3); // 1/3 = 0.333...
      // 33.34 * 0.333... = 11.11333..., should round to 11.11
      expect(result2.tax).toBe(11.11);
      expect(result2.total).toBe(44.45); // 33.34 + 11.11
    });

    it('should handle high precision inputs correctly', () => {
      const result = computePriceBreakdown(
        99.999999,
        1.000001,
        0.000001,
        0.999999,
        0.199999
      );
      
      // Should handle precision without causing floating point errors
      expect(result.base).toBe(99.999999);
      expect(result.tax).toBeCloseTo(20.20, 2);
      expect(result.total).toBeCloseTo(121.20, 2);
    });

    it('should work with realistic car detailing prices', () => {
      // Basic wash: £30, Large vehicle (1.5x), Interior clean addon (£20), 
      // 8 miles distance (3 free + 5 billable at £2/mile = £10), 20% VAT
      const result = computePriceBreakdown(30.00, 1.5, 20.00, 10.00, 0.20);
      
      // Subtotal: (30 * 1.5) + 20 + 10 = 45 + 20 + 10 = 75
      // Tax: 75 * 0.20 = 15
      // Total: 75 + 15 = 90
      expect(result).toEqual({
        base: 30.00,
        vehicleMultiplier: 1.5,
        addons: 20.00,
        distanceSurcharge: 10.00,
        taxRate: 0.20,
        tax: 15.00,
        total: 90.00,
      });
    });
  });

  describe('calculateDistanceSurcharge', () => {
    const defaultPolicy: DistancePolicy = {
      free_radius: 5,
      surcharge_per_mile: 2.50,
    };

    it('should return 0 for distance within free radius', () => {
      expect(calculateDistanceSurcharge(3, defaultPolicy)).toBe(0);
      expect(calculateDistanceSurcharge(5, defaultPolicy)).toBe(0);
    });

    it('should calculate surcharge for distance beyond free radius', () => {
      expect(calculateDistanceSurcharge(8, defaultPolicy)).toBe(7.50); // 3 miles * £2.50
      expect(calculateDistanceSurcharge(10, defaultPolicy)).toBe(12.50); // 5 miles * £2.50
    });

    it('should handle zero distance', () => {
      expect(calculateDistanceSurcharge(0, defaultPolicy)).toBe(0);
    });

    it('should handle negative distance', () => {
      expect(calculateDistanceSurcharge(-5, defaultPolicy)).toBe(0);
    });

    it('should round result to 2 decimal places', () => {
      const policy: DistancePolicy = {
        free_radius: 0,
        surcharge_per_mile: 3.333,
      };
      
      expect(calculateDistanceSurcharge(3, policy)).toBe(10.00); // 3 * 3.333 = 9.999, rounds to 10.00
    });

    it('should handle string inputs', () => {
      expect(calculateDistanceSurcharge('8' as any, defaultPolicy)).toBe(7.50);
    });

    it('should handle invalid inputs safely', () => {
      expect(calculateDistanceSurcharge('invalid' as any, defaultPolicy)).toBe(0);
      
      const invalidPolicy = {
        free_radius: 'bad' as any,
        surcharge_per_mile: 'input' as any,
      };
      expect(calculateDistanceSurcharge(10, invalidPolicy)).toBe(0);
    });
  });

  describe('getVehicleMultiplier', () => {
    const vehicleTiers: VehicleTiers = {
      small: 1.0,
      medium: 1.2,
      large: 1.5,
      xl: 2.0,
    };

    it('should return correct multiplier for valid tier', () => {
      expect(getVehicleMultiplier('small', vehicleTiers)).toBe(1.0);
      expect(getVehicleMultiplier('medium', vehicleTiers)).toBe(1.2);
      expect(getVehicleMultiplier('large', vehicleTiers)).toBe(1.5);
      expect(getVehicleMultiplier('xl', vehicleTiers)).toBe(2.0);
    });

    it('should return 1 for invalid tier', () => {
      expect(getVehicleMultiplier('invalid', vehicleTiers)).toBe(1);
      expect(getVehicleMultiplier('', vehicleTiers)).toBe(1);
    });

    it('should handle case sensitivity', () => {
      expect(getVehicleMultiplier('LARGE', vehicleTiers)).toBe(1); // Should be case-sensitive
      expect(getVehicleMultiplier('Large', vehicleTiers)).toBe(1); // Should be case-sensitive
    });

    it('should handle numerical tier values as strings', () => {
      const numericTiers = {
        '1': 1.0,
        '2': 1.5,
        '3': 2.0,
      };
      
      expect(getVehicleMultiplier('1', numericTiers)).toBe(1.0);
      expect(getVehicleMultiplier('2', numericTiers)).toBe(1.5);
    });
  });

  describe('calculateAddonsTotal', () => {
    it('should calculate total from array of addons', () => {
      const addons = [
        { price_delta: 20.00 },
        { price_delta: 15.50 },
        { price_delta: 5.00 },
      ];
      
      expect(calculateAddonsTotal(addons)).toBe(40.50);
    });

    it('should handle empty array', () => {
      expect(calculateAddonsTotal([])).toBe(0);
    });

    it('should handle null/undefined input', () => {
      expect(calculateAddonsTotal(null as any)).toBe(0);
      expect(calculateAddonsTotal(undefined as any)).toBe(0);
    });

    it('should handle addons with zero price_delta', () => {
      const addons = [
        { price_delta: 0 },
        { price_delta: 25.00 },
        { price_delta: 0 },
      ];
      
      expect(calculateAddonsTotal(addons)).toBe(25.00);
    });

    it('should handle invalid price_delta values', () => {
      const addons = [
        { price_delta: 20.00 },
        { price_delta: 'invalid' as any },
        { price_delta: null as any },
        { price_delta: 15.00 },
      ];
      
      expect(calculateAddonsTotal(addons)).toBe(35.00); // Only valid values
    });

    it('should handle negative price_delta values', () => {
      const addons = [
        { price_delta: 20.00 },
        { price_delta: -5.00 }, // Discount addon
        { price_delta: 15.00 },
      ];
      
      expect(calculateAddonsTotal(addons)).toBe(30.00);
    });
  });

  describe('validatePricingInputs', () => {
    it('should validate all valid inputs', () => {
      const result = validatePricingInputs({
        basePrice: 50.00,
        vehicleMultiplier: 1.2,
        addonsTotal: 25.00,
        distanceSurcharge: 5.00,
        taxRate: 0.20,
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject negative base price', () => {
      const result = validatePricingInputs({ basePrice: -50 });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Base price must be a non-negative number');
    });

    it('should reject zero or negative vehicle multiplier', () => {
      let result = validatePricingInputs({ vehicleMultiplier: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Vehicle multiplier must be a positive number');
      
      result = validatePricingInputs({ vehicleMultiplier: -1.5 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Vehicle multiplier must be a positive number');
    });

    it('should reject negative addons total', () => {
      const result = validatePricingInputs({ addonsTotal: -25 });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Add-ons total must be a non-negative number');
    });

    it('should reject invalid tax rate', () => {
      let result = validatePricingInputs({ taxRate: -0.1 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tax rate must be a number between 0 and 1');
      
      result = validatePricingInputs({ taxRate: 1.5 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tax rate must be a number between 0 and 1');
    });

    it('should handle multiple validation errors', () => {
      const result = validatePricingInputs({
        basePrice: -50,
        vehicleMultiplier: 0,
        taxRate: 2.0,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });

    it('should handle non-numeric inputs', () => {
      const result = validatePricingInputs({
        basePrice: 'invalid' as any,
        vehicleMultiplier: 'not-a-number' as any,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should allow partial validation', () => {
      const result = validatePricingInputs({ basePrice: 50.00 });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should allow zero values where appropriate', () => {
      const result = validatePricingInputs({
        basePrice: 0,
        addonsTotal: 0,
        distanceSurcharge: 0,
        taxRate: 0,
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should allow boundary values', () => {
      const result = validatePricingInputs({
        taxRate: 1.0, // Maximum allowed
        vehicleMultiplier: 0.01, // Very small but positive
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});