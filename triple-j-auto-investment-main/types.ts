
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
  | 'sale_complete'
  | 'documents_collected'
  | 'submitted_to_dmv'
  | 'dmv_processing'
  | 'sticker_ready'
  | 'sticker_delivered'
  | 'rejected';

export type RegistrationStageStatus = 'in_progress' | 'complete';

export type RegistrationOwnership = 'dealer' | 'state';

export interface Registration {
  id: string;
  orderId: string;
  vehicleId?: string;
  billOfSaleId?: string;

  // Customer Info
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;

  // Vehicle Info (snapshot)
  vin: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  plateNumber?: string;

  // Token-based access
  accessToken: string;
  tokenExpiresAt?: string;

  // Vehicle type for icon
  vehicleBodyType?: string;

  // Document Checklist
  docTitleFront: boolean;
  docTitleBack: boolean;
  doc130u: boolean;
  docInsurance: boolean;
  docInspection: boolean;

  // Status
  currentStage: RegistrationStageKey;

  // Milestone Dates
  saleDate?: string;
  submissionDate?: string;
  approvalDate?: string;
  deliveryDate?: string;

  // Notes
  notes?: string;
  rejectionNotes?: string;

  // Metadata
  isArchived: boolean;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

// Valid stage transitions (forward-only except rejected -> submitted_to_dmv)
export const VALID_TRANSITIONS: Record<RegistrationStageKey, RegistrationStageKey[]> = {
  'sale_complete': ['documents_collected'],
  'documents_collected': ['submitted_to_dmv'],
  'submitted_to_dmv': ['dmv_processing'],
  'dmv_processing': ['sticker_ready', 'rejected'],
  'sticker_ready': ['sticker_delivered'],
  'sticker_delivered': [],
  'rejected': ['submitted_to_dmv']
};

// Audit trail record for registration changes
export interface RegistrationAudit {
  id: string;
  registrationId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  changedFields?: Record<string, { old: unknown; new: unknown }>;
  fullOldRecord?: Registration;
  fullNewRecord?: Registration;
  changedBy?: string;
  changedAt: string;
  changeReason?: string;
  createdAt: string;
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
  expectedDuration?: string;
  order: number;
}

export const REGISTRATION_STAGES: StageConfig[] = [
  {
    key: 'sale_complete',
    label: 'Sale Complete',
    ownership: 'dealer',
    ownershipLabel: 'Triple J',
    description: 'Vehicle sold, plates assigned from dealer inventory.',
    order: 1
  },
  {
    key: 'documents_collected',
    label: 'Documents Collected',
    ownership: 'dealer',
    ownershipLabel: 'Triple J',
    description: 'All paperwork received (title, 130-U, insurance, inspection).',
    order: 2
  },
  {
    key: 'submitted_to_dmv',
    label: 'Submitted to DMV',
    ownership: 'dealer',
    ownershipLabel: 'Triple J',
    description: 'Packet uploaded to webDEALER.',
    order: 3
  },
  {
    key: 'dmv_processing',
    label: 'DMV Processing',
    ownership: 'state',
    ownershipLabel: 'State',
    description: 'Awaiting DMV review.',
    expectedDuration: '5-10 business days',
    order: 4
  },
  {
    key: 'sticker_ready',
    label: 'Sticker Ready',
    ownership: 'dealer',
    ownershipLabel: 'Triple J',
    description: 'Registration approved, sticker available for pickup/delivery.',
    order: 5
  },
  {
    key: 'sticker_delivered',
    label: 'Sticker Delivered',
    ownership: 'dealer',
    ownershipLabel: 'Triple J',
    description: 'Customer received their sticker.',
    order: 6
  },
  {
    key: 'rejected',
    label: 'Rejected',
    ownership: 'state',
    ownershipLabel: 'State',
    description: 'DMV rejected submission. Review notes and resubmit.',
    order: 0 // Special case, branches from dmv_processing
  }
];

// Helper to get stage config by key
export const getStageConfig = (key: RegistrationStageKey): StageConfig | undefined => {
  return REGISTRATION_STAGES.find(s => s.key === key);
};

// Ownership color mapping for UI
export const OWNERSHIP_COLORS: Record<RegistrationOwnership, { bg: string; text: string; border: string }> = {
  dealer: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  state: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' }
};

// Status color mapping for UI
export const STATUS_COLORS: Record<RegistrationStageStatus, { bg: string; text: string; icon: string }> = {
  in_progress: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: 'clock' },
  complete: { bg: 'bg-green-500/20', text: 'text-green-400', icon: 'check-circle' }
};

// Stage-specific colors (for rejected state)
export const STAGE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'alert-circle' }
};
