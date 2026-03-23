import Link from "next/link";
import type {
  VehicleProfitRow,
  KpiSummary,
  FunnelStage,
  SourceAttribution,
  VehicleTypePerf,
  InventorySummary,
} from "@/lib/supabase/queries/analytics";

// ============================================================
// Data fetching
// ============================================================

async function fetchAnalytics(): Promise<{
  kpi: KpiSummary;
  profitability: VehicleProfitRow[];
  funnel: FunnelStage[];
  sources: SourceAttribution[];
  performance: VehicleTypePerf[];
  inventory: InventorySummary;
}> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const {
      getKpiSummary,
      getVehicleProfitability,
      getLeadFunnelData,
      getLeadSourceAttribution,
      getVehicleTypePerformance,
      getInventoryInvestment,
    } = await import("@/lib/supabase/queries/analytics");
    const supabase = await createClient();

    const [kpi, profitability, funnel, sources, performance, inventory] =
      await Promise.all([
        getKpiSummary(supabase),
        getVehicleProfitability(supabase),
        getLeadFunnelData(supabase),
        getLeadSourceAttribution(supabase),
        getVehicleTypePerformance(supabase),
        getInventoryInvestment(supabase),
      ]);

    return { kpi, profitability, funnel, sources, performance, inventory };
  }

  const {
    getMockKpiSummary,
    getMockVehicleProfitability,
    getMockLeadFunnelData,
    getMockLeadSourceAttribution,
    getMockVehicleTypePerformance,
    getMockInventoryInvestment,
  } = await import("@/lib/mock-analytics");

  return {
    kpi: getMockKpiSummary(),
    profitability: getMockVehicleProfitability(),
    funnel: getMockLeadFunnelData(),
    sources: getMockLeadSourceAttribution(),
    performance: getMockVehicleTypePerformance(),
    inventory: getMockInventoryInvestment(),
  };
}

// ============================================================
// Formatters
// ============================================================

function fmtDollar(n: number | null): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  const formatted = abs >= 1000
    ? `$${(abs / 1000).toFixed(1)}K`
    : `$${abs.toLocaleString("en-US")}`;
  return n < 0 ? `-${formatted}` : formatted;
}

