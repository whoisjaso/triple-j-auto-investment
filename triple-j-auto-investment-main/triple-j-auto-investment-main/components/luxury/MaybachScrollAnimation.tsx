import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { CrestLoader } from '../CrestLoader';

const TOTAL_FRAMES = 151; // Matched to ffmpeg output count
const BATCH_SIZE = 20;

export const MaybachScrollAnimation = () => {
  const { t } = useLanguage();
  const m = t.home.luxury.maybach;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoOverlayRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [progressText, setProgressText] = useState('0');
  const [phase, setPhase] = useState(-1);

  useEffect(() => {
    let currentFrame = 0;
    let drawnFrame = -1;
    let animationFrameId: number;
    let images: HTMLImageElement[] = [];

    const loadFrames = async () => {
      images = new Array(TOTAL_FRAMES);
      for (let i = 0; i < TOTAL_FRAMES; i += BATCH_SIZE) {
        const batch = [];
        for (let j = i; j < Math.min(i + BATCH_SIZE, TOTAL_FRAMES); j++) {
          batch.push(
            new Promise<void>((resolve) => {
              const img = new Image();
              const frameNum = (j + 1).toString().padStart(4, '0');
              img.src = `/maybach-frames/frame-${frameNum}.jpg`;
              img.onload = () => { images[j] = img; resolve(); };
              img.onerror = () => { resolve(); };
            })
          );
        }
        await Promise.all(batch);
        setProgressText(Math.min(100, Math.floor(((i + BATCH_SIZE) / TOTAL_FRAMES) * 100)).toString());
      }
      setLoaded(true);
    };

    loadFrames();

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;

      // Calculate progress from 0 to 1 based on sticky container
      let rawProgress = -rect.top / scrollDistance;
      rawProgress = Math.max(0, Math.min(1, rawProgress));

      currentFrame = Math.floor(rawProgress * (TOTAL_FRAMES - 1));

      // Determine phase for text overlays based on precise scroll ranges
      if (rawProgress >= 0.05 && rawProgress < 0.35) setPhase(1);
      else if (rawProgress >= 0.40 && rawProgress < 0.70) setPhase(2);
      else if (rawProgress >= 0.75 && rawProgress <= 1.0) setPhase(3);
      else setPhase(-1);

      // Subtly scale the canvas for a push-in cinematic effect
      if (canvasRef.current) {
        const scale = 1 + rawProgress * 0.05; // scales from 1.0 to 1.05
        canvasRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
      }

      // Fade logo out as scroll begins — fully gone by 8% progress
      if (logoOverlayRef.current) {
        const logoOpacity = Math.max(0, 1 - rawProgress / 0.08);
        const logoScale = 1 - rawProgress * 0.3;
        logoOverlayRef.current.style.opacity = String(logoOpacity);
        logoOverlayRef.current.style.transform = `translate(-50%, -50%) scale(${Math.max(0.7, logoScale)})`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const tick = () => {
      if (currentFrame !== drawnFrame && canvasRef.current) {
        const img = images[currentFrame];
        if (img) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            const canvas = canvasRef.current;
            if (canvas.width !== img.width || canvas.height !== img.height) {
              canvas.width = img.width;
              canvas.height = img.height;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            drawnFrame = currentFrame;
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-[250vh] bg-[#F7F7F7]">
      {!loaded && (
        <CrestLoader mode="sticky" progress={parseInt(progressText)} />
      )}

      <div className={`sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center transition-opacity duration-[1500ms] ${loaded ? 'opacity-100' : 'opacity-0'}`}>

        {/* Edge-feather vignette — dissolves canvas edges into page bg */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background: 'radial-gradient(ellipse 80% 75% at center, transparent 50%, #F7F7F7 100%)',
          }}
        />

        {/* Hero Logo — centered above car, fades out on scroll */}
        <div
          ref={logoOverlayRef}
          className="absolute top-[18%] md:top-[20%] left-1/2 z-20 flex flex-col items-center pointer-events-none"
          style={{ transform: 'translate(-50%, -50%) scale(1)' }}
        >
          <img
            src="/GoldTripleJLogo.png"
            alt="Triple J Auto Investment"
            className="w-20 md:w-28 lg:w-32 object-contain mb-5"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(212,175,55,0.15)) drop-shadow(0 0 60px rgba(212,175,55,0.06))'
            }}
          />
          <span className="text-[8px] md:text-[9px] uppercase tracking-[0.5em] text-[#0e1b16]/40 font-sans">
            {m.logoCaption}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          className="absolute top-1/2 left-1/2 w-[95vw] h-[65vh] md:h-[85vh] md:w-[70vw] lg:w-[65vw] object-contain pointer-events-none"
          style={{
            transform: 'translate(-50%, -50%) scale(1)',
            willChange: 'transform',
            mixBlendMode: 'multiply',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 95%)',
            maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 95%)',
          }}
        />

        {/* Phase 1: Left side */}
        <div className={`absolute bottom-16 left-4 right-4 md:bottom-auto md:right-auto md:top-1/2 md:-translate-y-1/2 md:left-12 lg:left-20 max-w-full md:max-w-[280px] lg:max-w-[320px] flex flex-col items-center md:items-start text-center md:text-left transition-all duration-1000 ease-out ${phase === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 md:-translate-x-8 pointer-events-none'}`}>
           <span className="uppercase tracking-[0.3em] text-[9px] text-tj-gold mb-3 md:mb-4">{m.phase1Label}</span>
           <h3 className="font-serif text-xl md:text-4xl lg:text-5xl text-tj-green leading-[1.1] font-light">
              {m.phase1Text}<br />{m.phase1Text2}
           </h3>
        </div>

        {/* Phase 2: Right side */}
        <div className={`absolute bottom-16 left-4 right-4 md:bottom-auto md:left-auto md:top-1/2 md:-translate-y-1/2 md:right-12 lg:right-20 max-w-full md:max-w-[280px] lg:max-w-[320px] flex flex-col items-center md:items-end text-center md:text-right transition-all duration-1000 ease-out ${phase === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 md:translate-x-8 pointer-events-none'}`}>
           <span className="uppercase tracking-[0.3em] text-[9px] text-tj-gold mb-3 md:mb-4">{m.phase2Label}</span>
           <h3 className="font-serif text-xl md:text-4xl lg:text-5xl text-tj-green leading-[1.1] font-light">
              {m.phase2Text}<br />{m.phase2Text2}
           </h3>
        </div>

        {/* Phase 3: Bottom center on mobile, left side on desktop */}
        <div className={`absolute bottom-12 left-4 right-4 md:left-12 lg:left-20 md:right-auto max-w-full md:max-w-[320px] lg:max-w-[360px] flex flex-col items-center md:items-start text-center md:text-left transition-all duration-1000 ease-out ${phase === 3 ? 'opacity-100 translate-y-0 md:translate-x-0' : 'opacity-0 translate-y-4 md:translate-y-0 md:-translate-x-8 pointer-events-none'}`}>
           <span className="uppercase tracking-[0.3em] text-[9px] text-tj-gold mb-3 md:mb-4">{m.phase3Label}</span>
           <h3 className="font-serif text-xl md:text-4xl lg:text-5xl text-tj-green leading-[1.1] font-light italic mb-6 md:mb-8">
              {m.phase3Text}<br />{m.phase3Text2}
           </h3>
           <div className={`transition-opacity duration-1000 delay-300 ${phase === 3 ? 'opacity-100' : 'opacity-0'}`}>
               <Link to="/inventory" className="border-b border-tj-gold/30 hover:border-tj-gold pb-2 text-[10px] uppercase tracking-[0.3em] text-tj-green transition-colors flex items-center gap-4 group">
                    {m.phase3Cta} <span className="group-hover:translate-x-2 transition-transform duration-500">→</span>
               </Link>
           </div>
        </div>

      </div>
    </div>
  );
};