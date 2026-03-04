import { useRef, useEffect, useState } from 'react';

const TOTAL_FRAMES = 151;
const BATCH_SIZE = 20;
const FRAME_W = 1440;
const FRAME_H = 1440;

interface Phase {
  start: number;
  end: number;
  side: 'left' | 'right';
  label: string;
  heading: string;
  body: string;
}

const PHASES: Phase[] = [
  {
    start: 0.05, end: 0.28, side: 'right',
    label: 'The Experience',
    heading: 'Precision in Every Detail',
    body: '',
  },
  {
    start: 0.30, end: 0.50, side: 'left',
    label: '01',
    heading: 'AI-Powered Operations',
    body: 'Our 24/7 AI Concierge, Divine, ensures you have immediate access to information, scheduling, and support. Flawless execution, anytime.',
  },
  {
    start: 0.52, end: 0.72, side: 'right',
    label: '02',
    heading: 'Transparent Valuation',
    body: 'We utilize rigorous data-backed algorithms to price our assets. No hidden fees. No opaque negotiations. Just sovereign value.',
  },
  {
    start: 0.74, end: 0.94, side: 'left',
    label: '03',
    heading: 'White-Glove Delivery',
    body: 'Discreet, on-time delivery anywhere in Houston. Your asset arrives fully detailed, pristine, and ready for the road.',
  },
];

export const ScrollAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activePhases, setActivePhases] = useState<boolean[]>(new Array(PHASES.length).fill(false));

  useEffect(() => {
    let currentFrame = 0;
    let drawnFrame = -1;
    let rafId: number;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    // ── Preload frames in batches of 20 ──
    const loadFrames = async () => {
      for (let i = 0; i < TOTAL_FRAMES; i += BATCH_SIZE) {
        const batch: Promise<void>[] = [];
        for (let j = i; j < Math.min(i + BATCH_SIZE, TOTAL_FRAMES); j++) {
          batch.push(
            new Promise<void>((resolve) => {
              const img = new Image();
              const num = (j + 1).toString().padStart(4, '0');
              img.src = `/frames/frame-${num}.webp`;
              img.onload = () => { images[j] = img; resolve(); };
              img.onerror = () => { resolve(); };
            })
          );
        }
        await Promise.all(batch);
        setProgress(Math.min(100, Math.round(((i + BATCH_SIZE) / TOTAL_FRAMES) * 100)));
      }
      setLoaded(true);
    };

    loadFrames();

    // ── Passive scroll handler: calculate only ──
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;
      if (scrollDistance <= 0) return;

      const rawProgress = Math.max(0, Math.min(1, -rect.top / scrollDistance));
      currentFrame = Math.min(Math.floor(rawProgress * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1);

      // Phase visibility
      const next = PHASES.map(p => rawProgress >= p.start && rawProgress <= p.end);
      setActivePhases(prev => {
        for (let k = 0; k < prev.length; k++) {
          if (prev[k] !== next[k]) return next;
        }
        return prev;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // ── rAF render loop: draw only when frame changed ──
    const tick = () => {
      if (currentFrame !== drawnFrame && canvasRef.current) {
        const img = images[currentFrame];
        if (img) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            if (canvasRef.current.width !== FRAME_W) canvasRef.current.width = FRAME_W;
            if (canvasRef.current.height !== FRAME_H) canvasRef.current.height = FRAME_H;
            ctx.clearRect(0, 0, FRAME_W, FRAME_H);
            ctx.drawImage(img, 0, 0, FRAME_W, FRAME_H);
            drawnFrame = currentFrame;
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-[200vh] md:h-[400vh] bg-[#F7F7F7]">
      {/* Loading overlay */}
      {!loaded && (
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center z-50 bg-[#F7F7F7]">
          <img
            src="/GoldTripleJLogo.png"
            alt="Triple J Auto Investment"
            className="w-14 h-14 mb-8 opacity-40 animate-pulse"
          />
          <div className="w-48 h-[2px] bg-[#0e1b16]/[0.06] overflow-hidden">
            <div
              className="h-full bg-tj-gold transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[#0e1b16]/30 text-[10px] uppercase tracking-[0.4em] mt-4 font-sans">
            {progress}%
          </p>
        </div>
      )}

      {/* Sticky viewport */}
      <div
        className={`sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-[#F7F7F7] transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Canvas with radial mask */}
        <canvas
          ref={canvasRef}
          className="absolute top-1/2 left-1/2 w-[90vw] h-[90vw] md:w-[65vh] md:h-[65vh] lg:w-[70vh] lg:h-[70vh] object-contain pointer-events-none"
          style={{
            transform: 'translate(-50%, -50%)',
            willChange: 'transform',
          }}
        />

        {/* Phase overlay cards */}
        {PHASES.map((phase, i) => {
          const isActive = activePhases[i];
          const isRight = phase.side === 'right';

          return (
            <div
              key={i}
              className={`absolute z-10 max-w-[280px] md:max-w-[320px] transition-all duration-700 ease-out ${
                isRight
                  ? 'right-6 md:right-12 lg:right-20'
                  : 'left-6 md:left-12 lg:left-20'
              } ${
                isRight ? 'text-right items-end' : 'text-left items-start'
              } bottom-16 md:bottom-auto md:top-1/2 md:-translate-y-1/2 flex flex-col ${
                isActive
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              {/* Glassmorphic card */}
              <div className="bg-[#0e1b16]/[0.04] backdrop-blur-xl border border-tj-gold/[0.12] p-6 md:p-8">
                <span className="text-tj-gold text-[9px] uppercase tracking-[0.4em] block mb-3">
                  {phase.label}
                </span>
                <h3 className="font-serif text-xl md:text-2xl lg:text-3xl text-[#0e1b16] leading-tight mb-3">
                  {phase.heading}
                </h3>
                <p className="text-[#0e1b16]/50 text-sm leading-relaxed font-sans">
                  {phase.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScrollAnimation;
