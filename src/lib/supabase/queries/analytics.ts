import { SupabaseClient } from "@supabase/supabase-js";
import {
  Vehicle,
  VehicleRow,
  LeadStatus,
  LeadSource,
  mapVehicleRow,
} from "@/types/database";

// ============================================================
// Types
// ============================================================

export interface VehicleProfitRow {
  id: string;
  year: number;
  make: string;
  model: string;
  purchasePrice: number | null;
  buyFee: number | null;
  totalCost: number | null;
  mechanicalCost: number | null;
  cosmeticCost: number | null;
  otherCosts: number | null;
  transportCost: number | null;
  salePrice: number | null;
  sellingFees: number | null;
  netProfit: number | null;
  daysInStock: number | null;
  // computed
  repairCost: number;
  totalInvested: number;
  profit: number;
  marginPct: number;
}

export interface KpiSummary {
  totalProfit: number;
  avgProfitPerVehicle: number;
  avgDaysOnLot: number;
  totalSold: number;
  conversionRate: number;
}

export interface FunnelStage {
  stage: LeadStatus;
  label: string;
  count: number;
  color: string;
  dotColor: string;
}

export interface SourceAttribution {
  source: LeadSource;
  label: string;
  total: number;
  sold: number;
  conversionRate: number;
}

export interface VehicleTypePerf {
  make: string;
  model: string;
  countSold: number;
  avgProfit: number;
  avgDaysOnLot: number;
}

// ============================================================
// Queries
// ============================================================

export async function getVehicleProfitability(
  client: SupabaseClient
): Promise<VehicleProfitRow[]> {
  const { data, error } = await client
    .from("vehicles")
    .select(
      "id, year, make, model, purchase_price, buy_fee, total_cost, mechanical_cost, cosmetic_cost, other_costs, transport_cost, sale_price, selling_fees, net_profit, days_in_stock"
    )
    .eq("status", "Sold")
    .order("net_profit", { ascending: false, nullsFirst: false });

  if (error) throw error;

  return (data ?? []).map((r) => {
    const repairCost =
      (num(r.mechanical_cost)) + (num(r.cosmetic_cost)) + (num(r.other_costs));
    const totalInvested =
      (num(r.total_cost)) + repairCost + (num(r.transport_cost));
    const sale = num(r.sale_price);
    const profit = sale - totalInvested;
    const marginPct = sale > 0 ? (profit / sale) * 100 : 0;

    return {
      id: r.id,
      year: r.year,
      make: r.make,
      model: r.model,
      purchasePrice: r.purchase_price,
      buyFee: r.buy_fee,
      totalCost: r.total_cost,
      mechanicalCost: r.mechanical_cost,
      cosmeticCost: r.cosmetic_cost,
      otherCosts: r.other_costs,
      transportCost: r.transport_cost,
      salePrice: r.sale_price,
      sellingFees: r.selling_fees,
      netProfit: r.net_profit,
      daysInStock: r.days_in_stock,
      repairCost,
      totalInvested,
      profit,
      marginPct,
    };
  });
}

export async function getKpiSummary(
  client: SupabaseClient
): Promise<KpiSummary> {
  const [soldVehicles, totalLeads, soldLeads] = await Promise.all([
    client
      .from("vehicles")
      .select("sale_price, total_cost, mechanical_cost, cosmetic_cost, other_costs, transport_cost, days_in_stock")
      .eq("status", "Sold"),
    client
      .from("leads")
      .select("id", { count: "exact", head: true }),
    client
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "Sold"),
  ]);

  if (soldVehicles.error) throw soldVehicles.error;

  const rows = soldVehicles.data ?? [];
  let totalProfit = 0;
  let totalDays = 0;
  let daysCount = 0;

  for (const r of rows) {
    const repairCost = num(r.mechanical_cost) + num(r.cosmetic_cost) + num(r.other_costs);
    const invested = num(r.total_cost) + repairCost + num(r.transport_cost);
    totalProfit += num(r.sale_price) - invested;
    if (r.days_in_stock != null) {
      totalDays += r.days_in_stock;
      daysCount++;
    }
  }

  const totalSold = rows.length;
  const leadTotal = totalLeads.count ?? 0;
  const leadSold = soldLeads.count ?? 0;

  return {
    totalProfit,
    avgProfitPerVehicle: totalSold > 0 ? totalProfit / totalSold : 0,
    avgDaysOnLot: daysCount > 0 ? Math.round(totalDays / daysCount) : 0,
    totalSold,
    conversionRate: leadTotal > 0 ? (leadSold / leadTotal) * 100 : 0,
  };
}

const FUNNEL_STAGES: { stage: LeadStatus; label: string; color: string; dotColor: string }[] = [
  { stage: "New", label: "New", color: "text-blue-400", dotColor: "bg-blue-400" },
  { stage: "Contacted", label: "Contacted", color: "text-amber-400", dotColor: "bg-amber-400" },
  { stage: "Qualified", label: "Qualified", color: "text-cyan-400", dotColor: "bg-cyan-400" },
  { stage: "Appointment", label: "Appointment", color: "text-purple-400", dotColor: "bg-purple-400" },
  { stage: "Negotiation", label: "Negotiation", color: "text-orange-400", dotColor: "bg-orange-400" },
  { stage: "Sold", label: "Sold", color: "text-emerald-400", dotColor: "bg-emerald-400" },
  { stage: "Lost", label: "Lost", color: "text-red-400", dotColor: "bg-red-400" },
];

