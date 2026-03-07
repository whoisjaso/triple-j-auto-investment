import React, { useRef, useState, useEffect, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Check, RotateCcw, Pen } from 'lucide-react';

interface SignatureCaptureProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  savedSignature?: string;
  disabled?: boolean;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onSave,
  onClear,
  savedSignature,
  disabled = false,
}) => {
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [showCanvas, setShowCanvas] = useState(!savedSignature);
  const [canvasWidth, setCanvasWidth] = useState(400);

  // Measure container width for responsive canvas
  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      if (width > 0) {
        setCanvasWidth(width);
      }
    }
  }, []);

  useEffect(() => {
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [updateWidth]);

  // Recalculate width when switching to canvas mode
  useEffect(() => {
    if (showCanvas) {
      // Small delay to allow DOM to render before measuring
      const timer = setTimeout(updateWidth, 50);
      return () => clearTimeout(timer);
    }
  }, [showCanvas, updateWidth]);

  const handleClear = () => {
    if (sigRef.current) {
      sigRef.current.clear();
      setIsEmpty(true);
    }
    onClear?.();
  };

  const handleAccept = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const handleEnd = () => {
    if (sigRef.current) {
      setIsEmpty(sigRef.current.isEmpty());
    }
  };

  const handleResign = () => {
    setShowCanvas(true);
    setIsEmpty(true);
    // Clear saved state via callback
    onClear?.();
  };

  // Disabled mode: show saved signature as static image
  if (disabled && savedSignature) {
    return (
      <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-widest text-gray-500">
          Signature (Captured)
        </label>
        <div className="bg-white p-2 border border-tj-gold/20">
          <img
            src={savedSignature}
            alt="Captured signature"
            className="w-full h-[150px] object-contain"
          />
        </div>
      </div>
    );
  }

  // Saved signature view: show image with re-sign option
  if (savedSignature && !showCanvas) {
    return (
      <div className="space-y-3">
        <label className="block text-[10px] uppercase tracking-widest text-gray-500">
          Signature (Captured)
        </label>
        <div className="bg-white p-2 border border-tj-gold/20">
          <img
            src={savedSignature}
            alt="Captured signature"
            className="w-full h-[150px] object-contain"
          />
        </div>
        <button
          type="button"
          onClick={handleResign}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs uppercase tracking-widest border border-white/20 transition-colors"
        >
          <Pen size={14} />
          Re-sign
        </button>
      </div>
    );
  }

  // Canvas mode: active signature pad
  return (
    <div className="space-y-3">
      <label className="block text-[10px] uppercase tracking-widest text-gray-500">
        Signature
      </label>

      {/* Signature canvas area */}
      <div
        ref={containerRef}
        className="relative bg-white border-2 border-dashed border-gray-300 overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        {/* Placeholder text when empty */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="text-gray-400 text-sm italic select-none">
              Sign here
            </span>
          </div>
        )}

        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          minWidth={1}
          maxWidth={3}
          canvasProps={{
            width: canvasWidth,
            height: 200,
            className: 'signature-canvas',
            style: { width: '100%', height: '200px' },
          }}
          backgroundColor="rgba(255,255,255,1)"
          onEnd={handleEnd}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={isEmpty}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs uppercase tracking-widest border border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} />
          Clear
        </button>
        <button
          type="button"
          onClick={handleAccept}
          disabled={isEmpty}
          className="flex items-center gap-2 px-4 py-2 bg-tj-gold hover:bg-white text-black text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Check size={14} />
          Accept Signature
        </button>
      </div>
    </div>
  );
};

export default SignatureCapture;
