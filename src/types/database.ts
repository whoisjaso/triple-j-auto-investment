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
  // Business / inventory fields
  conditionNotes: string | null;
  titleType: string | null;
  mechanicalCost: number | null;
  cosmeticCost: number | null;
  otherCosts: number | null;
  dateListed: string | null;
  dateSold: string | null;
  salePrice: number | null;
  sellingFees: number | null;
  netProfit: number | null;
  weightLbs: number | null;
  licensePlate: string | null;
  buyerName: string | null;
  buyerPhone: string | null;
  leadSourceName: string | null;
  daysInStock: number | null;
  targetListPrice: number | null;
  floorPrice: number | null;
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
  // Business / inventory fields
  condition_notes: string | null;
  title_type: string | null;
  mechanical_cost: number | null;
  cosmetic_cost: number | null;
  other_costs: number | null;
  date_listed: string | null;
  date_sold: string | null;
  sale_price: number | null;
  selling_fees: number | null;
  net_profit: number | null;
  weight_lbs: number | null;
  license_plate: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  lead_source_name: string | null;
  days_in_stock: number | null;
  target_list_price: number | null;
  floor_price: number | null;
}

// Pipeline columns are optional on insert (nullable in DB, no default)
type PipelineColumns =
  | "trim" | "purchase_price" | "buy_fee" | "total_cost"
  | "seller_name" | "auction_location" | "work_order_number" | "stock_number"
  | "guarantee_expires_at" | "guarantee_price"
  | "transport_carrier" | "transport_load_id" | "transport_cost"
  | "transport_pickup_eta" | "transport_delivery_eta" | "source_email_id"
  | "condition_notes" | "title_type" | "mechanical_cost" | "cosmetic_cost" | "other_costs"
  | "date_listed" | "date_sold" | "sale_price" | "selling_fees" | "net_profit"
  | "weight_lbs" | "license_plate" | "buyer_name" | "buyer_phone" | "lead_source_name"
  | "days_in_stock" | "target_list_price" | "floor_price";

export type VehicleInsert = Omit<
  VehicleRow,
  "id" | "created_at" | "updated_at" | "date_added" | PipelineColumns
> & Partial<Pick<VehicleRow, PipelineColumns>>;

// ============================================================
// Lead
// ============================================================

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Appointment"
  | "Negotiation"
  | "Sold"
  | "Lost";

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
// Lead Notes (CRM Communication Log)
// ============================================================

export type NoteType = "call" | "text" | "email" | "visit" | "note";

export interface LeadNote {
  id: string;
  leadId: string;
  content: string;
  noteType: NoteType;
  createdAt: string;
}

export interface LeadNoteRow {
  id: string;
  lead_id: string;
  content: string;
  note_type: NoteType;
  created_at: string;
}

export function mapLeadNoteRow(row: LeadNoteRow): LeadNote {
  return {
    id: row.id,
    leadId: row.lead_id,
    content: row.content,
    noteType: row.note_type,
    createdAt: row.created_at,
  };
}

// ============================================================
// Lead Tasks (CRM Follow-up Reminders)
// ============================================================

export interface LeadTask {
  id: string;
  leadId: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface LeadTaskRow {
  id: string;
  lead_id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export function mapLeadTaskRow(row: LeadTaskRow): LeadTask {
  return {
    id: row.id,
    leadId: row.lead_id,
    title: row.title,
    dueDate: row.due_date,
    completed: row.completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

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
    // Business / inventory fields
    conditionNotes: row.condition_notes,
    titleType: row.title_type,
    mechanicalCost: row.mechanical_cost != null ? Number(row.mechanical_cost) : null,
    cosmeticCost: row.cosmetic_cost != null ? Number(row.cosmetic_cost) : null,
    otherCosts: row.other_costs != null ? Number(row.other_costs) : null,
    dateListed: row.date_listed,
    dateSold: row.date_sold,
    salePrice: row.sale_price != null ? Number(row.sale_price) : null,
    sellingFees: row.selling_fees != null ? Number(row.selling_fees) : null,
    netProfit: row.net_profit != null ? Number(row.net_profit) : null,
    weightLbs: row.weight_lbs,
    licensePlate: row.license_plate,
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    leadSourceName: row.lead_source_name,
    daysInStock: row.days_in_stock,
    targetListPrice: row.target_list_price != null ? Number(row.target_list_price) : null,
    floorPrice: row.floor_price != null ? Number(row.floor_price) : null,
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
