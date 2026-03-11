"use server";

import { revalidatePath } from "next/cache";
import type { LeadSource, LeadStatus } from "@/types/database";

export type LeadFormState = {
  success: boolean;
  error?: string;
};

export async function submitLead(
  _prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const name = formData.get("name") as string | null;
  const phone = formData.get("phone") as string | null;
  const email = (formData.get("email") as string | null) || null;
  const message = (formData.get("message") as string | null) || null;
  const vehicleName = (formData.get("vehicleName") as string | null) || null;
  const source = (formData.get("source") as LeadSource) || "contact_form";

  // Validate required fields
  if (!name || name.trim().length < 2) {
    return { success: false, error: "Please enter your name." };
  }

  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) {
    return { success: false, error: "Please enter a valid phone number." };
  }

  const leadData = {
    name: name.trim(),
    phone: digits,
    email: email?.trim() || null,
    message: vehicleName
      ? `[Vehicle: ${vehicleName}] ${message?.trim() ?? ""}`.trim()
      : message?.trim() || null,
    vehicleId: null,
    source,
  };

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import("@/lib/supabase/server");
      const { createLead } = await import("@/lib/supabase/queries/leads");
      const supabase = await createClient();
      await createLead(supabase, leadData);
    } else {
      console.log("[Mock] Lead submitted:", leadData);
    }

    return { success: true };
  } catch (err) {
    console.error("Lead submission error:", err);
    return {
      success: false,
      error: "Something went wrong. Please call us directly at (832) 400-9760.",
    };
  }
}

// ============================================================
// Admin: update lead status
// ============================================================

const NEXT_STATUS: Record<LeadStatus, LeadStatus> = {
  New: "Contacted",
  Contacted: "Closed",
  Closed: "New",
};

export async function updateLeadStatusAction(
  formData: FormData
): Promise<void> {
  const id = formData.get("id") as string;
  const current = formData.get("status") as LeadStatus;
  const next = NEXT_STATUS[current] ?? "New";

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import("@/lib/supabase/server");
      const { updateLeadStatus } = await import(
        "@/lib/supabase/queries/leads"
      );
      const supabase = await createClient();
      await updateLeadStatus(supabase, id, next);
    } else {
      console.log(`[Mock] Lead ${id} status: ${current} → ${next}`);
    }
  } catch (err) {
    console.error("Lead status update error:", err);
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}
