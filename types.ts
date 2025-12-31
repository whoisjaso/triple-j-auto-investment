
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
  notes: string;
  printLanguage: 'EN' | 'ES';
}

export interface AddressSuggestion {
  display_name: string;
  place_id: number;
}
