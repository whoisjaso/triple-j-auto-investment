"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import { Maximize2, X } from 'lucide-react';
import SignaturePadLib from 'signature_pad';

interface Props {
  label: string;
  value: string;
  dateValue: string;
  onChange: (signature: string) => void;
  onDateChange: (date: string) => void;
}

function initCanvas(canvas: HTMLCanvasElement, pad: SignaturePadLib | null, value: string): SignaturePadLib {
  const ratio = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2x (~33MB vs 74MB)
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.scale(ratio, ratio);
  if (pad) { pad.off(); }
  const newPad = new SignaturePadLib(canvas, {
    backgroundColor: 'rgba(255,255,255,0)',
    penColor: '#1a1a1a',
    minWidth: 1,
    maxWidth: 2.5,
  });
  if (value) {
    newPad.fromDataURL(value, { ratio: 1, width: rect.width, height: rect.height });
  }
  return newPad;
}

export default function SignaturePad({ label, value, dateValue, onChange, onDateChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const modalPadRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(!value);
  const [showModal, setShowModal] = useState(false);

  const handleStrokeEnd = useCallback(() => {
    const pad = showModal ? modalPadRef.current : padRef.current;
    if (!pad) return;
    const data = pad.toDataURL('image/png');
    onChange(data);
    setIsEmpty(false);
    if (!dateValue) onDateChange(new Date().toISOString().split('T')[0]);
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
  }, [showModal, onChange, dateValue, onDateChange]);

  // Init inline canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = initCanvas(canvas, padRef.current, value);
    pad.addEventListener('endStroke', () => {
      const data = pad.toDataURL('image/png');
      onChange(data);
      setIsEmpty(false);
      if (!dateValue) onDateChange(new Date().toISOString().split('T')[0]);
    });
    if (value) setIsEmpty(false);
    padRef.current = pad;
    return () => { pad.off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Init modal canvas + orientation resize
  useEffect(() => {
    if (!showModal) return;
    const canvas = modalCanvasRef.current;
    if (!canvas) return;

    const setupPad = () => {
      const pad = initCanvas(canvas, modalPadRef.current, value);
      pad.addEventListener('endStroke', handleStrokeEnd);
      if (value) setIsEmpty(false);
      modalPadRef.current = pad;
    };

    // Small delay for modal to render
    const timer = setTimeout(setupPad, 50);

    const handleResize = () => {
      // Save current signature before resize
      const currentData = modalPadRef.current?.toDataURL('image/png');
      if (modalPadRef.current) modalPadRef.current.off();
      const newPad = initCanvas(canvas, null, currentData || value);
      newPad.addEventListener('endStroke', handleStrokeEnd);
      modalPadRef.current = newPad;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (modalPadRef.current) { modalPadRef.current.off(); modalPadRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const handleClear = () => {
    padRef.current?.clear();
    modalPadRef.current?.clear();
    onChange('');
    onDateChange('');
    setIsEmpty(true);
  };

  const handleOpenModal = () => setShowModal(true);

  const handleCloseModal = () => {
    // Sync modal signature back to inline pad
    if (modalPadRef.current && value && padRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        padRef.current.fromDataURL(value, { ratio: 1, width: rect.width, height: rect.height });
      }
    }
    setShowModal(false);
  };

  return (
    <>
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
            <button onClick={handleOpenModal} className="text-[10px] font-semibold tracking-wider uppercase text-white/40 hover:text-white/70 transition-colors flex items-center space-x-1" title="Sign in fullscreen">
              <Maximize2 size={10} />
              <span>Expand</span>
            </button>
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

      {/* Full-screen signature modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-white/70 text-sm font-semibold">{label}</span>
            <div className="flex items-center space-x-3">
              <button onClick={handleClear} className="text-[10px] font-semibold tracking-wider uppercase text-red-400 hover:text-red-300 transition-colors">
                Clear
              </button>
              <button onClick={handleCloseModal} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl overflow-hidden relative">
              <canvas
                ref={modalCanvasRef}
                className="w-full cursor-crosshair touch-none"
                style={{ height: 'min(60vh, 400px)' }}
              />
              {isEmpty && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-black/15 text-lg italic">Sign here</span>
                </div>
              )}
              <div className="border-t border-dashed border-black/20 mx-8" />
            </div>
          </div>
          <div className="px-4 py-3 flex justify-center shrink-0">
            <button
              onClick={handleCloseModal}
              className="px-8 py-3 bg-[#b89b5e] text-white rounded-full text-sm font-bold tracking-widest uppercase hover:bg-[#b89b5e]/90 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
