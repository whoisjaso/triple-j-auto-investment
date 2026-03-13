import Link from "next/link";
import type { Lead, LeadStatus, LeadSource } from "@/types/database";
import { updateLeadStatusAction } from "@/lib/actions/leads";

const STATUS_COLORS: Record<LeadStatus, string> = {
  New: "bg-blue-400/10 text-blue-400 border-blue-400/15",
  Contacted: "bg-amber-400/10 text-amber-400 border-amber-400/15",
  Qualified: "bg-cyan-400/10 text-cyan-400 border-cyan-400/15",
  Appointment: "bg-purple-400/10 text-purple-400 border-purple-400/15",
  Negotiation: "bg-orange-400/10 text-orange-400 border-orange-400/15",
  Sold: "bg-emerald-400/10 text-emerald-400 border-emerald-400/15",
  Lost: "bg-red-400/10 text-red-400 border-red-400/15",
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  contact_form: "Contact",
  financing_inquiry: "Financing",
  vehicle_inquiry: "Vehicle",
  schedule_visit: "Visit",
};

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return phone;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminLeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const statusFilter = params.status as LeadStatus | undefined;

  let leads: Lead[];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const { getAdminLeads } = await import("@/lib/supabase/queries/leads");
    const supabase = await createClient();
    leads = await getAdminLeads(supabase, statusFilter);
  } else {
    const { getMockLeads } = await import("@/lib/mock-leads");
    leads = getMockLeads(statusFilter);
  }

  const filters: { label: string; value: string | undefined }[] = [
    { label: "All", value: undefined },
    { label: "New", value: "New" },
    { label: "Contacted", value: "Contacted" },
    { label: "Qualified", value: "Qualified" },
    { label: "Appointment", value: "Appointment" },
    { label: "Negotiation", value: "Negotiation" },
    { label: "Sold", value: "Sold" },
    { label: "Lost", value: "Lost" },
  ];

  return (
    <div className="px-4 py-6 md:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-tj-cream/90 tracking-wide">
            Leads
          </h1>
          <p className="text-xs text-white/25 mt-1 font-accent uppercase tracking-[0.15em]">
            {leads.length} {leads.length === 1 ? "inquiry" : "inquiries"}
            {statusFilter ? ` \u00B7 ${statusFilter}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.02] rounded-lg border border-white/[0.04] p-0.5">
          <span className="px-3 py-1.5 rounded-md text-[10px] font-accent uppercase tracking-[0.12em] text-tj-gold bg-white/[0.04]">
            List
          </span>
          <Link
            href="/admin/leads/board"
            className="px-3 py-1.5 rounded-md text-[10px] font-accent uppercase tracking-[0.12em] text-white/30 hover:text-white/50 hover:bg-white/[0.03] transition-all"
          >
            Board
          </Link>
        </div>
      </div>

      {/* Status filter tabs — scrollable on mobile */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-px -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
        {filters.map((f) => {
          const active =
            statusFilter === f.value ||
            (!statusFilter && f.value === undefined);
          const href = f.value
            ? `/admin/leads?status=${f.value}`
            : "/admin/leads";
          return (
            <Link
              key={f.label}
              href={href}
              className={`px-3 py-2 text-[10px] font-accent uppercase tracking-[0.12em] transition-all duration-300 min-h-[36px] flex items-center rounded-lg whitespace-nowrap ${
                active
                  ? "text-tj-gold bg-tj-gold/[0.08] border border-tj-gold/10"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-white/[0.04] bg-white/[0.015]">
          <p className="text-white/30 text-sm">No leads yet.</p>
          <p className="text-white/15 text-xs mt-1">
            Leads will appear here when customers submit inquiries.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-white/[0.04] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium">
                    Source
                  </th>
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium">
                    Message
                  </th>
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="group hover:bg-white/[0.02] transition-colors duration-200"
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="text-tj-cream/80 font-medium hover:text-tj-gold transition-colors"
                      >
                        {lead.name}
                      </Link>
                      {lead.email && (
                        <span className="block text-[10px] text-white/20 mt-0.5">
                          {lead.email}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={`tel:+1${lead.phone}`}
                        className="text-tj-gold/70 hover:text-tj-gold transition-colors"
                      >
                        {formatPhone(lead.phone)}
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-white/30 text-xs">
                      {SOURCE_LABELS[lead.source] ?? lead.source}
                    </td>
                    <td className="py-3.5 px-4 text-white/25 max-w-[260px] truncate text-xs">
                      {lead.message ?? "\u2014"}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusButton lead={lead} />
                    </td>
                    <td className="py-3.5 px-4 text-white/20 text-xs">
                      {formatDate(lead.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="block rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 hover:bg-white/[0.03] hover:border-white/[0.06] transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm text-tj-cream/80 font-medium truncate">
                      {lead.name}
                    </p>
                    <span className="text-xs text-tj-gold/60">
                      {formatPhone(lead.phone)}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border ${STATUS_COLORS[lead.status]}`}
                  >
                    {lead.status}
                  </span>
                </div>
                {lead.message && (
                  <p className="text-xs text-white/20 mb-2 line-clamp-2">
                    {lead.message}
                  </p>
                )}
                <div className="flex items-center justify-between text-[10px] text-white/15 font-accent tracking-wide">
                  <span>{SOURCE_LABELS[lead.source] ?? lead.source}</span>
                  <span>{formatDate(lead.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatusButton({ lead }: { lead: Lead }) {
  return (
    <form action={updateLeadStatusAction}>
      <input type="hidden" name="id" value={lead.id} />
      <input type="hidden" name="status" value={lead.status} />
      <button
        type="submit"
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium min-h-[32px] cursor-pointer border transition-all duration-200 hover:opacity-80 active:scale-95 ${STATUS_COLORS[lead.status]}`}
        title="Click to change status"
      >
        {lead.status}
      </button>
    </form>
  );
}
