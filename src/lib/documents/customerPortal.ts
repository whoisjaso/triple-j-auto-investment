import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { ContractData } from './finance';
import { RentalData } from './rental';
import { BillOfSaleData } from './billOfSale';
import { Form130UData } from './form130U';

export type CustomerSection = 'financing' | 'rental' | 'billOfSale' | 'form130U';

export interface CustomerLinkData {
  s: CustomerSection;
  d: Record<string, unknown>;
  ds?: string;
  dd?: string;
}

const dealerFields: Record<CustomerSection, string[]> = {
  financing: [
    'vehicleYear', 'vehicleMake', 'vehicleModel', 'vehicleVin', 'vehiclePlate', 'vehicleMileage',
    'cashPrice', 'downPayment', 'tax', 'titleFee', 'docFee',
    'apr', 'numberOfPayments', 'paymentFrequency', 'firstPaymentDate', 'dueAtSigning',
  ],
  rental: [
    'vehicleYear', 'vehicleMake', 'vehicleModel', 'vehicleVin', 'vehiclePlate',
    'mileageOut', 'fuelLevelOut', 'rentalRate', 'rentalPeriod', 'rentalStartDate', 'rentalEndDate',
    'securityDeposit', 'mileageAllowance', 'excessMileageCharge',
    'insuranceFee', 'additionalDriverFee', 'tax', 'dueAtSigning',
  ],
  billOfSale: [
    'saleDate', 'stockNumber',
    'vehicleYear', 'vehicleMake', 'vehicleModel', 'vehicleTrim',
    'vehicleVin', 'vehiclePlate', 'vehicleColor', 'vehicleBodyStyle', 'vehicleMileage',
    'odometerReading', 'odometerStatus',
    'salePrice', 'tradeInAllowance', 'tradeInDescription', 'tradeInVin', 'tradeInPayoff',
    'tax', 'titleFee', 'docFee', 'registrationFee', 'otherFees', 'otherFeesDescription',
    'paymentMethod', 'paymentMethodOther', 'conditionType', 'warrantyDuration', 'warrantyDescription',
  ],
  form130U: [
    'applicationType', 'vin', 'year', 'make', 'bodyStyle', 'model',
    'majorColor', 'minorColor', 'licensePlateNo', 'odometerReading', 'odometerBrand',
    'emptyWeight', 'carryingCapacity',
    'previousOwnerName', 'previousOwnerCity', 'previousOwnerState',
    'salesPrice', 'tradeInAllowance', 'taxRate', 'rebateOrIncentive',
    'tradeInDescription', 'tradeInVin', 'saleDate', 'remarks',
  ],
};

export const customerFields: Record<CustomerSection, string[]> = {
  financing: ['buyerName', 'buyerAddress', 'buyerPhone', 'buyerEmail', 'coBuyerName', 'coBuyerAddress', 'coBuyerPhone', 'coBuyerEmail'],
  rental: ['renterName', 'renterAddress', 'renterPhone', 'renterEmail', 'renterLicense', 'coRenterName', 'coRenterAddress', 'coRenterPhone', 'coRenterEmail', 'coRenterLicense', 'mileageIn', 'fuelLevelIn'],
  billOfSale: ['buyerName', 'buyerAddress', 'buyerCity', 'buyerState', 'buyerZip', 'buyerPhone', 'buyerEmail', 'buyerLicense', 'buyerLicenseState', 'coBuyerName', 'coBuyerAddress', 'coBuyerCity', 'coBuyerState', 'coBuyerZip', 'coBuyerPhone', 'coBuyerEmail', 'coBuyerLicense', 'coBuyerLicenseState'],
  form130U: ['applicantType', 'applicantIdNumber', 'applicantIdType', 'applicantIdState', 'applicantFirstName', 'applicantMiddleName', 'applicantLastName', 'applicantSuffix', 'applicantEntityName', 'coApplicantName', 'mailingAddress', 'mailingCity', 'mailingState', 'mailingZip', 'countyOfResidence', 'applicantDob', 'applicantPhone', 'applicantEmail', 'vehicleLocationAddress', 'vehicleLocationCity', 'vehicleLocationState', 'vehicleLocationZip', 'vehicleLocationCounty', 'vehicleLocationSameAsMailing', 'hasLien', 'lienholderName', 'lienholderAddress', 'lienholderCity', 'lienholderState', 'lienholderZip'],
};

