"use client";

import { useState, useEffect, useRef } from 'react';

export interface BuyerOption {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

interface Props {
  onSelect: (buyer: BuyerOption) => void;
}

export default function BuyerSelect({ onSelect }: Props) {
  const [leads, setLeads] = useState<BuyerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<BuyerOption | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/leads')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load buyers');
        return res.json();
      })
      .then(setLeads)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = leads.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${l.name} ${l.phone} ${l.email}`.toLowerCase().includes(q);
  });

  const handleSelect = (l: BuyerOption) => {
    setSelected(l);
    setOpen(false);
    setSearch('');
    onSelect(l);
  };

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, '');
    if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
    return p;
  };

  if (error) {
    return (
      <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
        Failed to load buyers
      </div>
    );
  }

  return (
    <div ref={ref} className="relative mb-4">
      <label className="block text-[11px] font-semibold tracking-widest uppercase text-tj-gold/80 mb-2">
        Select from CRM
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="w-full px-4 py-3 bg-tj-gold/[0.08] border border-tj-gold/20 rounded-lg text-left text-base text-white hover:border-tj-gold/40 transition-all disabled:opacity-50 flex justify-between items-center"
      >
        <span className={selected ? 'text-white' : 'text-white/40'}>
          {loading ? 'Loading...' : selected ? `${selected.name} — ${formatPhone(selected.phone)}` : 'Choose a buyer...'}
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
              placeholder="Search by name, phone, email..."
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-tj-gold/50"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-white/30">No buyers found</div>
            ) : (
              filtered.map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleSelect(l)}
                  className="w-full px-4 py-2.5 text-left hover:bg-tj-gold/10 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white font-medium">{l.name}</span>
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                      l.status === 'Sold' ? 'bg-green-500/20 text-green-400' :
                      l.status === 'Negotiation' ? 'bg-amber-500/20 text-amber-400' :
                      l.status === 'Appointment' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-white/10 text-white/50'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {formatPhone(l.phone)}{l.email ? ` · ${l.email}` : ''}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
