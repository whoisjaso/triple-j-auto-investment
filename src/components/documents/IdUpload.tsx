"use client";

import { useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}

export default function IdUpload({ label, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Please upload an image under 10MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { onChange(reader.result as string); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50">{label}</label>
      {value ? (
        <div className="relative border border-tj-gold/30 rounded-xl overflow-hidden bg-white/5">
          <img src={value} alt="Customer ID" className="w-full max-h-[220px] object-contain p-2" />
          <button onClick={() => onChange('')} className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg">
            <X size={14} />
          </button>
          <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex items-center space-x-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            <span>ID Captured</span>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-white/10 rounded-xl p-6 bg-white/[0.02] text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
              <Camera size={20} className="text-white/30" />
            </div>
            <p className="text-xs text-white/40">Upload or capture a photo of the customer&apos;s ID</p>
            <div className="flex space-x-3">
              <button onClick={() => cameraRef.current?.click()} className="px-4 py-2 bg-tj-gold text-white rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-tj-gold/90 transition-all flex items-center space-x-1.5 shadow-md">
                <Camera size={12} /><span>Camera</span>
              </button>
              <button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-white/10 text-white rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-white/15 transition-all flex items-center space-x-1.5 border border-white/10">
                <Upload size={12} /><span>Upload</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
    </div>
  );
}