export function encodeCustomerLink(
  section: CustomerSection,
  data: ContractData | RentalData | BillOfSaleData | Form130UData,
  baseUrl: string,
  dealerSignature?: string,
  dealerSignatureDate?: string,
): string {
  const fields = dealerFields[section];
  const dealerData: Record<string, unknown> = {};
  for (const key of fields) {
    dealerData[key] = (data as unknown as Record<string, unknown>)[key];
  }
  const payload: CustomerLinkData = { s: section, d: dealerData };
  if (dealerSignature && dealerSignature.length < 50000) {
    payload.ds = dealerSignature;
    payload.dd = dealerSignatureDate;
  }
  const json = JSON.stringify(payload);
  const compressed = compressToEncodedURIComponent(json);
  return `${baseUrl}/documents/portal#customer/${compressed}`;
}

export function decodeCustomerLink(hash: string): CustomerLinkData | null {
  try {
    const prefix = '#customer/';
    if (!hash.startsWith(prefix)) return null;
    const compressed = hash.slice(prefix.length);
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json) as CustomerLinkData;
  } catch { return null; }
}

export interface CompletedLinkData {
  s: CustomerSection;
  dd: Record<string, unknown>;
  cd: Record<string, unknown>;
  ds?: string;
  dsd?: string;
  bs?: string;
  bsd?: string;
  cs?: string;
  csd?: string;
  bi?: string;
  ack?: Record<string, boolean>;
}

export function encodeCompletedLink(
  section: CustomerSection,
  dealerData: Record<string, unknown>,
  customerData: Record<string, unknown>,
  baseUrl: string,
  dealerSignature?: string,
  dealerSignatureDate?: string,
  buyerSignature?: string,
  buyerSignatureDate?: string,
  coBuyerSignature?: string,
  coBuyerSignatureDate?: string,
  buyerIdPhoto?: string,
  acknowledgments?: Record<string, boolean>,
): string {
  const payload: CompletedLinkData = { s: section, dd: dealerData, cd: customerData };
  if (dealerSignature && dealerSignature.length < 50000) { payload.ds = dealerSignature; payload.dsd = dealerSignatureDate; }
  if (buyerSignature && buyerSignature.length < 50000) { payload.bs = buyerSignature; payload.bsd = buyerSignatureDate; }
  if (coBuyerSignature && coBuyerSignature.length < 50000) { payload.cs = coBuyerSignature; payload.csd = coBuyerSignatureDate; }
  if (buyerIdPhoto && buyerIdPhoto.length < 100000) { payload.bi = buyerIdPhoto; }
  if (acknowledgments) { payload.ack = acknowledgments; }
  const json = JSON.stringify(payload);
  const compressed = compressToEncodedURIComponent(json);
  return `${baseUrl}/documents/portal#completed/${compressed}`;
}

export function decodeCompletedLink(hash: string): CompletedLinkData | null {
  try {
    const prefix = '#completed/';
    if (!hash.startsWith(prefix)) return null;
    const compressed = hash.slice(prefix.length);
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json) as CompletedLinkData;
  } catch { return null; }
}

// ============================================================
// Shared agreement save helper (used by both admin and customer)
// ============================================================

export interface SaveAgreementParams {
  documentType: CustomerSection;
  data: Record<string, unknown>;
  status: 'pending' | 'completed';
  dealerSignature?: boolean;
  buyerSignature?: boolean;
  coBuyerSignature?: boolean;
  buyerIdPhoto?: boolean;
  acknowledgments?: Record<string, boolean>;
  completedLink?: string;
}

export async function saveAgreement(params: SaveAgreementParams): Promise<void> {
  const { data, documentType, status } = params;
  try {
    await fetch('/api/documents/agreements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_type: documentType,
        buyer_name: data.buyerName || data.renterName || null,
        buyer_email: data.buyerEmail || data.renterEmail || null,
        buyer_phone: data.buyerPhone || data.renterPhone || null,
        vehicle_description: [data.vehicleYear, data.vehicleMake, data.vehicleModel].filter(Boolean).join(' ') || null,
        vehicle_vin: (data.vehicleVin || data.vin || '') as string || null,
        status,
        acknowledgments: params.acknowledgments || {},
        has_buyer_signature: params.buyerSignature || false,
        has_cobuyer_signature: params.coBuyerSignature || false,
        has_dealer_signature: params.dealerSignature || false,
        has_buyer_id: params.buyerIdPhoto || false,
        completed_link: params.completedLink || null,
      }),
    });
  } catch {
    // Non-blocking — don't fail the send/complete flow
  }
}
