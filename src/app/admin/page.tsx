import Link from "next/link";
import type { Lead, LeadStatus } from "@/types/database";

interface Stats {
  totalVehicles: number;
  totalLeads: number;
  newLeads: number;
}

async function getStats(): Promise<Stats> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const { getLeadStats } = await import("@/lib/supabase/queries/leads");
    const supabase = await createClient();
    return getLeadStats(supabase);
  }
  const { getMockLeadStats } = await import("@/lib/mock-leads");
  return getMockLeadStats();
}

async function getPipelineCount(): Promise<number> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .in("status", ["Bidding", "Purchased", "In_Transit", "Arrived", "Inspection"]);
    if (error) return 0;
    return count ?? 0;
  }
  return 0;
}

async function getLeadPipelineCounts(): Promise<Record<LeadStatus, number>> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const { getLeadCountsByStatus } = await import("@/lib/supabase/queries/leads");
    const supabase = await createClient();
    return getLeadCountsByStatus(supabase);
  }
  const { getMockLeadCountsByStatus } = await import("@/lib/mock-leads");
  return getMockLeadCountsByStatus();
}

async function getRecentLeads(): Promise<Lead[]> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const { getAdminLeads } = await import("@/lib/supabase/queries/leads");
    const supabase = await createClient();
    const leads = await getAdminLeads(supabase);
    return leads.slice(0, 5);
  }
  const { getMockLeads } = await import("@/lib/mock-leads");
  return getMockLeads().slice(0, 5);
}

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-400/10 text-blue-400 border-blue-400/15",
  Contacted: "bg-amber-400/10 text-amber-400 border-amber-400/15",
  Qualified: "bg-cyan-400/10 text-cyan-400 border-cyan-400/15",
  Appointment: "bg-purple-400/10 text-purple-400 border-purple-400/15",
  Negotiation: "bg-orange-400/10 text-orange-400 border-orange-400/15",
  Sold: "bg-emerald-400/10 text-emerald-400 border-emerald-400/15",
  Lost: "bg-red-400/10 text-red-400 border-red-400/15",
};

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return phone;
}

