"use server";

import { revalidatePath } from "next/cache";
import type { LeadStatus, NoteType } from "@/types/database";

export async function addNoteAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const leadId = formData.get("leadId") as string;
  const content = (formData.get("content") as string)?.trim();
  const noteType = (formData.get("noteType") as NoteType) || "note";

  if (!leadId || !content) {
    return { success: false, error: "Note content is required." };
  }

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import("@/lib/supabase/server");
      const { createLeadNote } = await import("@/lib/supabase/queries/crm");
      const supabase = await createClient();
      await createLeadNote(supabase, leadId, content, noteType);
    }
  } catch (err) {
    console.error("Add note error:", err);
    return { success: false, error: "Failed to add note." };
  }

  revalidatePath(`/admin/leads/${leadId}`);
  return { success: true };
}

export async function addTaskAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const leadId = formData.get("leadId") as string;
  const title = (formData.get("title") as string)?.trim();
  const dueDate = (formData.get("dueDate") as string) || null;

  if (!leadId || !title) {
    return { success: false, error: "Task title is required." };
  }

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import("@/lib/supabase/server");
      const { createLeadTask } = await import("@/lib/supabase/queries/crm");
      const supabase = await createClient();
      await createLeadTask(supabase, leadId, title, dueDate);
    }
  } catch (err) {
    console.error("Add task error:", err);
    return { success: false, error: "Failed to add task." };
  }

  revalidatePath(`/admin/leads/${leadId}`);
  return { success: true };
}

export async function completeTaskAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const taskId = formData.get("taskId") as string;
  const leadId = formData.get("leadId") as string;

  if (!taskId) {
    return { success: false, error: "Missing task ID." };
  }

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import("@/lib/supabase/server");
      const { completeLeadTask } = await import("@/lib/supabase/queries/crm");
      const supabase = await createClient();
      await completeLeadTask(supabase, taskId);
    }
  } catch (err) {
    console.error("Complete task error:", err);
    return { success: false, error: "Failed to complete task." };
  }

  revalidatePath(`/admin/leads/${leadId}`);
  return { success: true };
}

export async function changeLeadStatusAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const leadId = formData.get("leadId") as string;
  const newStatus = formData.get("newStatus") as LeadStatus;

  if (!leadId || !newStatus) {
    return { success: false, error: "Missing lead ID or status." };
  }

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import("@/lib/supabase/server");
      const { updateLeadStatusCrm } = await import(
        "@/lib/supabase/queries/crm"
      );
      const supabase = await createClient();
      await updateLeadStatusCrm(supabase, leadId, newStatus);
    }
  } catch (err) {
    console.error("Change status error:", err);
    return { success: false, error: "Failed to update status." };
  }

  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { success: true };
}
