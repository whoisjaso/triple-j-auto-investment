import type {
  VehicleProfitRow,
  KpiSummary,
  FunnelStage,
  SourceAttribution,
  VehicleTypePerf,
  InventorySummary,
  InventoryRow,
} from "@/lib/supabase/queries/analytics";
import type { LeadStatus } from "@/types/database";

// ============================================================
// Mock sold vehicles with financial data
// ============================================================

const MOCK_SOLD: VehicleProfitRow[] = [
  {
    id: "sold-1",
    year: 2017,
    make: "Toyota",
    model: "Camry SE",
    purchasePrice: 3200,
    buyFee: 350,
    totalCost: 3550,
    mechanicalCost: 400,
    cosmeticCost: 200,
    otherCosts: 50,
    transportCost: 300,
    salePrice: 6500,
    sellingFees: 100,
    netProfit: 1900,
    daysInStock: 18,
    repairCost: 650,
    totalInvested: 4500,
    profit: 2000,
    marginPct: 30.8,
  },
  {
    id: "sold-2",
    year: 2018,
    make: "Honda",
    model: "CR-V EX",
    purchasePrice: 4100,
    buyFee: 400,
    totalCost: 4500,
    mechanicalCost: 250,
    cosmeticCost: 350,
    otherCosts: 0,
    transportCost: 350,
    salePrice: 7800,
    sellingFees: 150,
    netProfit: 2200,
    daysInStock: 12,
    repairCost: 600,
    totalInvested: 5450,
    profit: 2350,
    marginPct: 30.1,
  },
  {
    id: "sold-3",
    year: 2016,
    make: "Ford",
    model: "Explorer XLT",
    purchasePrice: 3800,
    buyFee: 375,
    totalCost: 4175,
    mechanicalCost: 800,
    cosmeticCost: 150,
    otherCosts: 100,
    transportCost: 400,
    salePrice: 6200,
    sellingFees: 100,
    netProfit: 475,
    daysInStock: 32,
    repairCost: 1050,
    totalInvested: 5625,
    profit: 575,
    marginPct: 9.3,
  },
  {
    id: "sold-4",
    year: 2019,
    make: "Toyota",
    model: "Corolla LE",
    purchasePrice: 3000,
    buyFee: 300,
    totalCost: 3300,
    mechanicalCost: 150,
    cosmeticCost: 100,
    otherCosts: 0,
    transportCost: 250,
    salePrice: 5500,
    sellingFees: 75,
    netProfit: 1625,
    daysInStock: 9,
    repairCost: 250,
    totalInvested: 3800,
    profit: 1700,
    marginPct: 30.9,
  },
  {
    id: "sold-5",
    year: 2015,
    make: "Nissan",
    model: "Altima SV",
    purchasePrice: 2500,
    buyFee: 275,
    totalCost: 2775,
    mechanicalCost: 1200,
    cosmeticCost: 300,
    otherCosts: 75,
    transportCost: 275,
    salePrice: 4200,
    sellingFees: 50,
    netProfit: -475,
    daysInStock: 45,
    repairCost: 1575,
    totalInvested: 4625,
    profit: -425,
    marginPct: -10.1,
  },
];

export function getMockVehicleProfitability(): VehicleProfitRow[] {
  return [...MOCK_SOLD].sort((a, b) => b.profit - a.profit);
}

export function getMockKpiSummary(): KpiSummary {
  const totalProfit = MOCK_SOLD.reduce((sum, v) => sum + v.profit, 0);
  const totalDays = MOCK_SOLD.reduce((sum, v) => sum + (v.daysInStock ?? 0), 0);
  return {
    totalProfit,
    avgProfitPerVehicle: Math.round(totalProfit / MOCK_SOLD.length),
    avgDaysOnLot: Math.round(totalDays / MOCK_SOLD.length),
    totalSold: MOCK_SOLD.length,
    conversionRate: 28.6, // 2 sold out of 7 mock leads
  };
}

export function getMockLeadFunnelData(): FunnelStage[] {
  const stages: { stage: LeadStatus; label: string; count: number; color: string; dotColor: string }[] = [
    { stage: "New", label: "New", count: 3, color: "text-blue-400", dotColor: "bg-blue-400" },
    { stage: "Contacted", label: "Contacted", count: 2, color: "text-amber-400", dotColor: "bg-amber-400" },
    { stage: "Qualified", label: "Qualified", count: 0, color: "text-cyan-400", dotColor: "bg-cyan-400" },
    { stage: "Appointment", label: "Appointment", count: 0, color: "text-purple-400", dotColor: "bg-purple-400" },
    { stage: "Negotiation", label: "Negotiation", count: 0, color: "text-orange-400", dotColor: "bg-orange-400" },
    { stage: "Sold", label: "Sold", count: 2, color: "text-emerald-400", dotColor: "bg-emerald-400" },
    { stage: "Lost", label: "Lost", count: 0, color: "text-red-400", dotColor: "bg-red-400" },
  ];
  return stages;
}

