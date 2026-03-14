export interface RentalData {
  renterName: string;
  renterAddress: string;
  renterPhone: string;
  renterEmail: string;
  renterLicense: string;
  coRenterName: string;
  coRenterAddress: string;
  coRenterPhone: string;
  coRenterEmail: string;
  coRenterLicense: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleVin: string;
  vehiclePlate: string;
  mileageOut: string;
  mileageIn: string;
  fuelLevelOut: string;
  fuelLevelIn: string;
  rentalRate: number;
  rentalPeriod: 'Daily' | 'Weekly' | 'Monthly';
  rentalStartDate: string;
  rentalEndDate: string;
  securityDeposit: number;
  mileageAllowance: number;
  excessMileageCharge: number;
  insuranceFee: number;
  additionalDriverFee: number;
  tax: number;
  dueAtSigning: number;
}

export function calculateRentalDuration(
  startDate: string,
  endDate: string,
  period: 'Daily' | 'Weekly' | 'Monthly'
): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (period === 'Daily') return diffDays;
  if (period === 'Weekly') return Math.ceil(diffDays / 7);
  if (period === 'Monthly') return Math.ceil(diffDays / 30);
  return 0;
}

export function calculateRentalTotal(data: RentalData) {
  const duration = calculateRentalDuration(data.rentalStartDate, data.rentalEndDate, data.rentalPeriod);
  const baseRental = data.rentalRate * duration;
  const insuranceTotal = data.insuranceFee * duration;
  const additionalDriverTotal = data.additionalDriverFee * duration;
  const subtotal = baseRental + insuranceTotal + additionalDriverTotal;
  const taxAmount = subtotal * (data.tax / 100);
  const grandTotal = subtotal + taxAmount;
  const totalDue = grandTotal + data.securityDeposit;
  return { duration, baseRental, insuranceTotal, additionalDriverTotal, subtotal, taxAmount, grandTotal, totalDue };
}

export interface RentalPayment {
  paymentNumber: number;
  dueDate: string;
  rental: number;
  insurance: number;
  additionalDriver: number;
  tax: number;
  amountDue: number;
  balanceAfter: number;
}

export function generateRentalSchedule(data: RentalData): RentalPayment[] {
  const duration = calculateRentalDuration(data.rentalStartDate, data.rentalEndDate, data.rentalPeriod);
  if (!data.rentalStartDate || duration <= 0) return [];
  const totals = calculateRentalTotal(data);
  const perPeriodRental = data.rentalRate;
  const perPeriodInsurance = data.insuranceFee;
  const perPeriodAdditionalDriver = data.additionalDriverFee;
  const perPeriodSubtotal = perPeriodRental + perPeriodInsurance + perPeriodAdditionalDriver;
  const perPeriodTax = perPeriodSubtotal * (data.tax / 100);
  const perPeriodTotal = perPeriodSubtotal + perPeriodTax;
  let totalOwed = totals.grandTotal;
  const schedule: RentalPayment[] = [];
  let currentDate = new Date(data.rentalStartDate + 'T12:00:00');
  for (let i = 1; i <= duration; i++) {
    const balanceAfter = Math.max(0, totalOwed - perPeriodTotal);
    schedule.push({
      paymentNumber: i,
      dueDate: currentDate.toISOString().split('T')[0],
      rental: perPeriodRental,
      insurance: perPeriodInsurance,
      additionalDriver: perPeriodAdditionalDriver,
      tax: perPeriodTax,
      amountDue: perPeriodTotal,
      balanceAfter,
    });
    totalOwed = balanceAfter;
    if (data.rentalPeriod === 'Daily') currentDate.setDate(currentDate.getDate() + 1);
    else if (data.rentalPeriod === 'Weekly') currentDate.setDate(currentDate.getDate() + 7);
    else if (data.rentalPeriod === 'Monthly') currentDate.setMonth(currentDate.getMonth() + 1);
  }
  return schedule;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
