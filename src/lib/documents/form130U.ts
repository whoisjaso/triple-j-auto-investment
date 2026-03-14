import { BillOfSaleData } from './billOfSale';

export interface Form130UData {
  applicationType: 'titleAndRegistration' | 'titleOnly' | 'registrationOnly' | 'nontitle';
  vin: string;
  year: string;
  make: string;
  bodyStyle: string;
  model: string;
  majorColor: string;
  minorColor: string;
  licensePlateNo: string;
  odometerReading: string;
  odometerBrand: 'A' | 'N' | 'X';
  emptyWeight: string;
  carryingCapacity: string;
  applicantType: 'Individual' | 'Business' | 'Government' | 'Trust' | 'Non-Profit';
  applicantIdNumber: string;
  applicantIdType: string;
  applicantIdState: string;
  applicantFirstName: string;
  applicantMiddleName: string;
  applicantLastName: string;
  applicantSuffix: string;
  applicantEntityName: string;
  coApplicantName: string;
  mailingAddress: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  countyOfResidence: string;
  applicantDob: string;
  applicantPhone: string;
  applicantEmail: string;
  previousOwnerName: string;
  previousOwnerCity: string;
  previousOwnerState: string;
  vehicleLocationAddress: string;
  vehicleLocationCity: string;
  vehicleLocationState: string;
  vehicleLocationZip: string;
  vehicleLocationCounty: string;
  vehicleLocationSameAsMailing: boolean;
  lienholderName: string;
  lienholderAddress: string;
  lienholderCity: string;
  lienholderState: string;
  lienholderZip: string;
  hasLien: boolean;
  salesPrice: number;
  tradeInAllowance: number;
  taxRate: number;
  rebateOrIncentive: number;
  tradeInDescription: string;
  tradeInVin: string;
  saleDate: string;
  remarks: string;
}

export function calculateTax(data: Form130UData) {
  const netPrice = Math.max(0, data.salesPrice - data.tradeInAllowance - data.rebateOrIncentive);
  const taxDue = netPrice * (data.taxRate / 100);
  return { netPrice, taxDue };
}

export function prefillFromBillOfSale(bos: BillOfSaleData): Partial<Form130UData> {
  const odometerBrand: 'A' | 'N' | 'X' =
    bos.odometerStatus === 'actual' ? 'A' :
    bos.odometerStatus === 'exceeds' ? 'X' : 'N';
  const nameParts = bos.buyerName.trim().split(/\s+/);
  let firstName = '', middleName = '', lastName = '';
  if (nameParts.length === 1) firstName = nameParts[0];
  else if (nameParts.length === 2) { firstName = nameParts[0]; lastName = nameParts[1]; }
  else if (nameParts.length >= 3) { firstName = nameParts[0]; middleName = nameParts.slice(1, -1).join(' '); lastName = nameParts[nameParts.length - 1]; }
  return {
    vin: bos.vehicleVin, year: bos.vehicleYear, make: bos.vehicleMake, model: bos.vehicleModel,
    bodyStyle: bos.vehicleBodyStyle, majorColor: bos.vehicleColor,
    odometerReading: bos.odometerReading || bos.vehicleMileage, odometerBrand,
    applicantFirstName: firstName, applicantMiddleName: middleName, applicantLastName: lastName,
    applicantIdNumber: bos.buyerLicense, applicantIdType: 'DL', applicantIdState: bos.buyerLicenseState,
    mailingAddress: bos.buyerAddress, mailingCity: bos.buyerCity, mailingState: bos.buyerState, mailingZip: bos.buyerZip,
    applicantPhone: bos.buyerPhone, applicantEmail: bos.buyerEmail, coApplicantName: bos.coBuyerName,
    previousOwnerName: 'Triple J Auto Investment LLC', previousOwnerCity: 'Houston', previousOwnerState: 'TX',
    salesPrice: bos.salePrice, tradeInAllowance: bos.tradeInAllowance,
    tradeInDescription: bos.tradeInDescription, tradeInVin: bos.tradeInVin, saleDate: bos.saleDate,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
