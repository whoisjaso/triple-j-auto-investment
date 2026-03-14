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
