"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Upload, X, SwitchCamera } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}

export default function IdUpload({ label, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Please upload an image under 10MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { onChange(reader.result as string); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Cleanup stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopStream();
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError('Camera not available. Please use the upload button instead.');
    }
  }, [stopStream]);

  // Open camera overlay
  const handleOpenCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      // Fallback to input capture
      cameraRef.current?.click();
      return;
    }
    setShowCamera(true);
  };

  // Camera starts when overlay opens
  useEffect(() => {
    if (showCamera) {
      startCamera(facingMode);
    }
    return () => { if (showCamera) stopStream(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCamera]);

  // Flip camera
  const handleFlip = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  // Capture frame
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onChange(dataUrl);
    stopStream();
    setShowCamera(false);
  };

  const handleCloseCamera = () => {
    stopStream();
    setShowCamera(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  return (
    <>
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
                <button onClick={handleOpenCamera} className="px-4 py-2 bg-tj-gold text-white rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-tj-gold/90 transition-all flex items-center space-x-1.5 shadow-md min-h-[48px]">
                  <Camera size={12} /><span>Camera</span>
                </button>
                <button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-white/10 text-white rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-white/15 transition-all flex items-center space-x-1.5 border border-white/10 min-h-[48px]">
                  <Upload size={12} /><span>Upload</span>
                </button>
              </div>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      </div>

      {/* Camera overlay with ID guide */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-black/80">
            <span className="text-white/70 text-sm font-semibold">Capture ID Photo</span>
            <button onClick={handleCloseCamera} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Video with ID guide overlay */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {cameraError ? (
              <div className="text-center p-6">
                <p className="text-white/60 text-sm">{cameraError}</p>
                <button onClick={() => { handleCloseCamera(); fileRef.current?.click(); }} className="mt-4 px-6 py-2 bg-white/10 text-white rounded-full text-sm">
                  Upload Instead
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* ID card guide overlay — 1.588:1 aspect ratio (standard ID/credit card) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="border-2 border-white/60 rounded-xl"
                    style={{
                      width: 'min(85vw, 500px)',
                      aspectRatio: '1.588 / 1',
                    }}
                  >
                    {/* Corner marks */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-white rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-white rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-white rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-white rounded-br-xl" />
                  </div>
                  <p className="absolute bottom-4 text-white/60 text-xs text-center">
                    Align your ID within the frame
                  </p>
                </div>
                {/* Semi-transparent overlay outside guide */}
                <div className="absolute inset-0 bg-black/40 pointer-events-none" style={{
                  maskImage: `radial-gradient(ellipse 45% 35% at center, transparent 98%, black 100%)`,
                  WebkitMaskImage: `radial-gradient(ellipse 45% 35% at center, transparent 98%, black 100%)`,
                }} />
              </>
            )}
          </div>

          {/* Controls */}
          {!cameraError && (
            <div className="flex items-center justify-center space-x-8 px-4 py-6 bg-black/80 shrink-0">
              <button onClick={handleFlip} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:bg-white/20 transition-all" title="Flip camera">
                <SwitchCamera size={20} />
              </button>
              <button onClick={handleCapture} className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-white/90 transition-all border-4 border-white/30 shadow-lg">
                <div className="w-12 h-12 bg-white rounded-full border-2 border-black/10" />
              </button>
              <div className="w-12" /> {/* Spacer for centering */}
            </div>
          )}
        </div>
      )}
    </>
  );
}
