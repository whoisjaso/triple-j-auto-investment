"use client";

import { Download, Printer } from 'lucide-react';

interface Props {
  variant: 'pdf' | 'print';
  onClick?: () => void;
  className?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  light?: boolean;
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-[10px]',
  md: 'px-4 py-2 text-[10px]',
  lg: 'flex-1 py-3 text-[10px]',
};

export default function PrintButton({ variant, onClick, className, label, size = 'md', light = false }: Props) {
  const handleClick = onClick || (() => window.print());
  const Icon = variant === 'pdf' ? Download : Printer;
  const defaultLabel = variant === 'pdf' ? 'PDF' : 'Print';

  const themeClasses = light
    ? variant === 'pdf'
      ? 'bg-[#1a1a1a] text-[#b89b5e] border border-[#b89b5e]/30 hover:bg-[#1a1a1a]/90'
      : 'bg-[#b89b5e] text-white hover:bg-[#b89b5e]/90'
    : variant === 'pdf'
      ? 'bg-white/10 text-tj-gold border border-tj-gold/20 hover:bg-white/15'
      : 'bg-tj-gold text-white hover:bg-tj-gold/90';

  return (
    <button
      onClick={handleClick}
      className={className || `${sizeClasses[size]} ${themeClasses} rounded-full font-semibold tracking-wider uppercase flex items-center justify-center space-x-1 transition-all`}
    >
      <Icon size={12} />
      <span>{label || defaultLabel}</span>
    </button>
  );
}
