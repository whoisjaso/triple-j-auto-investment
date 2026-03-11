import { SupabaseClient } from "@supabase/supabase-js";
import {
  Vehicle,
  VehicleRow,
  VehicleStatus,
  mapVehicleRow,
} from "@/types/database";
import {
  PipelineStatus,
  VehicleEvent,
  VehicleEventRow,
  VehicleEventType,
  ParsedPurchase,
  ParsedGuarantee,
  ParsedTransport,
  mapVehicleEventRow,
} from "@/types/pipeline";
import { decodeVin } from "@/lib/nhtsa";

// ============================================================
// Vehicle creation from parsed email data
// ============================================================

function generatePipelineSlug(
  year: number,
  make: string,
  model: string,
  vin: string
): string {
  const suffix = vin.slice(-6).toLowerCase();
  return `${year}-${make}-${model}-${suffix}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createVehicleFromPurchase(
  client: SupabaseClient,
  parsed: ParsedPurchase,
  sourceEmailId?: string
): Promise<Vehicle> {
  // Auto-fill specs from NHTSA VIN decoder
  let nhtsa: Awaited<ReturnType<typeof decodeVin>> | null = null;
  try {
    nhtsa = await decodeVin(parsed.vin);
  } catch {
    // NHTSA may be unavailable — proceed with email data only
  }

  const slug = generatePipelineSlug(
    parsed.year,
    parsed.make,
    parsed.model,
    parsed.vin
  );

  // Email data takes priority; NHTSA fills gaps
  const insertData = {
    vin: parsed.vin,
    year: parsed.year,
    make: parsed.make,
    model: parsed.model,
    price: 0, // Retail price not set until listing — admin sets this
    mileage: parsed.mileage ?? 0,
    status: "Purchased" as VehicleStatus,
    slug,
    description: null,
    image_url: null,
    gallery: [] as string[],
    // Email data
    trim: parsed.trim,
    body_style: parsed.bodyStyle ?? nhtsa?.bodyStyle ?? null,
    exterior_color: parsed.exteriorColor,
    interior_color: parsed.interiorColor,
    // NHTSA auto-fill for specs
    engine: nhtsa?.engine ?? null,
    transmission: nhtsa?.transmission ?? null,
    drivetrain: nhtsa?.drivetrain ?? null,
    fuel_type: nhtsa?.fuelType ?? null,
    // Pipeline fields
    purchase_price: parsed.purchasePrice,
    buy_fee: parsed.buyFee,
    total_cost: parsed.totalCost,
    seller_name: parsed.sellerName,
    auction_location: parsed.auctionLocation,
    work_order_number: parsed.workOrderNumber,
    stock_number: parsed.stockNumber,
    source_email_id: sourceEmailId ?? null,
  };

  const { data: row, error } = await client
    .from("vehicles")
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;

  const vehicle = mapVehicleRow(row as VehicleRow);

  // Log the purchase event
  await logVehicleEvent(client, vehicle.id, "purchased", {
    parsed,
    nhtsa_decoded: !!nhtsa,
  }, sourceEmailId);

  return vehicle;
}

// ============================================================
// Vehicle updates from parsed email data
// ============================================================

export async function updateVehicleFromGuarantee(
  client: SupabaseClient,
  parsed: ParsedGuarantee,
  sourceEmailId?: string
): Promise<Vehicle | null> {
  // Find vehicle by VIN
  const { data: existing } = await client
    .from("vehicles")
    .select("id")
    .eq("vin", parsed.vin)
    .single();

  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (parsed.guaranteeExpiration) {
    updateData.guarantee_expires_at = parsed.guaranteeExpiration;
  }
  if (parsed.guaranteePrice != null) {
    updateData.guarantee_price = parsed.guaranteePrice;
  }

  if (Object.keys(updateData).length > 0) {
    const { error } = await client
      .from("vehicles")
      .update(updateData)
      .eq("id", existing.id);

    if (error) throw error;
  }

  await logVehicleEvent(
    client,
    existing.id,
    "guarantee_confirmed",
    { parsed },
    sourceEmailId
  );

  // Return updated vehicle
  const { data: row, error } = await client
    .from("vehicles")
    .select("*")
    .eq("id", existing.id)
    .single();

  if (error) throw error;
  return mapVehicleRow(row as VehicleRow);
}

export async function updateVehicleFromTransport(
  client: SupabaseClient,
  parsed: ParsedTransport,
  sourceEmailId?: string
): Promise<Vehicle[]> {
  const updatedVehicles: Vehicle[] = [];

  // Map transport status to vehicle status
  const newStatus: VehicleStatus =
    parsed.transportStatus === "DELIVERED" ? "Arrived" : "In_Transit";

  // Map transport status to event type
  const eventType: VehicleEventType =
    parsed.transportStatus === "DELIVERED"
      ? "transport_delivered"
      : parsed.transportStatus === "PICKED_UP"
        ? "transport_picked_up"
        : "transport_accepted";

  for (const tv of parsed.vehicles) {
    if (!tv.vin) continue;

    const { data: existing } = await client
      .from("vehicles")
      .select("id")
      .eq("vin", tv.vin)
      .single();

    if (!existing) continue;

    const updateData: Record<string, unknown> = {
      status: newStatus,
      transport_carrier: parsed.carrierName,
      transport_load_id: parsed.loadId,
    };

    if (parsed.transportPrice != null) {
      updateData.transport_cost = parsed.transportPrice;
    }
    if (parsed.carrierPickupEta) {
      updateData.transport_pickup_eta = parsed.carrierPickupEta;
    }
    if (parsed.carrierDeliveryEta) {
      updateData.transport_delivery_eta = parsed.carrierDeliveryEta;
    }

    const { error } = await client
      .from("vehicles")
      .update(updateData)
      .eq("id", existing.id);

    if (error) throw error;

    await logVehicleEvent(
      client,
      existing.id,
      eventType,
      { parsed, vehicle_vin: tv.vin },
      sourceEmailId
    );

    const { data: row, error: fetchError } = await client
      .from("vehicles")
      .select("*")
      .eq("id", existing.id)
      .single();

    if (fetchError) throw fetchError;
    updatedVehicles.push(mapVehicleRow(row as VehicleRow));
  }

  return updatedVehicles;
}

// ============================================================
// Event logging
// ============================================================

async function logVehicleEvent(
  client: SupabaseClient,
  vehicleId: string,
  eventType: VehicleEventType,
  eventData: Record<string, unknown>,
  sourceEmailId?: string
): Promise<void> {
  const { error } = await client.from("vehicle_events").insert({
    vehicle_id: vehicleId,
    event_type: eventType,
    event_data: eventData,
    source_email_id: sourceEmailId ?? null,
  });

  if (error) {
    console.error("Failed to log vehicle event:", error);
  }
}

// ============================================================
// Pipeline queries
// ============================================================

export async function getVehicleEvents(
  client: SupabaseClient,
  vehicleId: string
): Promise<VehicleEvent[]> {
  const { data, error } = await client
    .from("vehicle_events")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as VehicleEventRow[]).map(mapVehicleEventRow);
}

export async function getPipelineVehicles(
  client: SupabaseClient
): Promise<Vehicle[]> {
  const { data, error } = await client
    .from("vehicles")
    .select("*")
    .in("status", ["Bidding", "Purchased", "In_Transit", "Arrived", "Inspection"])
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data as VehicleRow[]).map(mapVehicleRow);
}

export async function advanceVehicleStatus(
  client: SupabaseClient,
  vehicleId: string,
  newStatus: PipelineStatus | VehicleStatus,
  notes?: string
): Promise<Vehicle> {
  // Get current status for the event log
  const { data: current, error: fetchError } = await client
    .from("vehicles")
    .select("status")
    .eq("id", vehicleId)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await client
    .from("vehicles")
    .update({ status: newStatus })
    .eq("id", vehicleId);

  if (error) throw error;

  await logVehicleEvent(client, vehicleId, "status_changed", {
    from: current.status,
    to: newStatus,
    notes: notes ?? null,
  });

  const { data: row, error: refetchError } = await client
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .single();

  if (refetchError) throw refetchError;
  return mapVehicleRow(row as VehicleRow);
}

export async function getVehicleByVin(
  client: SupabaseClient,
  vin: string
): Promise<Vehicle | null> {
  const { data, error } = await client
    .from("vehicles")
    .select("*")
    .eq("vin", vin.toUpperCase())
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return mapVehicleRow(data as VehicleRow);
}
