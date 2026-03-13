import { SupabaseClient } from "@supabase/supabase-js";
import type {
  Lead,
  LeadRow,
  LeadStatus,
  LeadNote,
  LeadNoteRow,
  LeadTask,
  LeadTaskRow,
  NoteType,
} from "@/types/database";
import { mapLeadRow, mapLeadNoteRow, mapLeadTaskRow } from "@/types/database";

// ============================================================
// Lead Detail
// ============================================================

export async function getLeadById(
  client: SupabaseClient,
  id: string
): Promise<Lead | null> {
  const { data, error } = await client
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }

  return mapLeadRow(data as LeadRow);
}

export async function updateLeadStatusCrm(
  client: SupabaseClient,
  leadId: string,
  newStatus: LeadStatus
): Promise<void> {
  const { error } = await client
    .from("leads")
    .update({ status: newStatus })
    .eq("id", leadId);

  if (error) throw error;
}

export async function updateLeadBuyerInfo(
  client: SupabaseClient,
  leadId: string,
  buyerName: string,
  buyerPhone: string
): Promise<void> {
  const { error } = await client
    .from("leads")
    .update({ buyer_name: buyerName, buyer_phone: buyerPhone, status: "Sold" })
    .eq("id", leadId);

  if (error) throw error;
}

// ============================================================
// Lead Notes
// ============================================================

export async function getLeadNotes(
  client: SupabaseClient,
  leadId: string
): Promise<LeadNote[]> {
  const { data, error } = await client
    .from("lead_notes")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as LeadNoteRow[]).map(mapLeadNoteRow);
}

export async function createLeadNote(
  client: SupabaseClient,
  leadId: string,
  content: string,
  noteType: NoteType
): Promise<LeadNote> {
  const { data, error } = await client
    .from("lead_notes")
    .insert({ lead_id: leadId, content, note_type: noteType })
    .select()
    .single();

  if (error) throw error;
  return mapLeadNoteRow(data as LeadNoteRow);
}

// ============================================================
// Lead Tasks
// ============================================================

export async function getLeadTasks(
  client: SupabaseClient,
  leadId: string
): Promise<LeadTask[]> {
  const { data, error } = await client
    .from("lead_tasks")
    .select("*")
    .eq("lead_id", leadId)
    .order("completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as LeadTaskRow[]).map(mapLeadTaskRow);
}

export async function createLeadTask(
  client: SupabaseClient,
  leadId: string,
  title: string,
  dueDate: string | null
): Promise<LeadTask> {
  const { data, error } = await client
    .from("lead_tasks")
    .insert({
      lead_id: leadId,
      title,
      due_date: dueDate || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapLeadTaskRow(data as LeadTaskRow);
}

export async function completeLeadTask(
  client: SupabaseClient,
  taskId: string
): Promise<void> {
  const { error } = await client
    .from("lead_tasks")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw error;
}
