
export enum VehicleStatus {
  AVAILABLE = 'Available',
  PENDING = 'Pending',
  SOLD = 'Sold',
  WHOLESALE = 'Wholesale'
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number; // Listing Price
  
  // FINANCIALS
  cost: number; // Base Acquisition Cost
  costTowing?: number; // Logistics
  costMechanical?: number; // Repairs
  costCosmetic?: number; // Paint/Body
  costOther?: number; // Fees/Taxes
  
  soldPrice?: number; // Final Sale Price
  soldDate?: string; // ISO Date string
  dateAdded?: string; // ISO Date string for Aging Calculation
  
  mileage: number;
  vin: string;
  status: VehicleStatus;
  description: string;
  imageUrl: string;
  gallery?: string[]; 
  diagnostics?: string[];
  registrationStatus?: 'Pending' | 'Submitted' | 'Processing' | 'Completed';
  registrationDueDate?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: string; // VIN or General
  date: string;
  status: 'New' | 'Contacted' | 'Closed';
}

export interface User {
  email: string;
  isAdmin: boolean;
}

export interface VinResult {
  Make: string;
  Model: string;
  ModelYear: string;
  VehicleType: string;
  BodyClass?: string;
  DriveType?: string;
  EngineCylinders?: string;
  EngineHP?: string;
  FuelType?: string;
  PlantCountry?: string;
  Manufacturer?: string;
  Trim?: string;
  Series?: string;
  TransmissionStyle?: string;
  Doors?: string;
  ErrorCode?: string;
  ErrorText?: string;
}

// Photo ID Types for Form 130-U
export type PhotoIdType =
  | 'US_DRIVERS_LICENSE'
  | 'US_PASSPORT'
  | 'US_MILITARY_ID'
  | 'NATO_ID'
  | 'US_CITIZENSHIP_CERT'
  | 'PERMANENT_RESIDENT_CARD'
  | 'STATE_ID';

export const PHOTO_ID_LABELS: Record<PhotoIdType, string> = {
  'US_DRIVERS_LICENSE': 'U.S. Driver License',
  'US_PASSPORT': 'U.S. Passport',
  'US_MILITARY_ID': 'U.S. Military ID',
  'NATO_ID': 'NATO ID',
  'US_CITIZENSHIP_CERT': 'U.S. Citizenship Certificate',
  'PERMANENT_RESIDENT_CARD': 'Permanent Resident Card (Green Card)',
  'STATE_ID': 'State-Issued ID'
};

// Bill of Sale Types
export interface BillOfSaleData {
  date: string;
  amount: string;
  buyerName: string;
  buyerAddress: string;
  sellerName: string;
  sellerAddress: string;
  sellerRepresentative: string;
  year: string;
  make: string;
  model: string;
  bodyStyle: string;
  vin: string;
  licensePlate: string;
  odometer: string;
  emptyWeight: string;
  exteriorColor: string;
  exteriorColorHex?: string;
  interiorColor: string;
  interiorColorHex?: string;
  majorColor: string;           // Primary/Major color for Form 130-U
  minorColor: string;           // Secondary/Minor color for Form 130-U
  texasPlantNo: string;         // Texas Plant Number
  applicantIdType: PhotoIdType; // Type of photo ID presented
  applicantIdNumber: string;    // ID number
  notes: string;
  printLanguage: 'EN' | 'ES';
}

export interface AddressSuggestion {
  display_name: string;
  place_id: number;
}
