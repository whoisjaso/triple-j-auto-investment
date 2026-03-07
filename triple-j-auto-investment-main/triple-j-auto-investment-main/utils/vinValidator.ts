/**
 * VIN Validation Utility
 * Phase 05: Registration Checker
 *
 * Provides VIN format validation and ISO 3779 check digit validation.
 * Used by the Registration Checker to verify VIN integrity before
 * webDEALER submission.
 *
 * References:
 * - ISO 3779 (Vehicle Identification Number standard)
 * - Letters I, O, Q are excluded (confusion with 1, 0)
 */

// ================================================================
// VIN TRANSLITERATION TABLE
// ================================================================
// Maps each valid VIN character to its numeric value per ISO 3779.
// Letters I, O, Q are not present (invalid in VINs).

const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
};

// ================================================================
// VIN POSITION WEIGHTS
// ================================================================
// Weight factor for each of the 17 VIN positions.
// Position 9 (index 8) has weight 0 because it IS the check digit.

const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

// ================================================================
// FORMAT VALIDATION
// ================================================================

/**
 * Validate VIN format: 17 characters, alphanumeric only, no I/O/Q.
 *
 * Checks performed (in order):
 * 1. Not empty
 * 2. Alphanumeric only (after uppercasing)
 * 3. No forbidden characters (I, O, Q)
 * 4. Exactly 17 characters
 *
 * @param vin - The VIN string to validate
 * @returns Object with valid boolean and optional error message
 */
export function validateVinFormat(vin: string): { valid: boolean; error?: string } {
  if (!vin) return { valid: false, error: 'VIN is required' };

  const upper = vin.toUpperCase();

  if (/[^A-Z0-9]/.test(upper)) {
    return { valid: false, error: 'VIN must be alphanumeric only' };
  }

  const forbidden = upper.match(/[IOQ]/g);
  if (forbidden) {
    return { valid: false, error: `VIN contains invalid character(s): ${forbidden.join(', ')}` };
  }

  if (upper.length !== 17) {
    return { valid: false, error: `VIN must be 17 characters (got ${upper.length})` };
  }

  return { valid: true };
}

// ================================================================
// CHECK DIGIT VALIDATION
// ================================================================

/**
 * Validate VIN check digit (position 9) per ISO 3779.
 *
 * Algorithm:
 * 1. Convert each character to its numeric value via transliteration table
 * 2. Multiply each value by its position weight
 * 3. Sum all products
 * 4. Divide sum by 11, take remainder
 * 5. Remainder 0-9 = that digit; remainder 10 = "X"
 * 6. Result must match position 9 (index 8) of the VIN
 *
 * @param vin - The 17-character VIN string to validate
 * @returns true if check digit is correct, false otherwise
 */
export function validateVinCheckDigit(vin: string): boolean {
  const upper = vin.toUpperCase();
  if (upper.length !== 17) return false;

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const value = VIN_TRANSLITERATION[upper[i]];
    if (value === undefined) return false;
    sum += value * VIN_WEIGHTS[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 10 ? 'X' : String(remainder);
  return upper[8] === checkDigit;
}
