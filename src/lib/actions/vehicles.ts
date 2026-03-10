"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { VehicleInsert, VehicleStatus } from "@/types/database";

export type VehicleFormState = {
  success: boolean;
  error?: string;
  message?: string;
};

function generateSlug(year: number, make: string, model: string): string {
  const base = `${year}-${make}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

function parseFormData(formData: FormData) {
  const make = (formData.get("make") as string)?.trim() || "";
  const model = (formData.get("model") as string)?.trim() || "";
  const yearStr = formData.get("year") as string;
  const priceStr = formData.get("price") as string;
  const mileageStr = formData.get("mileage") as string;
  const vin = ((formData.get("vin") as string) || "").trim().toUpperCase();
  const status = (formData.get("status") as VehicleStatus) || "Available";
  const description = (formData.get("description") as string)?.trim() || null;
  const imageUrl = (formData.get("imageUrl") as string)?.trim() || null;
  const galleryRaw = (formData.get("gallery") as string) || "";
  const gallery = galleryRaw
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  const engine = (formData.get("engine") as string)?.trim() || null;
  const transmission = (formData.get("transmission") as string)?.trim() || null;
  const drivetrain = (formData.get("drivetrain") as string)?.trim() || null;
  const bodyStyle = (formData.get("bodyStyle") as string)?.trim() || null;
  const fuelType = (formData.get("fuelType") as string)?.trim() || null;
  const exteriorColor = (formData.get("exteriorColor") as string)?.trim() || null;
  const interiorColor = (formData.get("interiorColor") as string)?.trim() || null;

  const year = parseInt(yearStr, 10);
  const price = parseFloat(priceStr);
  const mileage = parseInt(mileageStr, 10) || 0;

  return {
    make, model, year, price, mileage, vin, status,
    description, imageUrl, gallery,
    engine, transmission, drivetrain, bodyStyle, fuelType,
    exteriorColor, interiorColor,
  };
}

function validate(data: ReturnType<typeof parseFormData>): string | null {
  if (!data.make) return "Make is required.";
  if (!data.model) return "Model is required.";
  if (isNaN(data.year) || data.year < 1900 || data.year > 2030) return "Enter a valid year (1900–2030).";
  if (isNaN(data.price) || data.price <= 0) return "Enter a valid price.";
  return null;
}

export async function createVehicle(
  _prevState: VehicleFormState,
  formData: FormData
): Promise<VehicleFormState> {
  const data = parseFormData(formData);
  const error = validate(data);
  if (error) return { success: false, error };

  const slug = generateSlug(data.year, data.make, data.model);

  const insert: VehicleInsert = {
    make: data.make,
    model: data.model,
    year: data.year,
    price: data.price,
    mileage: data.mileage,
    vin: data.vin,
    status: data.status,
    description: data.description,
    image_url: data.imageUrl,
    gallery: data.gallery,
    slug,
    body_style: data.bodyStyle,
    exterior_color: data.exteriorColor,
    interior_color: data.interiorColor,
    transmission: data.transmission,
    drivetrain: data.drivetrain,
    engine: data.engine,
    fuel_type: data.fuelType,
  };

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import("@/lib/supabase/server");
      const { adminCreateVehicle } = await import("@/lib/supabase/queries/vehicles");
      const supabase = await createClient();
      await adminCreateVehicle(supabase, insert);
    } else {
      console.log("[Mock] Vehicle created:", insert);
    }
  } catch (err) {
    console.error("Create vehicle error:", err);
    return { success: false, error: "Failed to create vehicle. Please try again." };
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/inventory");
  redirect("/admin/inventory");
}

export async function updateVehicle(
  _prevState: VehicleFormState,
  formData: FormData
): Promise<VehicleFormState> {
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "Vehicle ID is missing." };

  const data = parseFormData(formData);
  const error = validate(data);
  if (error) return { success: false, error };

  const update: Partial<VehicleInsert> = {
    make: data.make,
    model: data.model,
    year: data.year,
    price: data.price,
    mileage: data.mileage,
    vin: data.vin,
    status: data.status,
    description: data.description,
    image_url: data.imageUrl,
    gallery: data.gallery,
    body_style: data.bodyStyle,
    exterior_color: data.exteriorColor,
    interior_color: data.interiorColor,
    transmission: data.transmission,
    drivetrain: data.drivetrain,
    engine: data.engine,
    fuel_type: data.fuelType,
  };

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import("@/lib/supabase/server");
      const { adminUpdateVehicle } = await import("@/lib/supabase/queries/vehicles");
      const supabase = await createClient();
      await adminUpdateVehicle(supabase, id, update);
    } else {
      console.log("[Mock] Vehicle updated:", { id, ...update });
    }
  } catch (err) {
    console.error("Update vehicle error:", err);
    return { success: false, error: "Failed to update vehicle. Please try again." };
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/inventory");
  redirect("/admin/inventory");
}

export async function deleteVehicle(
  formData: FormData
): Promise<VehicleFormState> {
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "Vehicle ID is missing." };

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import("@/lib/supabase/server");
      const { adminDeleteVehicle } = await import("@/lib/supabase/queries/vehicles");
      const supabase = await createClient();
      await adminDeleteVehicle(supabase, id);
    } else {
      console.log("[Mock] Vehicle deleted:", id);
    }
  } catch (err) {
    console.error("Delete vehicle error:", err);
    return { success: false, error: "Failed to delete vehicle." };
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/inventory");
  return { success: true, message: "Vehicle deleted." };
}
