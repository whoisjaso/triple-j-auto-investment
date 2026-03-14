"use client";

import { useRef, useEffect, useState } from 'react';
import SignaturePadLib from 'signature_pad';

interface Props {
  label: string;
  value: string;
  dateValue: string;
  onChange: (signature: string) => void;
  onDateChange: (date: string) => void;
}

export default function SignaturePad({ label, value, dateValue, onChange, onDateChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);
    const pad = new SignaturePadLib(canvas, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: '#1a1a1a',
      minWidth: 1,
      maxWidth: 2.5,
    });
    pad.addEventListener('endStroke', () => {
      const data = pad.toDataURL('image/png');
      onChange(data);
      setIsEmpty(false);
      if (!dateValue) onDateChange(new Date().toISOString().split('T')[0]);
    });
    if (value) {
      pad.fromDataURL(value, { ratio: 1, width: rect.width, height: rect.height });
      setIsEmpty(false);
    }
    padRef.current = pad;
    return () => { pad.off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClear = () => {
    padRef.current?.clear();
    onChange('');
    onDateChange('');
    setIsEmpty(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold tracking-widest uppercase text-white/50">{label}</label>
        <div className="flex items-center space-x-3">
          {!isEmpty && (
            <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
              <span>Signed</span>
            </span>
          )}
          <button onClick={handleClear} className="text-[10px] font-semibold tracking-wider uppercase text-red-400 hover:text-red-300 transition-colors">
            Clear
          </button>
        </div>
      </div>
      <div className="border border-white/10 rounded-lg overflow-hidden bg-white relative">
        <canvas ref={canvasRef} className="w-full cursor-crosshair touch-none" style={{ height: '120px' }} />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-black/20 text-sm italic">Sign here</span>
          </div>
        )}
        <div className="border-t border-dashed border-black/20 mx-4" />
      </div>
      {dateValue && (
        <div className="text-[10px] text-white/40 text-right">
          Signed: {new Date(dateValue + 'T12:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
        </div>
      )}
    </div>
  );
}
