import Link from "next/link";
import type { Lead } from "@/types/database";
import LeadBoard from "@/components/admin/LeadBoard";

async function getAllLeads(): Promise<Lead[]> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const { getAdminLeads } = await import("@/lib/supabase/queries/leads");
    const supabase = await createClient();
    return getAdminLeads(supabase);
  }
  const { getMockLeads } = await import("@/lib/mock-leads");
  return getMockLeads();
}

export default async function AdminLeadsBoardPage() {
  const leads = await getAllLeads();

  return (
    <div className="px-4 py-6 md:p-8 max-w-[1400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-tj-cream/90 tracking-wide">
            Pipeline Board
          </h1>
          <p className="text-xs text-white/25 mt-1 font-accent uppercase tracking-[0.15em]">
            {leads.length} lead{leads.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.02] rounded-lg border border-white/[0.04] p-0.5">
          <Link
            href="/admin/leads"
            className="px-3 py-1.5 rounded-md text-[10px] font-accent uppercase tracking-[0.12em] text-white/30 hover:text-white/50 hover:bg-white/[0.03] transition-all"
          >
            List
          </Link>
          <span className="px-3 py-1.5 rounded-md text-[10px] font-accent uppercase tracking-[0.12em] text-tj-gold bg-white/[0.04]">
            Board
          </span>
        </div>
      </div>

      <LeadBoard leads={leads} />
    </div>
  );
}
