"use client";

import { useState, useRef, useEffect } from 'react';

export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
}

interface Props {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddressSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  disabled?: boolean;
  dark?: boolean;
}

interface NominatimResult {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

const STATE_MAP: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
  'District of Columbia': 'DC',
};

function stateToAbbr(name: string): string {
  return STATE_MAP[name] || name;
}

export default function AddressAutocomplete({ label, name, value, onChange, onAddressSelect, placeholder, disabled, dark = true }: Props) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (query: string) => {
    if (query.length < 4) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=us&limit=5`, { headers: { 'Accept': 'application/json' } });
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setShowDropdown(data.length > 0);
    } catch { setSuggestions([]); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(e.target.value), 500);
  };

  const handleSelect = (result: NominatimResult) => {
    const addr = result.address;
    const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
    const city = addr.city || addr.town || addr.village || '';
    const state = stateToAbbr(addr.state || '');
    const zip = addr.postcode || '';
    const county = (addr.county || '').replace(/\s*County$/i, '');
    onAddressSelect({ street, city, state, zip, county });
    setShowDropdown(false);
    setSuggestions([]);
  };

  const inputClasses = dark
    ? `w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-lg focus:outline-none focus:border-tj-gold/50 focus:ring-1 focus:ring-tj-gold/30 transition-all text-sm text-white placeholder:text-white/30 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
    : `w-full px-4 py-3 bg-white border border-black/10 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all text-sm ${disabled ? 'bg-gray-50 text-gray-400' : ''}`;

  return (
    <div ref={containerRef} className="relative">
      <label className={`block text-[10px] font-semibold tracking-widest uppercase mb-2 ${dark ? 'text-white/50' : 'text-black/70'}`}>{label}</label>
      <div className="relative">
        <input type="text" name={name} value={value || ''} onChange={handleInputChange} onFocus={() => suggestions.length > 0 && setShowDropdown(true)} placeholder={placeholder} disabled={disabled} autoComplete="street-address" className={inputClasses} />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-tj-gold/30 border-t-tj-gold rounded-full animate-spin" />
          </div>
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-[200px] overflow-y-auto">
          {suggestions.map((s, i) => (
            <button key={i} type="button" onClick={() => handleSelect(s)} className="w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-tj-gold/10 transition-colors border-b border-white/5 last:border-b-0">
              <span className="line-clamp-2">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