export default async function AdminDashboardPage() {
  const [stats, recentLeads, pipelineCount, leadCounts] = await Promise.all([
    getStats(),
    getRecentLeads(),
    getPipelineCount(),
    getLeadPipelineCounts(),
  ]);

  return (
    <div className="px-4 py-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl md:text-3xl text-tj-cream/90 tracking-wide">
          Dashboard
        </h1>
        <p className="text-xs text-white/25 mt-1 font-accent uppercase tracking-[0.15em]">
          Triple J Auto Investment
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 md:p-6">
          <div className="absolute top-0 right-0 w-20 h-20 bg-tj-gold/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-tj-gold/40 mb-3"
            aria-hidden="true"
          >
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <path d="M16 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
            <path d="M8 18.5h8" />
          </svg>
          <p className="font-serif text-2xl md:text-4xl text-tj-cream/90">
            {stats.totalVehicles}
          </p>
          <p className="text-[10px] md:text-xs text-white/25 uppercase tracking-[0.15em] font-accent mt-1">
            Vehicles
          </p>
        </div>

        <Link href="/admin/pipeline" className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 md:p-6 hover:bg-white/[0.03] hover:border-purple-400/10 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-purple-400/40 mb-3"
            aria-hidden="true"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <p className="font-serif text-2xl md:text-4xl text-tj-cream/90">
            {pipelineCount}
          </p>
          <p className="text-[10px] md:text-xs text-white/25 uppercase tracking-[0.15em] font-accent mt-1">
            In Pipeline
          </p>
        </Link>

        <div className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 md:p-6">
          <div className="absolute top-0 right-0 w-20 h-20 bg-tj-gold/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-tj-gold/40 mb-3"
            aria-hidden="true"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <p className="font-serif text-2xl md:text-4xl text-tj-cream/90">
            {stats.totalLeads}
          </p>
          <p className="text-[10px] md:text-xs text-white/25 uppercase tracking-[0.15em] font-accent mt-1">
            Total Leads
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 md:p-6">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-400/40 mb-3"
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <p className="font-serif text-2xl md:text-4xl text-tj-cream/90">
            {stats.newLeads}
          </p>
          <p className="text-[10px] md:text-xs text-white/25 uppercase tracking-[0.15em] font-accent mt-1">
            New Leads
          </p>
        </div>
      </div>

      {/* Lead Pipeline Breakdown */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-accent text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/30">
            Lead Pipeline
          </h2>
          <Link
            href="/admin/leads/board"
            className="font-accent text-[10px] uppercase tracking-[0.15em] text-tj-gold/50 hover:text-tj-gold/80 transition-colors"
          >
            View Board &rarr;
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { status: "New" as LeadStatus, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/15" },
            { status: "Contacted" as LeadStatus, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/15" },
            { status: "Qualified" as LeadStatus, color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/15" },
            { status: "Appointment" as LeadStatus, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/15" },
            { status: "Negotiation" as LeadStatus, color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/15" },
            { status: "Sold" as LeadStatus, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/15" },
            { status: "Lost" as LeadStatus, color: "text-red-400", bg: "bg-red-400/10 border-red-400/15" },
          ]).map(({ status, color, bg }) => (
            <Link
              key={status}
              href={`/admin/leads?status=${status}`}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${bg} hover:opacity-80 transition-opacity`}
            >
              <span className={`text-lg font-serif ${color}`}>
                {leadCounts[status]}
              </span>
              <span className={`text-[10px] font-accent uppercase tracking-[0.1em] ${color} opacity-70`}>
                {status}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Leads */}
      {recentLeads.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-accent text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/30">
              Recent Leads
            </h2>
            <Link
              href="/admin/leads"
              className="font-accent text-[10px] uppercase tracking-[0.15em] text-tj-gold/50 hover:text-tj-gold/80 transition-colors"
            >
              View All &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/[0.06] transition-all duration-300 min-h-[56px] group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-tj-cream/80 font-medium truncate">
                    {lead.name}
                  </p>
                  <p className="text-xs text-white/25 mt-0.5">
                    {formatPhone(lead.phone)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border ${STATUS_COLORS[lead.status] ?? ""}`}
                  >
                    {lead.status}
                  </span>
                  <span className="text-[10px] text-white/15 hidden sm:inline font-accent tracking-wide">
                    {relativeDate(lead.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/admin/pipeline"
          className="group rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 hover:bg-white/[0.03] hover:border-tj-gold/10 transition-all duration-300"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-tj-gold/50 mb-3"
            aria-hidden="true"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <p className="text-sm text-tj-cream/80 font-medium">Pipeline</p>
          <p className="text-[10px] text-white/20 mt-1 font-accent uppercase tracking-[0.12em] group-hover:text-tj-gold/40 transition-colors">
            Manage &rarr;
          </p>
        </Link>

        <Link
          href="/admin/inventory"
          className="group rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 hover:bg-white/[0.03] hover:border-tj-gold/10 transition-all duration-300"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-tj-gold/50 mb-3"
            aria-hidden="true"
          >
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <path d="M16 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
            <path d="M8 18.5h8" />
          </svg>
          <p className="text-sm text-tj-cream/80 font-medium">Inventory</p>
          <p className="text-[10px] text-white/20 mt-1 font-accent uppercase tracking-[0.12em] group-hover:text-tj-gold/40 transition-colors">
            Manage &rarr;
          </p>
        </Link>

        <Link
          href="/admin/leads"
          className="group rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 hover:bg-white/[0.03] hover:border-tj-gold/10 transition-all duration-300"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-tj-gold/50 mb-3"
            aria-hidden="true"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p className="text-sm text-tj-cream/80 font-medium">Leads</p>
          <p className="text-[10px] text-white/20 mt-1 font-accent uppercase tracking-[0.12em] group-hover:text-tj-gold/40 transition-colors">
            Manage &rarr;
          </p>
        </Link>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 hover:bg-white/[0.03] hover:border-tj-gold/10 transition-all duration-300"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-tj-gold/50 mb-3"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <p className="text-sm text-tj-cream/80 font-medium">View Site</p>
          <p className="text-[10px] text-white/20 mt-1 font-accent uppercase tracking-[0.12em] group-hover:text-tj-gold/40 transition-colors">
            Open &rarr;
          </p>
        </a>
      </div>
    </div>
  );
}
