// ============================================================
// Texas Tax & Fee Constants
// ============================================================

export const TEXAS_TAX_RATE = 0.0625; // 6.25%
export const TEXAS_TITLE_FEE = 33;
export const DEFAULT_DOC_FEE = 150;
export const DEFAULT_REG_FEE = 75;

/** Calculate Texas sales tax (6.25%) rounded to cents */
export function calcTexasTax(price: number): number {
  if (!price || isNaN(price) || price <= 0) return 0;
  return Math.round(price * TEXAS_TAX_RATE * 100) / 100;
}

/** Reverse-calculate sale price from out-the-door total */
export function reverseTTL(
  outTheDoor: number,
  titleFee = TEXAS_TITLE_FEE,
  docFee = DEFAULT_DOC_FEE,
  regFee = DEFAULT_REG_FEE
): { salePrice: number; tax: number } {
  if (!outTheDoor || isNaN(outTheDoor) || outTheDoor <= 0) {
    return { salePrice: 0, tax: 0 };
  }
  const afterFees = outTheDoor - titleFee - docFee - regFee;
  if (afterFees <= 0) return { salePrice: 0, tax: 0 };
  const salePrice = Math.round((afterFees / (1 + TEXAS_TAX_RATE)) * 100) / 100;
  const tax = Math.round(salePrice * TEXAS_TAX_RATE * 100) / 100;
  return { salePrice, tax };
}

// ============================================================
// Bill of Sale Data
// ============================================================

export interface BillOfSaleData {
  saleDate: string;
  stockNumber: string;
  buyerName: string;
  buyerAddress: string;
  buyerCity: string;
  buyerState: string;
  buyerZip: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerLicense: string;
  buyerLicenseState: string;
  coBuyerName: string;
  coBuyerAddress: string;
  coBuyerCity: string;
  coBuyerState: string;
  coBuyerZip: string;
  coBuyerPhone: string;
  coBuyerEmail: string;
  coBuyerLicense: string;
  coBuyerLicenseState: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string;
  vehicleVin: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleBodyStyle: string;
  vehicleMileage: string;
  odometerReading: string;
  odometerStatus: 'actual' | 'exceeds' | 'not_actual';
  salePrice: number;
  tradeInAllowance: number;
  tradeInDescription: string;
  tradeInVin: string;
  tradeInPayoff: number;
  tax: number;
  titleFee: number;
  docFee: number;
  registrationFee: number;
  otherFees: number;
  otherFeesDescription: string;
  paymentMethod: 'Cash' | 'Certified Check' | 'Cashier Check' | 'Zelle' | 'CashApp' | 'Financing' | 'Other';
  paymentMethodOther: string;
  conditionType: 'as_is' | 'warranty';
  warrantyDuration: string;
  warrantyDescription: string;
}

export function calculateBillOfSale(data: BillOfSaleData) {
  const netTradeIn = Math.max(0, data.tradeInAllowance - data.tradeInPayoff);
  const balanceAfterTrade = Math.max(0, data.salePrice - netTradeIn);
  const feesSubtotal = data.tax + data.titleFee + data.docFee + data.registrationFee + data.otherFees;
  const totalDue = balanceAfterTrade + feesSubtotal;
  return { netTradeIn, balanceAfterTrade, feesSubtotal, totalDue };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
