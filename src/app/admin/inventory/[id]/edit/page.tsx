import { notFound } from "next/navigation";
import Link from "next/link";
import type { Vehicle } from "@/types/database";
import VehicleForm from "@/components/admin/VehicleForm";
import { updateVehicle } from "@/lib/actions/vehicles";

async function getVehicle(id: string): Promise<Vehicle | null> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const { getVehicleById } = await import(
      "@/lib/supabase/queries/vehicles"
    );
    const supabase = await createClient();
    return getVehicleById(supabase, id);
  }
  const { getMockVehicleById } = await import("@/lib/mock-vehicles");
  return getMockVehicleById(id);
}

export default async function AdminEditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="px-3 py-3 md:p-8 max-w-5xl">
      <div className="mb-4 md:mb-6">
        <Link
          href="/admin/inventory"
          className="text-[10px] font-accent uppercase tracking-[0.12em] text-white/25 hover:text-white/50 transition-colors inline-flex items-center gap-1.5 mb-3 min-h-[44px]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Inventory
        </Link>
        <h1 className="font-serif text-xl md:text-3xl text-tj-cream/90 tracking-wide">
          Edit: {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
      </div>

      <VehicleForm vehicle={vehicle} action={updateVehicle} />
    </div>
  );
}
