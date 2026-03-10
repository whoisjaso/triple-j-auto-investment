import { SupabaseClient } from "@supabase/supabase-js";
import {
  Vehicle,
  VehicleRow,
  VehicleInsert,
  VehicleFilters,
  mapVehicleRow,
} from "@/types/database";

export type VehicleSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "year_asc"
  | "mileage_asc";

export async function getVehicles(
  client: SupabaseClient,
  filters: VehicleFilters = {},
  sort: VehicleSortOption = "newest"
): Promise<Vehicle[]> {
  let query = client.from("vehicles").select("*");

  // Apply sort
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "year_desc":
      query = query.order("year", { ascending: false });
      break;
    case "year_asc":
      query = query.order("year", { ascending: true });
      break;
    case "mileage_asc":
      query = query.order("mileage", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("date_added", { ascending: false });
      break;
  }

  // Default to available vehicles
  const status = filters.status ?? "Available";
  query = query.eq("status", status);

  if (filters.make) {
    query = query.ilike("make", filters.make);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte("price", filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte("price", filters.maxPrice);
  }

  if (filters.minYear !== undefined) {
    query = query.gte("year", filters.minYear);
  }

  if (filters.maxYear !== undefined) {
    query = query.lte("year", filters.maxYear);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`make.ilike.${term},model.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data as VehicleRow[]).map(mapVehicleRow);
}

export async function getVehicleBySlug(
  client: SupabaseClient,
  slug: string
): Promise<Vehicle | null> {
  const { data, error } = await client
    .from("vehicles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw error;
  }

  return mapVehicleRow(data as VehicleRow);
}

export async function getFeaturedVehicles(
  client: SupabaseClient,
  limit: number = 6
): Promise<Vehicle[]> {
  const { data, error } = await client
    .from("vehicles")
    .select("*")
    .eq("status", "Available")
    .order("date_added", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data as VehicleRow[]).map(mapVehicleRow);
}

// ============================================================
// Admin queries (no default status filter)
// ============================================================

export async function getAdminVehicles(
  client: SupabaseClient,
  filters: VehicleFilters = {}
): Promise<Vehicle[]> {
  let query = client
    .from("vehicles")
    .select("*")
    .order("date_added", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`make.ilike.${term},model.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as VehicleRow[]).map(mapVehicleRow);
}

export async function getVehicleById(
  client: SupabaseClient,
  id: string
): Promise<Vehicle | null> {
  const { data, error } = await client
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return mapVehicleRow(data as VehicleRow);
}

export async function adminCreateVehicle(
  client: SupabaseClient,
  data: VehicleInsert
): Promise<Vehicle> {
  const { data: row, error } = await client
    .from("vehicles")
    .insert(data)
    .select()
    .single();

  if (error) throw error;

  return mapVehicleRow(row as VehicleRow);
}

export async function adminUpdateVehicle(
  client: SupabaseClient,
  id: string,
  data: Partial<VehicleInsert>
): Promise<Vehicle> {
  const { data: row, error } = await client
    .from("vehicles")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return mapVehicleRow(row as VehicleRow);
}

export async function adminDeleteVehicle(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from("vehicles").delete().eq("id", id);

  if (error) throw error;
}
