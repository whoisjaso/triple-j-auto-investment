import { SupabaseClient } from "@supabase/supabase-js";
import { Lead, LeadRow, mapLeadRow, toLeadRow } from "@/types/database";

export async function createLead(
  client: SupabaseClient,
  lead: Omit<Lead, "id" | "createdAt" | "status">
): Promise<Lead> {
  const row = toLeadRow(lead);

  const { data, error } = await client
    .from("leads")
    .insert(row)
    .select()
    .single();

  if (error) throw error;

  return mapLeadRow(data as LeadRow);
}
