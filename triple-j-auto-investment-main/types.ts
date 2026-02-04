
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

// ================================================================
// REGISTRATION STATUS LEDGER TYPES
// ================================================================

export type RegistrationStageKey =
  | 'payment'
  | 'insurance'
  | 'inspection'
  | 'submission'
  | 'dmv_processing'
  | 'approved'
  | 'ready';

export type RegistrationStageStatus = 'waiting' | 'pending' | 'complete' | 'blocked';

export type RegistrationOwnership = 'customer' | 'dealer' | 'state';

export interface RegistrationStage {
  id: string;
  registrationId: string;
  stageKey: RegistrationStageKey;
  stageLabel: string;
  stageOrder: number;
  status: RegistrationStageStatus;
  ownership: RegistrationOwnership;
  startedAt?: string;
  completedAt?: string;
  blockedReason?: string;
  actionRequired?: string;
  actionUrl?: string;
  internalNotes?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  orderId: string;
  vehicleId?: string;

  // Customer Info
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;

  // Vehicle Info (snapshot)
  vin: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;

  // Status
  currentStage: RegistrationStageKey;
  currentStatus: RegistrationStageStatus;

  // Timestamps
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;

  // Related data (populated on fetch)
  stages?: RegistrationStage[];
}

export interface RegistrationDocument {
  id: string;
  registrationId: string;
  stageKey: RegistrationStageKey;
  documentType: string;
  documentName?: string;
  fileUrl: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  uploadedBy: 'customer' | 'admin';
  createdAt: string;
}

export interface RegistrationNotification {
  id: string;
  registrationId: string;
  notificationType: 'stage_complete' | 'action_required' | 'blocked' | 'ready_pickup';
  channel: 'sms' | 'email';
  recipient: string;
  message: string;
  sentAt: string;
  delivered?: boolean;
  deliveryError?: string;
  triggeredBy: 'admin_action' | 'auto' | 'system';
  createdAt: string;
}

// Stage Configuration for UI rendering
export interface StageConfig {
  key: RegistrationStageKey;
  label: string;
  ownership: RegistrationOwnership;
  ownershipLabel: string;
  description: string;
  actionRequiredText?: string;
  expectedDuration?: string;
}

export const REGISTRATION_STAGES: StageConfig[] = [
  {
    key: 'payment',
    label: 'Payment Received',
    ownership: 'dealer',
    ownershipLabel: 'Triple J Processing',
    description: 'Your investment is secured.'
  },
  {
    key: 'insurance',
    label: 'Insurance Verified',
    ownership: 'customer',
    ownershipLabel: 'Your Action Required',
    description: 'Please provide your proof of insurance.',
    actionRequiredText: 'Upload Insurance'
  },
  {
    key: 'inspection',
    label: 'Inspection Complete',
    ownership: 'customer',
    ownershipLabel: 'Your Action Required',
    description: 'Please complete your vehicle inspection.',
    actionRequiredText: 'Complete Inspection'
  },
  {
    key: 'submission',
    label: 'Dealer Submission',
    ownership: 'dealer',
    ownershipLabel: 'Triple J Processing',
    description: 'We are preparing your registration package.'
  },
  {
    key: 'dmv_processing',
    label: 'DMV Processing',
    ownership: 'state',
    ownershipLabel: 'State Processing',
    description: 'Your registration is in the state queue.',
    expectedDuration: '5-10 business days'
  },
  {
    key: 'approved',
    label: 'Registration Approved',
    ownership: 'state',
    ownershipLabel: 'State Processing',
    description: 'Your registration has been approved.'
  },
  {
    key: 'ready',
    label: 'Ready for Delivery',
    ownership: 'dealer',
    ownershipLabel: 'Triple J Processing',
    description: 'Your plates are ready for pickup.',
    actionRequiredText: 'Schedule Pickup'
  }
];

// Helper to get stage config by key
export const getStageConfig = (key: RegistrationStageKey): StageConfig | undefined => {
  return REGISTRATION_STAGES.find(s => s.key === key);
};

// Ownership color mapping for UI
export const OWNERSHIP_COLORS: Record<RegistrationOwnership, { bg: string; text: string; border: string }> = {
  customer: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
  dealer: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  state: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' }
};

// Status color mapping for UI
export const STATUS_COLORS: Record<RegistrationStageStatus, { bg: string; text: string; icon: string }> = {
  waiting: { bg: 'bg-gray-800', text: 'text-gray-500', icon: 'circle' },
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: 'clock' },
  complete: { bg: 'bg-green-500/20', text: 'text-green-400', icon: 'check-circle' },
  blocked: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'alert-circle' }
};
