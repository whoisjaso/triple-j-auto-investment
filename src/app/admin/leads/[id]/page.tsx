import Link from "next/link";
import type { Lead, LeadNote, LeadTask } from "@/types/database";
import LeadDetailClient from "@/components/admin/LeadDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

async function getLeadData(
  id: string
): Promise<{
  lead: Lead | null;
  notes: LeadNote[];
  tasks: LeadTask[];
}> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const { getLeadById, getLeadNotes, getLeadTasks } = await import(
      "@/lib/supabase/queries/crm"
    );
    const supabase = await createClient();
    const lead = await getLeadById(supabase, id);
    if (!lead) return { lead: null, notes: [], tasks: [] };

    const [notes, tasks] = await Promise.all([
      getLeadNotes(supabase, id),
      getLeadTasks(supabase, id),
    ]);

    return { lead, notes, tasks };
  }
  return { lead: null, notes: [], tasks: [] };
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const { lead, notes, tasks } = await getLeadData(id);

  if (!lead) {
    return (
      <div className="px-4 py-6 md:p-8 max-w-3xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-sm transition-colors mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Back to Leads
        </Link>
        <div className="text-center py-16">
          <p className="text-white/30 text-sm">Lead not found</p>
          <p className="text-white/15 text-xs mt-1">
            This lead may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:p-8 max-w-3xl">
      {/* Back link */}
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-sm transition-colors mb-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
        </svg>
        Back to Leads
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl text-tj-cream/90 tracking-wide">
          {lead.name}
        </h1>
        <p className="text-xs text-white/25 mt-1 font-accent uppercase tracking-[0.15em]">
          Lead Detail
        </p>
      </div>

      <LeadDetailClient lead={lead} notes={notes} tasks={tasks} />
    </div>
  );
}