export function getMockLeadSourceAttribution(): SourceAttribution[] {
  return [
    { source: "schedule_visit", label: "Schedule Visit", total: 1, sold: 1, conversionRate: 100 },
    { source: "financing_inquiry", label: "Financing", total: 2, sold: 1, conversionRate: 50 },
    { source: "vehicle_inquiry", label: "Vehicle Inquiry", total: 2, sold: 0, conversionRate: 0 },
    { source: "contact_form", label: "Contact Form", total: 2, sold: 0, conversionRate: 0 },
  ];
}

export function getMockVehicleTypePerformance(): VehicleTypePerf[] {
  return [
    { make: "Honda", model: "CR-V EX", countSold: 1, avgProfit: 2350, avgDaysOnLot: 12 },
    { make: "Toyota", model: "Camry SE", countSold: 1, avgProfit: 2000, avgDaysOnLot: 18 },
    { make: "Toyota", model: "Corolla LE", countSold: 1, avgProfit: 1700, avgDaysOnLot: 9 },
    { make: "Ford", model: "Explorer XLT", countSold: 1, avgProfit: 575, avgDaysOnLot: 32 },
    { make: "Nissan", model: "Altima SV", countSold: 1, avgProfit: -425, avgDaysOnLot: 45 },
  ];
}

// ============================================================
// Mock Active Inventory
// ============================================================

const MOCK_INVENTORY: InventoryRow[] = [
  {
    id: "inv-1",
    year: 2018,
    make: "Honda",
    model: "Accord LX",
    status: "Available",
    purchasePrice: 3500,
    totalCost: 3850,
    mechanicalCost: 300,
    cosmeticCost: 150,
    otherCosts: 0,
    transportCost: 275,
    listPrice: 6800,
    targetListPrice: 6800,
    daysInStock: 14,
    totalInvested: 4575,
    estProfit: 2225,
    estMarginPct: 32.7,
  },
  {
    id: "inv-2",
    year: 2017,
    make: "Toyota",
    model: "RAV4 LE",
    status: "Available",
    purchasePrice: 4200,
    totalCost: 4600,
    mechanicalCost: 0,
    cosmeticCost: 200,
    otherCosts: 0,
    transportCost: 350,
    listPrice: 7500,
    targetListPrice: 7500,
    daysInStock: 8,
    totalInvested: 5150,
    estProfit: 2350,
    estMarginPct: 31.3,
  },
  {
    id: "inv-3",
    year: 2016,
    make: "Chevrolet",
    model: "Malibu LT",
    status: "In_Transit",
    purchasePrice: 2800,
    totalCost: 3100,
    mechanicalCost: null,
    cosmeticCost: null,
    otherCosts: null,
    transportCost: 300,
    listPrice: 5200,
    targetListPrice: null,
    daysInStock: 3,
    totalInvested: 3400,
    estProfit: 1800,
    estMarginPct: 34.6,
  },
  {
    id: "inv-4",
    year: 2019,
    make: "Hyundai",
    model: "Elantra SEL",
    status: "Inspection",
    purchasePrice: 3100,
    totalCost: 3400,
    mechanicalCost: 500,
    cosmeticCost: 250,
    otherCosts: 75,
    transportCost: 280,
    listPrice: 5900,
    targetListPrice: 5900,
    daysInStock: 6,
    totalInvested: 4505,
    estProfit: 1395,
    estMarginPct: 23.6,
  },
];

export function getMockInventoryInvestment(): InventorySummary {
  const totalInvested = MOCK_INVENTORY.reduce((s, v) => s + v.totalInvested, 0);
  const estTotalPotential = MOCK_INVENTORY.reduce((s, v) => s + v.estProfit, 0);
  return {
    totalInvested,
    vehiclesInStock: MOCK_INVENTORY.length,
    avgInvestment: Math.round(totalInvested / MOCK_INVENTORY.length),
    estTotalPotential,
    rows: MOCK_INVENTORY,
  };
}
