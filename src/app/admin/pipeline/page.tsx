import type { Vehicle } from "@/types/database";
import PipelineClient from "@/components/admin/PipelineClient";

async function getPipelineData(): Promise<Vehicle[]> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const { getPipelineVehicles } = await import(
      "@/lib/supabase/queries/pipeline"
    );
    const supabase = await createClient();
    return getPipelineVehicles(supabase);
  }
  return [];
}

const STAGE_ORDER = [
  "Bidding",
  "Purchased",
  "In_Transit",
  "Arrived",
  "Inspection",
] as const;

export default async function AdminPipelinePage() {
  const vehicles = await getPipelineData();

  // Group vehicles by status
  const grouped: Record<string, Vehicle[]> = {};
  for (const status of STAGE_ORDER) {
    grouped[status] = [];
  }
  for (const v of vehicles) {
    if (grouped[v.status]) {
      grouped[v.status].push(v);
    }
  }

  return (
    <div className="px-3 py-3 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="font-serif text-xl md:text-3xl text-tj-cream/90 tracking-wide">
          Pipeline
        </h1>
        <p className="text-xs text-white/25 mt-1 font-accent uppercase tracking-[0.15em]">
          {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} in
          pipeline
        </p>
      </div>

      <PipelineClient groupedVehicles={grouped} totalCount={vehicles.length} />
    </div>
  );
}
