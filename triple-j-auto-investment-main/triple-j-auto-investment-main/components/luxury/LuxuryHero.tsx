import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedText } from './AnimatedText';
import { MagneticButton } from './MagneticButton';

gsap.registerPlugin(ScrollTrigger);

interface LuxuryHeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  videoUrl?: string;
  showVideo?: boolean;
}

export const LuxuryHero: React.FC<LuxuryHeroProps> = ({
  title = 'TRIPLE J AUTO',
  subtitle = 'Your Trusted Houston Dealer',
  ctaText = 'Explore Collection',
  ctaLink = '/inventory',
  videoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-luxury-car-parked-at-night-4926-large.mp4',
  showVideo = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  useEffect(() => {
    // Initial animation timeline
    const tl = gsap.timeline({ delay: 0.5 });

    tl.fromTo(
      '.hero-title-line',
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: 'power3.out' }
    )
      .fromTo(
        '.hero-subtitle',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
      )
      .fromTo(
        '.hero-cta',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.4'
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black"
    >
      {/* Video Background */}
      {showVideo && (
        <motion.div
          className="absolute inset-0 z-0"
          style={{ scale }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-1000 ${
              isVideoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoadedData={() => setIsVideoLoaded(true)}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
        </motion.div>
      )}

      {/* Fallback/Additional background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2830&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.3)',
          opacity: isVideoLoaded ? 0 : 1,
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center h-full px-6"
        style={{ y, opacity }}
      >
        {/* Decorative line */}
        <div className="hero-subtitle mb-8 flex items-center gap-4 opacity-0">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#D4AF37] font-montserrat">
            Est. 2025
          </span>
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
        </div>

        {/* Main Title */}
        <h1 className="text-center overflow-hidden">
          <div className="hero-title-line overflow-hidden">
            <span className="block text-[12vw] md:text-[10vw] lg:text-[8vw] font-display text-white leading-none tracking-tight">
              <AnimatedText text={title} type="chars" stagger={0.05} delay={0.3} />
            </span>
          </div>
          <div className="hero-title-line overflow-hidden mt-2">
            <span className="block text-[8vw] md:text-[6vw] lg:text-[4vw] font-italiana text-[#D4AF37] italic leading-none">
              <AnimatedText text={subtitle} type="chars" stagger={0.03} delay={0.8} />
            </span>
          </div>
        </h1>

        {/* Description */}
        <motion.p
          className="hero-subtitle max-w-xl text-center mt-8 text-sm md:text-base text-white/60 font-light leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          Reliable pre-owned vehicles for Houston families.
          <br className="hidden md:block" />
          Honest pricing, transparent deals, and a team that cares.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="hero-cta flex flex-col sm:flex-row items-center gap-6 mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <MagneticButton href={ctaLink}>
            {ctaText}
            <ArrowRight size={16} className="ml-2" />
          </MagneticButton>

          <Link
            to="/about"
            className="group flex items-center gap-3 text-white/80 hover:text-white transition-colors"
          >
            <span className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#D4AF37] transition-colors">
              <Play size={14} className="ml-1" />
            </span>
            <span className="text-xs uppercase tracking-[0.2em]">Watch Film</span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-montserrat">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} className="text-[#D4AF37]" />
        </motion.div>
      </motion.div>

      {/* Side decorative elements */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col items-center gap-6">
        <div className="w-px h-20 bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent" />
        <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 writing-vertical">
          Triple J
        </span>
        <div className="w-px h-20 bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent" />
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col items-center gap-6">
        <div className="w-px h-20 bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent" />
        <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 writing-vertical">
          Houston, TX
        </span>
        <div className="w-px h-20 bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent" />
      </div>

      {/* Corner accents */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-[#D4AF37]/30 z-20" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r border-t border-[#D4AF37]/30 z-20" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l border-b border-[#D4AF37]/30 z-20" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-[#D4AF37]/30 z-20" />
    </section>
  );
};

export default LuxuryHero;
