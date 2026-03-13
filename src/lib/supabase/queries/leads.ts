import { SupabaseClient } from "@supabase/supabase-js";
import {
  Lead,
  LeadRow,
  LeadStatus,
  mapLeadRow,
  toLeadRow,
} from "@/types/database";

export async function createLead(
  client: SupabaseClient,
  lead: Omit<Lead, "id" | "createdAt" | "status" | "buyerName" | "buyerPhone"> & { buyerName?: string | null; buyerPhone?: string | null }
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

// ============================================================
// Admin queries
// ============================================================

export async function getAdminLeads(
  client: SupabaseClient,
  status?: LeadStatus
): Promise<Lead[]> {
  let query = client
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as LeadRow[]).map(mapLeadRow);
}

export async function getLeadStats(
  client: SupabaseClient
): Promise<{ totalVehicles: number; totalLeads: number; newLeads: number }> {
  const [vehiclesRes, leadsRes, newLeadsRes] = await Promise.all([
    client.from("vehicles").select("id", { count: "exact", head: true }),
    client.from("leads").select("id", { count: "exact", head: true }),
    client
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "New"),
  ]);

  return {
    totalVehicles: vehiclesRes.count ?? 0,
    totalLeads: leadsRes.count ?? 0,
    newLeads: newLeadsRes.count ?? 0,
  };
}

const ALL_STATUSES: LeadStatus[] = [
  "New", "Contacted", "Qualified", "Appointment", "Negotiation", "Sold", "Lost",
];

export async function getLeadCountsByStatus(
  client: SupabaseClient
): Promise<Record<LeadStatus, number>> {
  const counts = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, 0])
  ) as Record<LeadStatus, number>;

  const results = await Promise.all(
    ALL_STATUSES.map((status) =>
      client
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", status)
    )
  );

  ALL_STATUSES.forEach((status, i) => {
    counts[status] = results[i].count ?? 0;
  });

  return counts;
}

export async function updateLeadStatus(
  client: SupabaseClient,
  id: string,
  status: LeadStatus
): Promise<void> {
  const { error } = await client
    .from("leads")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}
