/**
 * Estimate market value for a BHPH vehicle in the $3K-$8K range.
 * BHPH dealers typically price below what larger dealerships list for.
 * Uses a ~20% markup as baseline, adjusted for vehicle age and mileage.
 * Admin can override by setting market_estimate directly in database.
 */
export function estimateMarketValue(price: number, year: number, mileage: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  // Base markup: BHPH vehicles are typically 15-25% below market
  let multiplier = 1.20;

  // Older vehicles have a smaller gap between BHPH and market
  if (age > 10) multiplier = 1.12;
  else if (age > 7) multiplier = 1.15;

  let estimate = price * multiplier;

  // High mileage narrows the gap further
  if (mileage > 150000) estimate = price * 1.10;
  else if (mileage > 120000) estimate *= 0.95;

  // Round to nearest $100
  return Math.round(estimate / 100) * 100;
}

/**
 * Estimate monthly BHPH payment.
 * Simple principal / term calculation. No APR display (common BHPH practice).
 * Display with disclaimer: "Est. $X/mo with $500 down. 24 months. Subject to approval."
 */
export function estimateMonthlyPayment(
  price: number,
  downPayment: number = 500,
  termMonths: number = 24
): number {
  const principal = Math.max(price - downPayment, 0);
  return Math.round(principal / termMonths);
}