function fmtDollarFull(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

// ============================================================
// Page
// ============================================================

export default async function AdminAnalyticsPage() {
  const { kpi, profitability, funnel, sources, performance, inventory } =
    await fetchAnalytics();

  const maxFunnelCount = Math.max(...funnel.map((s) => s.count), 1);
  const totalLeads = funnel.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="px-3 py-3 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-5 md:mb-8">
        <h1 className="font-serif text-xl md:text-3xl text-tj-cream/90 tracking-wide">
          Analytics
        </h1>
        <p className="text-xs text-white/25 mt-1 font-accent uppercase tracking-[0.15em]">
          Business Intelligence
        </p>
      </div>

      {/* ════════ KPI Cards ════════ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-5 md:mb-8">
        <KpiCard
          value={fmtDollar(kpi.totalProfit)}
          label="Total Profit"
          accentClass="bg-emerald-400/[0.03] text-emerald-400/40"
          icon={
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          }
        />
        <KpiCard
          value={fmtDollar(kpi.avgProfitPerVehicle)}
          label="Avg Profit"
          accentClass="bg-tj-gold/[0.03] text-tj-gold/40"
          icon={
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          }
        />
        <KpiCard
          value={`${kpi.avgDaysOnLot}`}
          label="Avg Days on Lot"
          accentClass="bg-blue-400/[0.03] text-blue-400/40"
          icon={
            <>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </>
          }
        />
        <KpiCard
          value={`${kpi.totalSold}`}
          label="Vehicles Sold"
          accentClass="bg-purple-400/[0.03] text-purple-400/40"
          icon={
            <>
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <path d="M16 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
              <path d="M8 18.5h8" />
            </>
          }
        />
        <KpiCard
          value={fmtPct(kpi.conversionRate)}
          label="Conversion Rate"
          accentClass="bg-amber-400/[0.03] text-amber-400/40"
          icon={
            <>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </>
          }
        />
      </div>

      {/* ════════ Active Inventory Investment ════════ */}
      <section className="mb-8">
        <h2 className="font-accent text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
          Active Inventory
        </h2>

        {inventory.rows.length === 0 ? (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-8 text-center">
            <p className="text-white/30 text-sm">No vehicles in inventory.</p>
            <p className="text-white/15 text-xs mt-1">
              Add vehicles to your pipeline to see investment data.
            </p>
          </div>
        ) : (
          <>
            {/* Inventory KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 md:p-4">
                <p className="font-serif text-lg md:text-xl text-tj-cream/90">
                  {fmtDollar(inventory.totalInvested)}
                </p>
                <p className="text-[9px] text-white/25 uppercase tracking-[0.15em] font-accent mt-0.5">
                  Total Invested
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 md:p-4">
                <p className="font-serif text-lg md:text-xl text-emerald-400/80">
                  {fmtDollar(inventory.estTotalPotential)}
                </p>
                <p className="text-[9px] text-white/25 uppercase tracking-[0.15em] font-accent mt-0.5">
                  Est. Potential
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 md:p-4">
                <p className="font-serif text-lg md:text-xl text-tj-cream/90">
                  {inventory.vehiclesInStock}
                </p>
                <p className="text-[9px] text-white/25 uppercase tracking-[0.15em] font-accent mt-0.5">
                  In Stock
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 md:p-4">
                <p className="font-serif text-lg md:text-xl text-tj-cream/90">
                  {fmtDollar(inventory.avgInvestment)}
                </p>
                <p className="text-[9px] text-white/25 uppercase tracking-[0.15em] font-accent mt-0.5">
                  Avg Investment
                </p>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-xl border border-white/[0.04] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                    {["Vehicle", "Status", "Invested", "List Price", "Est. Profit", "Margin", "Days"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {inventory.rows.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4 text-tj-cream/80 font-medium whitespace-nowrap">
                        {v.year} {v.make} {v.model}
                      </td>
                      <td className="py-3 px-4">
                        <StatusPill status={v.status} />
                      </td>
                      <td className="py-3 px-4 text-white/40">
                        {v.totalInvested > 0 ? fmtDollarFull(v.totalInvested) : "—"}
                      </td>
                      <td className="py-3 px-4 text-white/60 font-medium">
                        {v.listPrice > 0 ? fmtDollarFull(v.listPrice) : "—"}
                      </td>
                      <td
                        className={`py-3 px-4 font-medium ${
                          v.estProfit > 0
                            ? "text-emerald-400"
                            : v.estProfit < 0
                              ? "text-red-400"
                              : "text-white/20"
                        }`}
                      >
                        {v.estProfit !== 0
                          ? `${v.estProfit > 0 ? "+" : ""}${fmtDollarFull(v.estProfit)}`
                          : "—"}
                      </td>
                      <td
                        className={`py-3 px-4 text-xs ${
                          v.estMarginPct > 0
                            ? "text-emerald-400/70"
                            : v.estMarginPct < 0
                              ? "text-red-400/70"
                              : "text-white/15"
                        }`}
                      >
                        {v.estMarginPct !== 0 ? fmtPct(v.estMarginPct) : "—"}
                      </td>
                      <td className="py-3 px-4 text-white/30 text-xs">
                        {v.daysInStock ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {inventory.rows.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm text-tj-cream/80 font-medium truncate">
                        {v.year} {v.make} {v.model}
                      </p>
                      <StatusPill status={v.status} />
                    </div>
                    <span
                      className={`text-sm font-serif font-medium whitespace-nowrap ${
                        v.estProfit > 0
                          ? "text-emerald-400"
                          : v.estProfit < 0
                            ? "text-red-400"
                            : "text-white/20"
                      }`}
                    >
                      {v.estProfit !== 0
                        ? `${v.estProfit > 0 ? "+" : ""}${fmtDollarFull(v.estProfit)}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-white/25 font-accent tracking-wide">
                    <span>Invested {v.totalInvested > 0 ? fmtDollarFull(v.totalInvested) : "—"}</span>
                    <span>List {v.listPrice > 0 ? fmtDollarFull(v.listPrice) : "—"}</span>
                    {v.daysInStock != null && <span>{v.daysInStock}d</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ════════ Vehicle Profitability ════════ */}
      <section className="mb-8">
        <h2 className="font-accent text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
          Vehicle Profitability
        </h2>

        {profitability.length === 0 ? (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-8 text-center">
            <p className="text-white/30 text-sm">
              No sold vehicles with cost data yet.
            </p>
            <p className="text-white/15 text-xs mt-1">
              Add purchase cost and sale price to vehicles to see profitability.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-xl border border-white/[0.04] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                    {["Vehicle", "Purchase", "Repairs", "Total Cost", "Sale Price", "Profit", "Margin"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {profitability.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4 text-tj-cream/80 font-medium whitespace-nowrap">
                        {v.year} {v.make} {v.model}
                      </td>
                      <td className="py-3 px-4 text-white/40">
                        {fmtDollarFull(v.totalCost)}
                      </td>
                      <td className="py-3 px-4 text-white/40">
                        {v.repairCost > 0 ? fmtDollarFull(v.repairCost) : "—"}
                      </td>
                      <td className="py-3 px-4 text-white/40">
                        {fmtDollarFull(v.totalInvested)}
                      </td>
                      <td className="py-3 px-4 text-white/60 font-medium">
                        {fmtDollarFull(v.salePrice)}
                      </td>
                      <td
                        className={`py-3 px-4 font-medium ${
                          v.profit >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {v.profit >= 0 ? "+" : ""}
                        {fmtDollarFull(v.profit)}
                      </td>
                      <td
                        className={`py-3 px-4 text-xs ${
                          v.marginPct >= 0 ? "text-emerald-400/70" : "text-red-400/70"
                        }`}
                      >
                        {fmtPct(v.marginPct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {profitability.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm text-tj-cream/80 font-medium">
                      {v.year} {v.make} {v.model}
                    </p>
                    <span
                      className={`text-sm font-serif font-medium whitespace-nowrap ${
                        v.profit >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {v.profit >= 0 ? "+" : ""}
                      {fmtDollarFull(v.profit)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-white/25 font-accent tracking-wide">
                    <span>Cost {fmtDollarFull(v.totalInvested)}</span>
                    <span>Sale {fmtDollarFull(v.salePrice)}</span>
                    <span
                      className={
                        v.marginPct >= 0
                          ? "text-emerald-400/60"
                          : "text-red-400/60"
                      }
                    >
                      {fmtPct(v.marginPct)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ════════ Lead Analytics — Funnel + Sources ════════ */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Lead Funnel */}
        <section className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-accent text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/30">
              Lead Funnel
            </h2>
            <span className="text-[10px] text-white/20 font-accent tracking-wide">
              {totalLeads} total
            </span>
          </div>
          <div className="space-y-3">
            {funnel.map((s) => (
              <div key={s.stage} className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${s.dotColor}`}
                />
                <span
                  className={`text-[10px] font-accent uppercase tracking-[0.12em] w-16 md:w-20 shrink-0 ${s.color}`}
                >
                  {s.label}
                </span>
                <div className="flex-1 h-5 bg-white/[0.02] rounded-full overflow-hidden">
                  {s.count > 0 && (
                    <div
                      className={`h-full rounded-full ${s.dotColor} opacity-30`}
                      style={{
                        width: `${Math.max((s.count / maxFunnelCount) * 100, 4)}%`,
                      }}
                    />
                  )}
                </div>
                <span
                  className={`text-sm font-serif w-8 text-right ${s.color}`}
                >
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Source Attribution */}
        <section className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
          <h2 className="font-accent text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
            Source Performance
          </h2>
          {sources.length === 0 ? (
            <p className="text-white/20 text-sm">No lead data yet.</p>
          ) : (
            <div className="space-y-4">
              {sources.map((s) => (
                <div key={s.source}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-tj-cream/70 font-medium">
                      {s.label}
                    </span>
                    <span className="text-xs text-white/30 font-accent tracking-wide">
                      {s.sold}/{s.total} &middot;{" "}
                      <span
                        className={
                          s.conversionRate > 0
                            ? "text-emerald-400/70"
                            : "text-white/20"
                        }
                      >
                        {fmtPct(s.conversionRate)}
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                    {s.conversionRate > 0 && (
                      <div
                        className="h-full rounded-full bg-emerald-400/40"
                        style={{
                          width: `${Math.max(s.conversionRate, 3)}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ════════ Vehicle Type Performance ════════ */}
      <section className="mb-8">
        <h2 className="font-accent text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
          Top Performers
        </h2>

        {performance.length === 0 ? (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-8 text-center">
            <p className="text-white/30 text-sm">
              Sell vehicles with cost data to see performance rankings.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.04] overflow-hidden">
            <div className="divide-y divide-white/[0.03]">
              {performance.map((v, i) => {
                const rankColor =
                  i === 0
                    ? "text-tj-gold"
                    : i === 1
                      ? "text-white/50"
                      : i === 2
                        ? "text-amber-700"
                        : "text-white/20";
                return (
                  <div
                    key={`${v.make}-${v.model}`}
                    className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <span
                      className={`font-serif text-lg w-8 text-center ${rankColor}`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-tj-cream/80 font-medium truncate">
                        {v.make} {v.model}
                      </p>
                      <p className="text-[10px] text-white/20 font-accent tracking-wide mt-0.5">
                        {v.countSold} sold &middot; {v.avgDaysOnLot}d avg
                      </p>
                    </div>
                    <span
                      className={`text-sm font-serif font-medium ${
                        v.avgProfit >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {v.avgProfit >= 0 ? "+" : ""}
                      {fmtDollar(v.avgProfit)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Back to dashboard */}
      <div className="text-center">
        <Link
          href="/admin"
          className="font-accent text-[10px] uppercase tracking-[0.15em] text-white/20 hover:text-white/40 transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// KPI Card Component
// ============================================================

const STATUS_COLORS: Record<string, string> = {
  Bidding: "bg-yellow-400/10 text-yellow-400/70",
  Purchased: "bg-blue-400/10 text-blue-400/70",
  In_Transit: "bg-indigo-400/10 text-indigo-400/70",
  Arrived: "bg-cyan-400/10 text-cyan-400/70",
  Inspection: "bg-orange-400/10 text-orange-400/70",
  Available: "bg-emerald-400/10 text-emerald-400/70",
  Pending: "bg-purple-400/10 text-purple-400/70",
};

function StatusPill({ status }: { status: string }) {
  const label = status.replace("_", " ");
  return (
    <span
      className={`inline-block mt-0.5 md:mt-0 text-[9px] uppercase tracking-[0.1em] font-accent px-2 py-0.5 rounded-full ${
        STATUS_COLORS[status] ?? "bg-white/5 text-white/30"
      }`}
    >
      {label}
    </span>
  );
}

function KpiCard({
  value,
  label,
  accentClass,
  icon,
}: {
  value: string;
  label: string;
  accentClass: string;
  icon: React.ReactNode;
}) {
  const [bgClass, iconClass] = accentClass.split(" ");
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 md:p-5">
      <div
        className={`absolute top-0 right-0 w-20 h-20 ${bgClass} rounded-full -translate-y-1/2 translate-x-1/2`}
      />
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${iconClass} mb-2`}
        aria-hidden="true"
      >
        {icon}
      </svg>
      <p className="font-serif text-xl md:text-2xl text-tj-cream/90">
        {value}
      </p>
      <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] font-accent mt-1">
        {label}
      </p>
    </div>
  );
}
