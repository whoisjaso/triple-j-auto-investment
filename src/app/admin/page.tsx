import Link from "next/link";
import type { Lead } from "@/types/database";

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
  New: "bg-blue-500/10 text-blue-400",
  Contacted: "bg-yellow-500/10 text-yellow-400",
  Closed: "bg-green-500/10 text-green-400",
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
  const [stats, recentLeads] = await Promise.all([
    getStats(),
    getRecentLeads(),
  ]);

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-serif text-neutral-100 mb-2">Dashboard</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Welcome to the Triple J admin panel.
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tj-gold/60" aria-hidden="true">
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <path d="M16 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
              <path d="M8 18.5h8" />
            </svg>
            <span className="text-xs text-neutral-500 uppercase tracking-wider">
              Vehicles
            </span>
          </div>
          <p className="text-3xl font-light text-neutral-100">
            {stats.totalVehicles}
          </p>
        </div>

        <div className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tj-gold/60" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-xs text-neutral-500 uppercase tracking-wider">
              Total Leads
            </span>
          </div>
          <p className="text-3xl font-light text-neutral-100">
            {stats.totalLeads}
          </p>
        </div>

        <div className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tj-gold/60" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="text-xs text-neutral-500 uppercase tracking-wider">
              New Leads
            </span>
          </div>
          <p className="text-3xl font-light text-neutral-100">
            {stats.newLeads}
          </p>
        </div>
      </div>

      {/* Recent Leads */}
      {recentLeads.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-wider">
              Recent Leads
            </h2>
            <Link
              href="/admin/leads"
              className="text-xs text-tj-gold/60 hover:text-tj-gold transition-colors"
            >
              View All &rarr;
            </Link>
          </div>
          <div className="border border-neutral-800 rounded-lg bg-neutral-900/50 divide-y divide-neutral-800/50">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href="/admin/leads"
                className="flex items-center justify-between p-4 hover:bg-neutral-800/30 transition-colors min-h-[56px]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm text-neutral-200 font-medium truncate">
                      {lead.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatPhone(lead.phone)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[lead.status] ?? ""}`}
                  >
                    {lead.status}
                  </span>
                  <span className="text-xs text-neutral-600 hidden sm:inline">
                    {relativeDate(lead.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick-link cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/inventory"
          className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-6 hover:bg-neutral-900 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tj-gold/70" aria-hidden="true">
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <path d="M16 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
              <path d="M8 18.5h8" />
            </svg>
            <h2 className="text-lg font-medium text-neutral-200">Inventory</h2>
          </div>
          <p className="text-sm text-neutral-500">
            Add, edit, and manage your vehicle listings.
          </p>
          <span className="mt-4 inline-block text-xs text-tj-gold/60 uppercase tracking-wider group-hover:text-tj-gold transition-colors">
            Manage Inventory &rarr;
          </span>
        </Link>

        <Link
          href="/admin/leads"
          className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-6 hover:bg-neutral-900 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tj-gold/70" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h2 className="text-lg font-medium text-neutral-200">Leads</h2>
          </div>
          <p className="text-sm text-neutral-500">
            View and manage customer inquiries.
          </p>
          <span className="mt-4 inline-block text-xs text-tj-gold/60 uppercase tracking-wider group-hover:text-tj-gold transition-colors">
            Manage Leads &rarr;
          </span>
        </Link>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-6 hover:bg-neutral-900 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tj-gold/70" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <h2 className="text-lg font-medium text-neutral-200">View Site</h2>
          </div>
          <p className="text-sm text-neutral-500">
            Open the public website in a new tab.
          </p>
          <span className="mt-4 inline-block text-xs text-tj-gold/60 uppercase tracking-wider group-hover:text-tj-gold transition-colors">
            Open &rarr;
          </span>
        </a>
      </div>
    </div>
  );
}
