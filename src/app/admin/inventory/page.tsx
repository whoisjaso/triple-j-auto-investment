import Link from "next/link";
import type { Vehicle } from "@/types/database";
import { deleteVehicle } from "@/lib/actions/vehicles";
import DeleteButton from "@/components/admin/DeleteButton";

async function getInventory(): Promise<Vehicle[]> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const { getAdminVehicles } = await import(
      "@/lib/supabase/queries/vehicles"
    );
    const supabase = await createClient();
    return getAdminVehicles(supabase);
  }
  const { getMockAdminVehicles } = await import("@/lib/mock-vehicles");
  return getMockAdminVehicles();
}

const statusColors: Record<string, string> = {
  Available: "bg-emerald-400/10 text-emerald-400 border-emerald-400/15",
  Pending: "bg-amber-400/10 text-amber-400 border-amber-400/15",
  Sold: "bg-white/[0.04] text-white/30 border-white/[0.06]",
};

export default async function AdminInventoryPage() {
  const vehicles = await getInventory();

  return (
    <div className="px-4 py-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-tj-cream/90 tracking-wide">
            Inventory
          </h1>
          <p className="text-xs text-white/25 mt-1 font-accent uppercase tracking-[0.15em]">
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/inventory/new"
          className="px-4 py-2.5 bg-gradient-to-r from-tj-gold/90 to-tj-gold-light/90 hover:from-tj-gold hover:to-tj-gold-light text-black font-accent text-[10px] uppercase tracking-[0.15em] rounded-lg min-h-[44px] flex items-center gap-2 transition-all duration-300"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Add Vehicle</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-12 text-center">
          <p className="text-white/30 text-sm mb-4">
            No vehicles in inventory.
          </p>
          <Link
            href="/admin/inventory/new"
            className="text-xs text-tj-gold/60 hover:text-tj-gold transition-colors font-accent uppercase tracking-[0.12em]"
          >
            Add your first vehicle &rarr;
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-white/[0.04] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium">
                    Vehicle
                  </th>
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium">
                    Price
                  </th>
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium">
                    Mileage
                  </th>
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-accent text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {vehicles.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-white/[0.02] transition-colors duration-200"
                  >
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-tj-cream/80">
                        {v.year} {v.make} {v.model}
                      </p>
                      {v.vin && (
                        <p className="text-[10px] text-white/15 mt-0.5 font-mono">
                          {v.vin}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-tj-cream/70">
                      ${v.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-white/30">
                      {v.mileage.toLocaleString()} mi
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block text-[10px] px-2.5 py-1 rounded-full border ${
                          statusColors[v.status] || statusColors.Available
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/inventory/${v.id}/edit`}
                          className="text-[10px] font-accent uppercase tracking-[0.1em] text-white/30 hover:text-tj-gold/70 transition-colors px-2.5 py-1.5 rounded-lg min-h-[36px] flex items-center hover:bg-white/[0.03]"
                        >
                          Edit
                        </Link>
                        <DeleteButton id={v.id} action={deleteVehicle} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-tj-cream/80 truncate">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="text-[10px] text-white/20 mt-0.5">
                      {v.mileage.toLocaleString()} mi
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full border shrink-0 ${
                      statusColors[v.status] || statusColors.Available
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
                <p className="font-serif text-lg text-tj-cream/90 mb-3">
                  ${v.price.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/inventory/${v.id}/edit`}
                    className="flex-1 text-center text-[10px] font-accent uppercase tracking-[0.1em] text-white/40 bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2.5 rounded-lg min-h-[44px] flex items-center justify-center transition-all duration-200 border border-white/[0.04]"
                  >
                    Edit
                  </Link>
                  <DeleteButton id={v.id} action={deleteVehicle} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
