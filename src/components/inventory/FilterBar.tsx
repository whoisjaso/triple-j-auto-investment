"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface FilterBarProps {
  makes: string[];
  currentFilters: {
    make: string;
    minPrice: string;
    maxPrice: string;
    minYear: string;
    maxYear: string;
    search: string;
  };
}

export default function FilterBar({ makes, currentFilters }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(currentFilters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCount = [
    currentFilters.make,
    currentFilters.minPrice,
    currentFilters.maxPrice,
    currentFilters.minYear,
    currentFilters.maxYear,
    currentFilters.search,
  ].filter(Boolean).length;

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      router.push(qs ? `/inventory?${qs}` : "/inventory");
    },
    [router, searchParams]
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchValue !== currentFilters.search) {
        updateFilter("search", searchValue);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue, currentFilters.search, updateFilter]);

  // Sync search value with URL
  useEffect(() => {
    setSearchValue(currentFilters.search);
  }, [currentFilters.search]);

  return (
    <div className="border border-white/[0.06] rounded-sm bg-white/[0.02]">
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="md:hidden w-full flex items-center justify-between px-4 min-h-[52px] text-left"
        aria-expanded={open}
      >
        <span className="font-accent text-[11px] uppercase tracking-[0.25em] text-tj-cream/60">
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Filter controls */}
      <div
        className={`${open ? "flex" : "hidden"} md:flex flex-col md:flex-row md:items-end gap-3 md:gap-4 p-4 md:py-4 md:px-5 ${open ? "border-t border-white/[0.04] md:border-t-0" : ""}`}
      >
        {/* Search */}
        <div className="flex-1 min-w-0 md:max-w-[240px]">
          <label className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5">
            Search
          </label>
          <div className="relative">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Make or model..."
              className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pl-5 pb-1.5 outline-none placeholder:text-white/15 transition-colors min-h-[44px] md:min-h-0"
            />
          </div>
        </div>

        {/* Make */}
        <div className="md:w-[150px]">
          <label className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5">
            Make
          </label>
          <select
            value={currentFilters.make}
            onChange={(e) => updateFilter("make", e.target.value)}
            className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pb-1.5 outline-none cursor-pointer transition-colors min-h-[44px] md:min-h-0 appearance-none"
          >
            <option value="" className="bg-black">
              All Makes
            </option>
            {makes.map((m) => (
              <option key={m} value={m} className="bg-black">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Price range */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 md:w-[100px]">
            <label className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5">
              Min Price
            </label>
            <input
              type="number"
              value={currentFilters.minPrice}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
              placeholder="$3,000"
              min={0}
              step={500}
              className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pb-1.5 outline-none placeholder:text-white/15 transition-colors min-h-[44px] md:min-h-0"
            />
          </div>
          <span className="text-white/15 text-xs pb-2">–</span>
          <div className="flex-1 md:w-[100px]">
            <label className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5">
              Max Price
            </label>
            <input
              type="number"
              value={currentFilters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              placeholder="$8,000"
              min={0}
              step={500}
              className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pb-1.5 outline-none placeholder:text-white/15 transition-colors min-h-[44px] md:min-h-0"
            />
          </div>
        </div>

        {/* Year range */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 md:w-[80px]">
            <label className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5">
              Min Year
            </label>
            <input
              type="number"
              value={currentFilters.minYear}
              onChange={(e) => updateFilter("minYear", e.target.value)}
              placeholder="2015"
              min={2000}
              max={2030}
              className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pb-1.5 outline-none placeholder:text-white/15 transition-colors min-h-[44px] md:min-h-0"
            />
          </div>
          <span className="text-white/15 text-xs pb-2">–</span>
          <div className="flex-1 md:w-[80px]">
            <label className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5">
              Max Year
            </label>
            <input
              type="number"
              value={currentFilters.maxYear}
              onChange={(e) => updateFilter("maxYear", e.target.value)}
              placeholder="2024"
              min={2000}
              max={2030}
              className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pb-1.5 outline-none placeholder:text-white/15 transition-colors min-h-[44px] md:min-h-0"
            />
          </div>
        </div>

        {/* Clear all */}
        {activeCount > 0 && (
          <Link
            href="/inventory"
            className="font-accent text-[10px] uppercase tracking-[0.2em] text-tj-gold/50 hover:text-tj-gold transition-colors pb-1.5 whitespace-nowrap min-h-[44px] md:min-h-0 flex items-end"
          >
            Clear All
          </Link>
        )}
      </div>
    </div>
  );
}