export async function getLeadFunnelData(
  client: SupabaseClient
): Promise<FunnelStage[]> {
  const ALL_STATUSES: LeadStatus[] = [
    "New", "Contacted", "Qualified", "Appointment", "Negotiation", "Sold", "Lost",
  ];

  const results = await Promise.all(
    ALL_STATUSES.map((status) =>
      client
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", status)
    )
  );

  return FUNNEL_STAGES.map((s, i) => ({
    ...s,
    count: results[i].count ?? 0,
  }));
}

const SOURCE_LABELS: Record<LeadSource, string> = {
  contact_form: "Contact Form",
  financing_inquiry: "Financing",
  vehicle_inquiry: "Vehicle Inquiry",
  schedule_visit: "Schedule Visit",
};

export async function getLeadSourceAttribution(
  client: SupabaseClient
): Promise<SourceAttribution[]> {
  const SOURCES: LeadSource[] = [
    "contact_form", "financing_inquiry", "vehicle_inquiry", "schedule_visit",
  ];

  const results = await Promise.all(
    SOURCES.flatMap((source) => [
      client
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("source", source),
      client
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("source", source)
        .eq("status", "Sold"),
    ])
  );

  const attrs: SourceAttribution[] = SOURCES.map((source, i) => {
    const total = results[i * 2].count ?? 0;
    const sold = results[i * 2 + 1].count ?? 0;
    return {
      source,
      label: SOURCE_LABELS[source],
      total,
      sold,
      conversionRate: total > 0 ? (sold / total) * 100 : 0,
    };
  });

  return attrs.sort((a, b) => b.conversionRate - a.conversionRate);
}

export async function getVehicleTypePerformance(
  client: SupabaseClient
): Promise<VehicleTypePerf[]> {
  const { data, error } = await client
    .from("vehicles")
    .select("make, model, sale_price, total_cost, mechanical_cost, cosmetic_cost, other_costs, transport_cost, days_in_stock")
    .eq("status", "Sold");

  if (error) throw error;

  const grouped = new Map<string, { profits: number[]; days: number[] }>();

  for (const r of data ?? []) {
    const key = `${r.make}|${r.model}`;
    if (!grouped.has(key)) grouped.set(key, { profits: [], days: [] });
    const g = grouped.get(key)!;

    const repairCost = num(r.mechanical_cost) + num(r.cosmetic_cost) + num(r.other_costs);
    const invested = num(r.total_cost) + repairCost + num(r.transport_cost);
    g.profits.push(num(r.sale_price) - invested);
    if (r.days_in_stock != null) g.days.push(r.days_in_stock);
  }

  const result: VehicleTypePerf[] = [];
  for (const [key, g] of grouped) {
    const [make, model] = key.split("|");
    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    result.push({
      make,
      model,
      countSold: g.profits.length,
      avgProfit: Math.round(avg(g.profits)),
      avgDaysOnLot: g.days.length > 0 ? Math.round(avg(g.days)) : 0,
    });
  }

  return result.sort((a, b) => b.avgProfit - a.avgProfit).slice(0, 10);
}

// ============================================================
// Active Inventory Investment
// ============================================================

export interface InventoryRow {
  id: string;
  year: number;
  make: string;
  model: string;
  status: string;
  purchasePrice: number | null;
  totalCost: number | null;
  mechanicalCost: number | null;
  cosmeticCost: number | null;
  otherCosts: number | null;
  transportCost: number | null;
  listPrice: number;
  targetListPrice: number | null;
  daysInStock: number | null;
  // computed
  totalInvested: number;
  estProfit: number;
  estMarginPct: number;
}

export interface InventorySummary {
  totalInvested: number;
  vehiclesInStock: number;
  avgInvestment: number;
  estTotalPotential: number;
  rows: InventoryRow[];
}

export async function getInventoryInvestment(
  client: SupabaseClient
): Promise<InventorySummary> {
  const { data, error } = await client
    .from("vehicles")
    .select(
      "id, year, make, model, status, purchase_price, total_cost, mechanical_cost, cosmetic_cost, other_costs, transport_cost, price, target_list_price, days_in_stock"
    )
    .not("status", "eq", "Sold")
    .order("total_cost", { ascending: false, nullsFirst: false });

  if (error) throw error;

  let totalInvested = 0;
  let estTotalPotential = 0;

  const rows: InventoryRow[] = (data ?? []).map((r) => {
    const repairCost =
      num(r.mechanical_cost) + num(r.cosmetic_cost) + num(r.other_costs);
    const invested =
      num(r.total_cost) + repairCost + num(r.transport_cost);
    const sellPrice = num(r.target_list_price) || num(r.price);
    const estProfit = sellPrice > 0 ? sellPrice - invested : 0;
    const estMarginPct = sellPrice > 0 ? (estProfit / sellPrice) * 100 : 0;

    totalInvested += invested;
    estTotalPotential += estProfit;

    return {
      id: r.id,
      year: r.year,
      make: r.make,
      model: r.model,
      status: r.status,
      purchasePrice: r.purchase_price,
      totalCost: r.total_cost,
      mechanicalCost: r.mechanical_cost,
      cosmeticCost: r.cosmetic_cost,
      otherCosts: r.other_costs,
      transportCost: r.transport_cost,
      listPrice: num(r.price),
      targetListPrice: r.target_list_price,
      daysInStock: r.days_in_stock,
      totalInvested: invested,
      estProfit,
      estMarginPct,
    };
  });

  const count = rows.length;

  return {
    totalInvested,
    vehiclesInStock: count,
    avgInvestment: count > 0 ? Math.round(totalInvested / count) : 0,
    estTotalPotential,
    rows,
  };
}

// ============================================================
// Helpers
// ============================================================

function num(v: number | null | undefined): number {
  return v != null ? Number(v) : 0;
}
