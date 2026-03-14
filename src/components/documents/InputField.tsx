"use client";

interface Props {
  label: string;
  name: string;
  type?: string;
  uppercase?: boolean;
  step?: string;
  min?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  dark?: boolean;
}

export default function InputField({ label, name, type = "text", uppercase = false, step, min, value, onChange, placeholder, disabled, dark = true }: Props) {
  const inputClasses = dark
    ? `w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-lg focus:outline-none focus:border-tj-gold/50 focus:ring-1 focus:ring-tj-gold/30 transition-all text-sm text-white placeholder:text-white/30 ${uppercase ? 'uppercase' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
    : `w-full px-4 py-3 bg-white border border-black/10 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all text-sm ${uppercase ? 'uppercase' : ''} ${disabled ? 'bg-gray-50 text-gray-400' : ''}`;

  return (
    <div>
      <label className={`block text-[10px] font-semibold tracking-widest uppercase mb-2 ${dark ? 'text-white/50' : 'text-black/70'}`}>{label}</label>
      <input type={type} name={name} value={value ?? ''} onChange={onChange} step={step} min={min} placeholder={placeholder} disabled={disabled} className={inputClasses} />
    </div>
  );
}
