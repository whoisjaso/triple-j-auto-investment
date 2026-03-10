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
  Available: "bg-green-500/15 text-green-400 border-green-500/20",
  Pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Sold: "bg-neutral-500/15 text-neutral-400 border-neutral-500/20",
};

export default async function AdminInventoryPage() {
  const vehicles = await getInventory();

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-neutral-100">Inventory</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/inventory/new"
          className="px-4 py-2.5 bg-tj-gold/90 hover:bg-tj-gold text-black font-accent text-xs uppercase tracking-[0.15em] rounded-md min-h-[44px] flex items-center gap-2 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-12 text-center">
          <p className="text-neutral-500 mb-4">No vehicles in inventory.</p>
          <Link
            href="/admin/inventory/new"
            className="text-sm text-tj-gold hover:text-tj-gold-light transition-colors"
          >
            Add your first vehicle &rarr;
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block border border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Mileage
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-neutral-200">
                        {v.year} {v.make} {v.model}
                      </p>
                      {v.vin && (
                        <p className="text-xs text-neutral-600 mt-0.5 font-mono">
                          {v.vin}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-300">
                      ${v.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400">
                      {v.mileage.toLocaleString()} mi
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs px-2.5 py-1 rounded-full border ${
                          statusColors[v.status] || statusColors.Available
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/inventory/${v.id}/edit`}
                          className="text-xs text-neutral-400 hover:text-tj-gold transition-colors px-2 py-1.5 rounded min-h-[36px] flex items-center"
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
          <div className="md:hidden space-y-3">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-neutral-200">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {v.mileage.toLocaleString()} mi
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      statusColors[v.status] || statusColors.Available
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
                <p className="text-lg font-medium text-neutral-100 mb-3">
                  ${v.price.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/inventory/${v.id}/edit`}
                    className="flex-1 text-center text-xs text-neutral-300 bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-md min-h-[44px] flex items-center justify-center transition-colors"
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
