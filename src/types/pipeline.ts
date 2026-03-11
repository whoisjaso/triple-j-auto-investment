import type { VehicleStatus } from "./database";

// ============================================================
// Pipeline Status (pre-listing lifecycle stages)
// ============================================================

export type PipelineStatus = Extract<
  VehicleStatus,
  "Bidding" | "Purchased" | "In_Transit" | "Arrived" | "Inspection"
>;

// ============================================================
// Vehicle Events
// ============================================================

export type VehicleEventType =
  | "high_bid"
  | "purchased"
  | "guarantee_confirmed"
  | "transport_accepted"
  | "transport_picked_up"
  | "transport_delivered"
  | "arrived"
  | "inspection_started"
  | "listed"
  | "status_changed";

export interface VehicleEvent {
  id: string;
  vehicleId: string;
  eventType: VehicleEventType;
  eventData: Record<string, unknown>;
  sourceEmailId: string | null;
  createdAt: string;
}

export interface VehicleEventRow {
  id: string;
  vehicle_id: string;
  event_type: VehicleEventType;
  event_data: Record<string, unknown>;
  source_email_id: string | null;
  created_at: string;
}

export function mapVehicleEventRow(row: VehicleEventRow): VehicleEvent {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    eventType: row.event_type,
    eventData: row.event_data,
    sourceEmailId: row.source_email_id,
    createdAt: row.created_at,
  };
}

// ============================================================
// Parsed Email Data Types
// ============================================================

export interface ParsedPurchase {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  mileage: number | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  bodyStyle: string | null;
  pickupLocation: string | null;
  workOrderNumber: string | null;
  stockNumber: string | null;
  purchasePrice: number | null;
  buyFee: number | null;
  totalCost: number | null;
  auctionLocation: string | null;
  sellerName: string | null;
  purchaseDate: string | null;
}

export interface ParsedGuarantee {
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  odometer: number | null;
  vehiclePurchasePrice: number | null;
  dateGuaranteed: string | null;
  guaranteeExpiration: string | null;
  guaranteePrice: number | null;
  location: string | null;
}

export type TransportStatus = "ACCEPTED" | "PICKED_UP" | "DELIVERED";

export interface TransportVehicle {
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
}

export interface ParsedTransport {
  loadId: string;
  transportStatus: TransportStatus;
  carrierName: string;
  pickupLocation: string | null;
  deliveryLocation: string | null;
  requestedPickupDate: string | null;
  requestedDeliveryDate: string | null;
  carrierPickupEta: string | null;
  carrierDeliveryEta: string | null;
  transportPrice: number | null;
  vehicles: TransportVehicle[];
}

// ============================================================
// Email Classification
// ============================================================

export type EmailType =
  | "purchase"
  | "high_bid"
  | "guarantee"
  | "transport_accepted"
  | "transport_picked_up"
  | "transport_delivered"
  | "sale_documents"
  | "unknown";

export interface EmailClassification {
  type: EmailType;
  confidence: "high" | "medium" | "low";
}

export function classifyEmail(
  sender: string,
  subject: string
): EmailClassification {
  const from = sender.toLowerCase();
  const subj = subject.toLowerCase();

  // OVE.com / Manheim
  if (from.includes("support@ove.com")) {
    if (subj.includes("purchase confirmation")) {
      return { type: "purchase", confidence: "high" };
    }
    if (subj.includes("high bidder")) {
      return { type: "high_bid", confidence: "high" };
    }
  }

  // DealShield
  if (from.includes("protected@dealshield.com")) {
    if (subj.includes("purchase confirmation") && subj.includes("vin:")) {
      return { type: "guarantee", confidence: "high" };
    }
  }

  // Central Dispatch
  if (from.includes("do-not-reply@centraldispatch.com") || from.includes("centraldispatch.com")) {
    if (subj.includes("has been accepted")) {
      return { type: "transport_accepted", confidence: "high" };
    }
    if (subj.includes("has been picked up")) {
      return { type: "transport_picked_up", confidence: "high" };
    }
    if (subj.includes("has been delivered")) {
      return { type: "transport_delivered", confidence: "high" };
    }
  }

  // Manheim sale documents
  if (from.includes("noreply@manheim.com")) {
    if (subj.includes("sale documents")) {
      return { type: "sale_documents", confidence: "high" };
    }
  }

  return { type: "unknown", confidence: "low" };
}
