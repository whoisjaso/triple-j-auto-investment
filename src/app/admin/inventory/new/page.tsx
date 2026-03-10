import Link from "next/link";
import VehicleForm from "@/components/admin/VehicleForm";
import { createVehicle } from "@/lib/actions/vehicles";

export default function AdminNewVehiclePage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link
          href="/admin/inventory"
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5 mb-3"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Inventory
        </Link>
        <h1 className="text-2xl font-serif text-neutral-100">Add Vehicle</h1>
      </div>

      <VehicleForm action={createVehicle} />
    </div>
  );
}
