"use client";

import { useState, useEffect, useRef } from 'react';

export interface VehicleOption {
  id: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  trim: string;
  exteriorColor: string;
  bodyStyle: string;
  mileage: number;
  price: number;
  status: string;
  licensePlate: string;
  stockNumber: string;
}

interface Props {
  onSelect: (vehicle: VehicleOption) => void;
}

export default function VehicleSelect({ onSelect }: Props) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<VehicleOption | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/vehicles')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load vehicles');
        return res.json();
      })
      .then(setVehicles)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = vehicles.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${v.year} ${v.make} ${v.model} ${v.vin} ${v.trim}`.toLowerCase().includes(q);
  });

  const handleSelect = (v: VehicleOption) => {
    setSelected(v);
    setOpen(false);
    setSearch('');
    onSelect(v);
  };

  const displayLabel = (v: VehicleOption) =>
    `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ''} — ${v.vin.slice(-4)}`;

  if (error) {
    return (
      <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
        Failed to load vehicles
      </div>
    );
  }

  return (
    <div ref={ref} className="relative mb-4">
      <label className="block text-[11px] font-semibold tracking-widest uppercase text-tj-gold/80 mb-2">
        Select from Inventory
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="w-full px-4 py-3 bg-tj-gold/[0.08] border border-tj-gold/20 rounded-lg text-left text-base text-white hover:border-tj-gold/40 transition-all disabled:opacity-50 flex justify-between items-center"
      >
        <span className={selected ? 'text-white' : 'text-white/40'}>
          {loading ? 'Loading...' : selected ? displayLabel(selected) : 'Choose a vehicle...'}
        </span>
        <svg className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl max-h-64 overflow-hidden">
          <div className="p-2 border-b border-white/[0.06]">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by year, make, model, VIN..."
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-tj-gold/50"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-white/30">No vehicles found</div>
            ) : (
              filtered.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelect(v)}
                  className="w-full px-4 py-2.5 text-left hover:bg-tj-gold/10 transition-colors flex justify-between items-center"
                >
                  <div>
                    <span className="text-sm text-white font-medium">{v.year} {v.make} {v.model}</span>
                    {v.trim && <span className="text-sm text-white/50 ml-1">{v.trim}</span>}
                    <span className="text-xs text-white/30 ml-2">...{v.vin.slice(-4)}</span>
                  </div>
                  <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                    v.status === 'Available' ? 'bg-green-500/20 text-green-400' :
                    v.status === 'Sold' ? 'bg-red-500/20 text-red-400' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {v.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
