// ============================================================
// Vehicle
// ============================================================

export type VehicleStatus =
  | "Bidding"
  | "Purchased"
  | "In_Transit"
  | "Arrived"
  | "Inspection"
  | "Available"
  | "Pending"
  | "Sold";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  vin: string;
  status: VehicleStatus;
  description: string | null;
  imageUrl: string | null;
  gallery: string[];
  slug: string;
  bodyStyle: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  transmission: string | null;
  drivetrain: string | null;
  engine: string | null;
  fuelType: string | null;
  dateAdded: string;
  createdAt: string;
  updatedAt: string;
  // v0.2 Pipeline fields
  trim: string | null;
  purchasePrice: number | null;
  buyFee: number | null;
  totalCost: number | null;
  sellerName: string | null;
  auctionLocation: string | null;
  workOrderNumber: string | null;
  stockNumber: string | null;
  guaranteeExpiresAt: string | null;
  guaranteePrice: number | null;
  transportCarrier: string | null;
  transportLoadId: string | null;
  transportCost: number | null;
  transportPickupEta: string | null;
  transportDeliveryEta: string | null;
  sourceEmailId: string | null;
}

/** Row shape returned by Supabase (snake_case) */
export interface VehicleRow {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  vin: string;
  status: VehicleStatus;
  description: string | null;
  image_url: string | null;
  gallery: string[];
  slug: string;
  body_style: string | null;
  exterior_color: string | null;
  interior_color: string | null;
  transmission: string | null;
  drivetrain: string | null;
  engine: string | null;
  fuel_type: string | null;
  date_added: string;
  created_at: string;
  updated_at: string;
  // v0.2 Pipeline fields
  trim: string | null;
  purchase_price: number | null;
  buy_fee: number | null;
  total_cost: number | null;
  seller_name: string | null;
  auction_location: string | null;
  work_order_number: string | null;
  stock_number: string | null;
  guarantee_expires_at: string | null;
  guarantee_price: number | null;
  transport_carrier: string | null;
  transport_load_id: string | null;
  transport_cost: number | null;
  transport_pickup_eta: string | null;
  transport_delivery_eta: string | null;
  source_email_id: string | null;
}

// Pipeline columns are optional on insert (nullable in DB, no default)
type PipelineColumns =
  | "trim" | "purchase_price" | "buy_fee" | "total_cost"
  | "seller_name" | "auction_location" | "work_order_number" | "stock_number"
  | "guarantee_expires_at" | "guarantee_price"
  | "transport_carrier" | "transport_load_id" | "transport_cost"
  | "transport_pickup_eta" | "transport_delivery_eta" | "source_email_id";

export type VehicleInsert = Omit<
  VehicleRow,
  "id" | "created_at" | "updated_at" | "date_added" | PipelineColumns
> & Partial<Pick<VehicleRow, PipelineColumns>>;

// ============================================================
// Lead
// ============================================================

export type LeadStatus = "New" | "Contacted" | "Closed";

export type LeadSource =
  | "contact_form"
  | "financing_inquiry"
  | "vehicle_inquiry"
  | "schedule_visit";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  message: string | null;
  vehicleId: string | null;
  source: LeadSource;
  status: LeadStatus;
  createdAt: string;
}

/** Row shape returned by Supabase (snake_case) */
export interface LeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  message: string | null;
  vehicle_id: string | null;
  source: LeadSource;
  status: LeadStatus;
  created_at: string;
}

export type LeadInsert = Omit<LeadRow, "id" | "created_at">;

// ============================================================
// Query Filters
// ============================================================

export interface VehicleFilters {
  status?: VehicleStatus;
  make?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  search?: string;
}

// ============================================================
// Mappers (snake_case DB rows → camelCase app types)
// ============================================================

export function mapVehicleRow(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    price: Number(row.price),
    mileage: row.mileage,
    vin: row.vin,
    status: row.status,
    description: row.description,
    imageUrl: row.image_url,
    gallery: row.gallery ?? [],
    slug: row.slug,
    bodyStyle: row.body_style,
    exteriorColor: row.exterior_color,
    interiorColor: row.interior_color,
    transmission: row.transmission,
    drivetrain: row.drivetrain,
    engine: row.engine,
    fuelType: row.fuel_type,
    dateAdded: row.date_added,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // v0.2 Pipeline fields
    trim: row.trim,
    purchasePrice: row.purchase_price != null ? Number(row.purchase_price) : null,
    buyFee: row.buy_fee != null ? Number(row.buy_fee) : null,
    totalCost: row.total_cost != null ? Number(row.total_cost) : null,
    sellerName: row.seller_name,
    auctionLocation: row.auction_location,
    workOrderNumber: row.work_order_number,
    stockNumber: row.stock_number,
    guaranteeExpiresAt: row.guarantee_expires_at,
    guaranteePrice: row.guarantee_price != null ? Number(row.guarantee_price) : null,
    transportCarrier: row.transport_carrier,
    transportLoadId: row.transport_load_id,
    transportCost: row.transport_cost != null ? Number(row.transport_cost) : null,
    transportPickupEta: row.transport_pickup_eta,
    transportDeliveryEta: row.transport_delivery_eta,
    sourceEmailId: row.source_email_id,
  };
}

export function mapLeadRow(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    vehicleId: row.vehicle_id,
    source: row.source,
    status: row.status,
    createdAt: row.created_at,
  };
}

/** Convert camelCase LeadInsert to snake_case for Supabase */
export function toLeadRow(
  lead: Omit<Lead, "id" | "createdAt" | "status">
): LeadInsert {
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    message: lead.message,
    vehicle_id: lead.vehicleId,
    source: lead.source,
    status: "New",
  };
}
