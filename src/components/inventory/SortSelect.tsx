"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { VehicleSortOption } from "@/lib/supabase/queries/vehicles";

export default function SortSelect({
  currentSort,
}: {
  currentSort: VehicleSortOption;
}) {
  const t = useTranslations("filters");
  const router = useRouter();
  const searchParams = useSearchParams();

  const SORT_OPTIONS: { value: VehicleSortOption; labelKey: string }[] = [
    { value: "newest", labelKey: "recentlyAdded" },
    { value: "price_asc", labelKey: "priceLowHigh" },
    { value: "price_desc", labelKey: "priceHighLow" },
    { value: "year_desc", labelKey: "yearNewest" },
    { value: "year_asc", labelKey: "yearOldest" },
    { value: "mileage_asc", labelKey: "mileageLowest" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const value = e.target.value;
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`/inventory?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="sort-select"
        className="font-accent text-[10px] uppercase tracking-[0.2em] text-white/30 hidden md:block"
      >
        {t("sortBy")}
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={handleChange}
        className="bg-transparent font-accent text-[11px] uppercase tracking-[0.15em] text-tj-cream/60 border border-white/[0.08] rounded-sm px-3 py-2 min-h-[44px] cursor-pointer hover:border-white/20 transition-colors focus:outline-none focus:border-tj-gold/30 appearance-none pr-8"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23ffffff' stroke-opacity='0.3' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-black">
            {t(opt.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
