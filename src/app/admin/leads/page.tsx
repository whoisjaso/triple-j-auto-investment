import Link from "next/link";
import type { Lead, LeadStatus, LeadSource } from "@/types/database";
import { updateLeadStatusAction } from "@/lib/actions/leads";

const STATUS_COLORS: Record<LeadStatus, string> = {
  New: "bg-blue-500/10 text-blue-400",
  Contacted: "bg-yellow-500/10 text-yellow-400",
  Closed: "bg-green-500/10 text-green-400",
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
    { label: "Closed", value: "Closed" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif text-neutral-100">Leads</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {leads.length} {leads.length === 1 ? "inquiry" : "inquiries"}
            {statusFilter ? ` (${statusFilter})` : ""}
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-neutral-800 pb-px">
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
              className={`px-4 py-2 text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                active
                  ? "text-tj-gold border-b-2 border-tj-gold -mb-px"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-neutral-500">No leads yet.</p>
          <p className="text-neutral-600 text-sm mt-1">
            Leads will appear here when customers submit inquiries.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 text-left">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Phone</th>
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium">Message</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {leads.map((lead) => (
                  <tr key={lead.id} className="group">
                    <td className="py-3 pr-4">
                      <span className="text-neutral-200 font-medium">
                        {lead.name}
                      </span>
                      {lead.email && (
                        <span className="block text-xs text-neutral-500 mt-0.5">
                          {lead.email}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <a
                        href={`tel:+1${lead.phone}`}
                        className="text-tj-gold hover:text-tj-gold-light transition-colors"
                      >
                        {formatPhone(lead.phone)}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-neutral-400">
                      {SOURCE_LABELS[lead.source] ?? lead.source}
                    </td>
                    <td className="py-3 pr-4 text-neutral-500 max-w-[260px] truncate">
                      {lead.message ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusButton lead={lead} />
                    </td>
                    <td className="py-3 text-neutral-500">
                      {formatDate(lead.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-neutral-200 font-medium">{lead.name}</p>
                    <a
                      href={`tel:+1${lead.phone}`}
                      className="text-sm text-tj-gold hover:text-tj-gold-light transition-colors"
                    >
                      {formatPhone(lead.phone)}
                    </a>
                  </div>
                  <StatusButton lead={lead} />
                </div>
                {lead.message && (
                  <p className="text-sm text-neutral-500 mb-2 line-clamp-2">
                    {lead.message}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span>{SOURCE_LABELS[lead.source] ?? lead.source}</span>
                  <span>{formatDate(lead.createdAt)}</span>
                </div>
              </div>
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
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium min-h-[32px] cursor-pointer transition-opacity hover:opacity-80 ${STATUS_COLORS[lead.status]}`}
        title={`Click to change status`}
      >
        {lead.status}
      </button>
    </form>
  );
}
