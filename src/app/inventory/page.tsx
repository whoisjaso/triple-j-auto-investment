import Link from "next/link";
import type { VehicleFilters } from "@/types/database";
import type { VehicleSortOption } from "@/lib/supabase/queries/vehicles";
import { getMockVehicles, getMockMakes } from "@/lib/mock-vehicles";
import VehicleCard from "@/components/inventory/VehicleCard";
import FilterBar from "@/components/inventory/FilterBar";
import SortSelect from "@/components/inventory/SortSelect";
import VinDecoder from "@/components/inventory/VinDecoder";

const VALID_SORTS: VehicleSortOption[] = [
  "newest",
  "price_asc",
  "price_desc",
  "year_desc",
  "year_asc",
  "mileage_asc",
];

function parseSort(value: string | undefined): VehicleSortOption {
  if (value && VALID_SORTS.includes(value as VehicleSortOption)) {
    return value as VehicleSortOption;
  }
  return "newest";
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const make = typeof params.make === "string" ? params.make : undefined;
  const minPrice = parseNumber(
    typeof params.minPrice === "string" ? params.minPrice : undefined
  );
  const maxPrice = parseNumber(
    typeof params.maxPrice === "string" ? params.maxPrice : undefined
  );
  const minYear = parseNumber(
    typeof params.minYear === "string" ? params.minYear : undefined
  );
  const maxYear = parseNumber(
    typeof params.maxYear === "string" ? params.maxYear : undefined
  );
  const search =
    typeof params.search === "string" ? params.search : undefined;
  const sort = parseSort(
    typeof params.sort === "string" ? params.sort : undefined
  );

  const filters: VehicleFilters = {
    make,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    search,
  };

  // Fetch vehicles — Supabase when connected, mock data otherwise
  let vehicles;
  let makes: string[];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const { getVehicles } = await import(
      "@/lib/supabase/queries/vehicles"
    );
    const supabase = await createClient();
    vehicles = await getVehicles(supabase, filters, sort);
    // Get all makes for filter dropdown (unfiltered query)
    const allVehicles = await getVehicles(supabase);
    makes = [...new Set(allVehicles.map((v) => v.make))].sort();
  } else {
    vehicles = getMockVehicles(filters, sort);
    makes = getMockMakes();
  }

  const hasFilters =
    make || minPrice || maxPrice || minYear || maxYear || search;

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-tj-cream font-light">
              Our Collection
            </h1>
            <p className="mt-2 font-accent text-[11px] uppercase tracking-[0.25em] text-white/30">
              {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}{" "}
              available
            </p>
          </div>
          <SortSelect currentSort={sort} />
        </div>

        {/* Filter bar */}
        <FilterBar
          makes={makes}
          currentFilters={{
            make: make || "",
            minPrice: minPrice?.toString() || "",
            maxPrice: maxPrice?.toString() || "",
            minYear: minYear?.toString() || "",
            maxYear: maxYear?.toString() || "",
            search: search || "",
          }}
        />

        {/* VIN Decoder */}
        <div className="mt-4">
          <VinDecoder />
        </div>

        {/* Vehicle grid */}
        {vehicles.length > 0 ? (
          <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="mt-16 md:mt-24 flex flex-col items-center text-center">
            <p className="font-serif text-lg text-tj-cream/60">
              No vehicles match your filters
            </p>
            {hasFilters && (
              <Link
                href="/inventory"
                className="mt-4 font-accent text-[11px] uppercase tracking-[0.25em] text-tj-gold/70 hover:text-tj-gold transition-colors border-b border-tj-gold/20 hover:border-tj-gold/50 pb-1"
              >
                Browse All Vehicles
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
