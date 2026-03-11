"use server";

import { revalidatePath } from "next/cache";
import type { VehicleStatus } from "@/types/database";

export async function advanceVehicleStatusAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const vehicleId = formData.get("vehicleId") as string;
  const nextStatus = formData.get("nextStatus") as VehicleStatus;

  if (!vehicleId || !nextStatus) {
    return { success: false, error: "Missing vehicleId or nextStatus." };
  }

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import("@/lib/supabase/server");
      const { advanceVehicleStatus } = await import(
        "@/lib/supabase/queries/pipeline"
      );
      const supabase = await createClient();
      await advanceVehicleStatus(supabase, vehicleId, nextStatus);
    }
  } catch (err) {
    console.error("Advance status error:", err);
    return { success: false, error: "Failed to advance vehicle status." };
  }

  revalidatePath("/admin/pipeline");
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  return { success: true };
}
