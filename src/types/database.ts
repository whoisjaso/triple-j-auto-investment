// ============================================================
// Vehicle
// ============================================================

export type VehicleStatus = "Available" | "Pending" | "Sold";

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
}

export type VehicleInsert = Omit<
  VehicleRow,
  "id" | "created_at" | "updated_at" | "date_added"
>;

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
