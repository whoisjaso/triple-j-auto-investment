import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { ArrowRight, Diamond, Heart, Zap, Fingerprint, Target, Activity, Star, ChevronDown, Phone, Key, Users } from 'lucide-react';
import { motion, useTransform, useSpring, useInView } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';
import { ScrollReveal, AnimatedText, MagneticButton } from '../components/luxury';

// --- COUNT-UP METRIC COMPONENT ---

const CountUpNumber = ({ value, suffix = '', label, icon }: { value: number; suffix?: string; label: string; icon?: React.ReactNode }) => {
   const ref = useRef<HTMLDivElement>(null);
   const isInView = useInView(ref, { once: true, margin: "-100px" });
   const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
   const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

   useEffect(() => {
      if (isInView) {
         spring.set(value);
      }
   }, [isInView, spring, value]);

   return (
      <div ref={ref} className="text-center">
         {icon && <div className="flex justify-center mb-3 text-tj-gold/60">{icon}</div>}
         <div className="text-3xl md:text-5xl font-display text-tj-gold mb-2 tabular-nums">
            <motion.span>{display}</motion.span>
            {suffix && <span className="text-tj-gold/70">{suffix}</span>}
         </div>
         <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-gray-400">{label}</p>
      </div>
   );
};

// --- HERO SVG PATHS ---

const heroSvgPaths = [
   { d: "M -100 120 Q 200 40 450 180 T 1100 100", duration: 6, strokeWidth: 1.2, maxOpacity: 0.5 },
   { d: "M -50 250 C 150 150 350 300 550 200 S 850 100 1100 280", duration: 7, strokeWidth: 0.8, maxOpacity: 0.6 },
   { d: "M -80 380 Q 300 280 600 400 T 1100 350", duration: 5.5, strokeWidth: 1.5, maxOpacity: 0.45 },
   { d: "M -120 480 C 200 400 400 550 650 430 S 900 350 1100 500", duration: 7.5, strokeWidth: 0.6, maxOpacity: 0.55 },
   { d: "M -60 560 Q 250 480 500 580 T 1100 520", duration: 6.5, strokeWidth: 1, maxOpacity: 0.5 },
   { d: "M -100 180 C 300 80 500 250 700 150 S 950 200 1100 160", duration: 8, strokeWidth: 0.7, maxOpacity: 0.4 },
   { d: "M -70 640 Q 350 560 650 650 T 1100 600", duration: 5, strokeWidth: 1.3, maxOpacity: 0.5 },
   { d: "M -90 320 C 200 220 450 380 700 300 S 1000 250 1100 340", duration: 6.8, strokeWidth: 0.9, maxOpacity: 0.55 },
];

const heroSvgCircles = [
   { cx: 200, cyStart: 150, cyEnd: 120, r: 1.5, duration: 10, maxOpacity: 0.25 },
   { cx: 600, cyStart: 400, cyEnd: 370, r: 2, duration: 12, maxOpacity: 0.2 },
   { cx: 850, cyStart: 250, cyEnd: 220, r: 1, duration: 8, maxOpacity: 0.3 },
];

const Home = () => {
   const { vehicles } = useStore();
   const { t } = useLanguage();
   // Get Top 3 Available Vehicles for Featured section
   const featuredVehicles = vehicles
      .filter(v => v.status === 'Available')
      .sort((a, b) => b.price - a.price)
      .slice(0, 3);

   const hasVehicles = featuredVehicles.length > 0;

   // TODO(business-data): Authority metrics -- update with real business data
   // These are conservative placeholder estimates; replace with actual figures when available
   // Search for "TODO(business-data)" to find all placeholder values
   const metrics = [
      { value: 500, suffix: '+', label: t.home.authority.familiesServed, icon: <Users size={20} /> },
      { value: 150, suffix: '+', label: t.home.authority.fiveStarReviews },
      { value: 3, suffix: '+', label: t.home.authority.yearsInBusiness },
      { value: 800, suffix: '+', label: t.home.authority.vehiclesDelivered },
   ];

   const containerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
   };

   const itemVariants = {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 50 } }
   };

   return (
      <>
         <SEO
            title="Triple J Auto Investment | Used Cars Houston | Sales & Rentals"
            description="Affordable pre-owned vehicles for Houston families. Cars, trucks, and SUVs from $3,000-$8,000. Vehicle rentals available. Se habla espanol. 8774 Almeda Genoa Rd. (832) 400-9760."
            path="/"
         />
         <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-black overflow-hidden font-sans selection:bg-tj-gold selection:text-black"
         >

            {/* --- PREMIUM SHOWROOM HERO --- */}
            <div className="relative min-h-screen flex flex-col justify-center overflow-hidden">

               {/* Background: Hero image with Ken Burns */}
               <div className="absolute inset-0 z-0">
                  <div
                     className="absolute inset-0 animate-ken-burns will-change-transform"
                     style={{
                        backgroundImage: `url(${featuredVehicles[0]?.imageUrl || '/GoldTripleJLogo.png'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                     }}
                  />
                  {/* Green gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-tj-green/95 via-tj-green/80 to-tj-greenDeep/95" />
                  <div className="absolute inset-0 bg-gradient-to-r from-tj-green/60 to-transparent" />
                  {/* Gold dust radial */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)]" />
               </div>

               {/* Gold corner accents */}
               <div className="absolute top-24 left-6 md:left-12 w-16 h-16 border-t-2 border-l-2 border-tj-gold/40 z-10" />
               <div className="absolute bottom-12 right-6 md:right-12 w-16 h-16 border-b-2 border-r-2 border-tj-gold/40 z-10" />

               {/* Meta badges — top */}
               <div className="absolute top-32 left-6 md:left-12 right-6 md:right-12 flex justify-between items-start z-10">
                  <motion.div
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.8, delay: 0.2 }}
                     className="flex items-center gap-3"
                  >
                     <span className="w-1.5 h-1.5 bg-tj-gold" />
                     <span className="text-tj-gold text-[9px] uppercase tracking-ultra font-bold">
                        {t.home.seHabla}
                     </span>
                  </motion.div>
                  <motion.span
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.8, delay: 0.4 }}
                     className="text-gray-500 text-[10px] uppercase tracking-ultra font-mono"
                  >
                     EST. 2021 // HOUSTON, TX
                  </motion.span>
               </div>

               {/* Center content */}
               <div className="relative z-10 px-6 md:px-12 max-w-[1920px] mx-auto w-full">
                  <div className="max-w-4xl">
                     {/* Animated heading */}
                     <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white leading-[0.85] uppercase mb-8">
                        <AnimatedText
                           text="TRIPLE J"
                           type="chars"
                           animation="fadeUp"
                           delay={0.5}
                           stagger={0.03}
                           className="block"
                        />
                        <span className="block mt-2 text-[0.5em] tracking-[0.3em] text-tj-gold/80">
                           <AnimatedText
                              text="AUTO INVESTMENT"
                              type="chars"
                              animation="fadeUp"
                              delay={0.9}
                              stagger={0.02}
                           />
                        </span>
                     </h1>

                     {/* Tagline */}
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 1.4 }}
                        className="flex items-start gap-6 mb-12 max-w-2xl"
                     >
                        <div className="w-12 h-px bg-tj-gold/60 mt-3 hidden md:block flex-shrink-0" />
                        <p className="font-serif italic text-base md:text-xl text-gray-300 leading-relaxed">
                           {t.home.hero.tagline}
                        </p>
                     </motion.div>

                     {/* CTAs */}
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.8 }}
                        className="flex flex-col sm:flex-row gap-4"
                     >
                        <MagneticButton
                           href="/contact"
                           className="px-10 py-5 text-[11px]"
                        >
                           {t.home.hero.scheduleVisit}
                        </MagneticButton>
                        <MagneticButton
                           href="tel:+18324009760"
                           className="px-10 py-5 text-[11px]"
                           strength={0.3}
                        >
                           <Phone size={12} />
                           {t.home.hero.callNow}
                        </MagneticButton>
                     </motion.div>
                  </div>
               </div>

               {/* Scroll indicator */}
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5, duration: 1 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
               >
                  <span className="text-[8px] uppercase tracking-ultra text-gray-500">Scroll</span>
                  <motion.div
                     animate={{ y: [0, 8, 0] }}
                     transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                     <ChevronDown size={16} className="text-tj-gold/60" />
                  </motion.div>
               </motion.div>
            </div>


            {/* --- AUTHORITY METRICS --- */}
            <section className="relative py-20 md:py-28 bg-tj-greenDeep border-b border-white/10 overflow-hidden">
               {/* Gold radial glow */}
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_60%)]" />

               <div className="relative max-w-5xl mx-auto px-4 md:px-6">
                  <ScrollReveal direction="up" distance={30}>
                     <p className="text-center text-[10px] uppercase tracking-[0.4em] text-tj-gold/60 mb-16 font-display">
                        {t.home.authority.title}
                     </p>
                  </ScrollReveal>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                     {metrics.map((metric, i) => (
                        <ScrollReveal key={i} direction="up" delay={i * 0.1} distance={40}>
                           <CountUpNumber
                              value={metric.value}
                              suffix={metric.suffix}
                              label={metric.label}
                              icon={metric.icon}
                           />
                        </ScrollReveal>
                     ))}
                  </div>
               </div>
            </section>

            {/* --- TICKER (Infinite Marquee) --- */}
            <div className="bg-tj-gold text-black py-3 border-y border-black overflow-hidden relative z-20 select-none">
               <div className="animate-marquee whitespace-nowrap flex items-center font-display font-black tracking-[0.2em] text-xs md:text-sm will-change-transform">
                  {Array(3).fill(null).map((_, i) => (
                     <React.Fragment key={i}>
                        {t.home.ticker.map((text, idx) => (
                           <React.Fragment key={idx}>
                              <span className="mx-8">{text}</span> <Star size={12} />
                           </React.Fragment>
                        ))}
                     </React.Fragment>
                  ))}
               </div>
            </div>

            {/* --- FEATURED VEHICLES --- */}
            <section className="py-20 md:py-28 bg-tj-green relative overflow-hidden border-b border-white/10">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.05)_0%,transparent_60%)]" />

               <div className="max-w-[1920px] mx-auto px-4 md:px-6 relative">
                  <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                     <ScrollReveal direction="left">
                        <div>
                           <h2 className="text-3xl sm:text-4xl md:text-6xl font-display text-white mb-3 uppercase">
                              {t.home.arsenal.title.toUpperCase()}
                           </h2>
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-px bg-tj-gold/40" />
                              <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">{t.home.arsenal.desc}</p>
                           </div>
                        </div>
                     </ScrollReveal>
                     <ScrollReveal direction="right" className="hidden md:block">
                        <Link to="/inventory" className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-tj-gold hover:text-white transition-colors group">
                           {t.home.arsenal.viewAll}
                           <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                     </ScrollReveal>
                  </div>

                  {hasVehicles ? (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {featuredVehicles.map((vehicle, idx) => (
                           <ScrollReveal key={vehicle.id} direction="up" delay={idx * 0.15} distance={50}>
                              <Link
                                 to="/inventory"
                                 className="group relative aspect-[3/4] md:aspect-[4/5] overflow-hidden border border-white/10 hover:border-tj-gold/30 bg-gray-900 cursor-pointer block transition-all duration-700 hover:shadow-[0_0_50px_rgba(212,175,55,0.12)] hover:-translate-y-1"
                              >
                                 <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 border border-green-500/30">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[8px] uppercase tracking-widest text-green-400 font-bold">{t.common.available}</span>
                                 </div>

                                 <div className="absolute top-4 right-4 z-20">
                                    <span className="text-lg font-display text-white drop-shadow-lg tracking-wider bg-black/40 backdrop-blur-md px-3 py-1.5 border border-white/10">
                                       ${vehicle.price.toLocaleString()}
                                    </span>
                                 </div>

                                 {vehicle.status === 'Available' && (
                                    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-tj-gold/90 backdrop-blur px-2.5 py-1 border border-tj-gold">
                                       <Key size={10} className="text-black" />
                                       <span className="text-[8px] uppercase tracking-widest text-black font-bold">
                                          {vehicle.dailyRate ? `$${vehicle.dailyRate}${t.common.perDay}` : t.common.saleAndRental}
                                       </span>
                                    </div>
                                 )}

                                 <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />

                                 <motion.img
                                    src={vehicle.imageUrl}
                                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.7 }}
                                 />

                                 {/* Gold accent line bottom */}
                                 <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tj-gold/40 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                 <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <p className="text-tj-gold text-[10px] uppercase tracking-[0.2em] mb-1">{vehicle.year} {vehicle.make}</p>
                                    <h3 className="text-2xl font-display text-white leading-none mb-4">{vehicle.model}</h3>
                                    <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                                       <span>{t.common.viewAll}</span>
                                       <div className="w-8 h-px bg-current" />
                                    </div>
                                 </div>
                              </Link>
                           </ScrollReveal>
                        ))}
                     </div>
                  ) : (
                     <div className="py-16 text-center border border-white/5 bg-white/[0.02]">
                        <p className="text-gray-400 text-sm mb-4">{t.polish.emptyInventory}</p>
                        <a href="tel:+18324009760" className="inline-flex items-center gap-2 text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors">
                           <Phone size={14} /> {t.common.phone}
                        </a>
                     </div>
                  )}

                  <div className="mt-12 text-center md:hidden">
                     <MagneticButton href="/inventory" className="px-10 py-5 text-[11px]">
                        {t.home.arsenal.viewAll}
                     </MagneticButton>
                  </div>
               </div>
            </section>

            {/* --- VALUE PILLARS (BRUTALIST STACK) --- */}
            <section className="bg-black w-full border-t border-white/10">
               <div className="flex flex-col">

                  {/* Pillar 01 */}
                  <motion.div
                     initial={{ opacity: 0 }}
                     whileInView={{ opacity: 1 }}
                     transition={{ duration: 0.8 }}
                     viewport={{ once: true, margin: "-100px" }}
                     className="w-full flex flex-col md:flex-row items-stretch border-b border-white/10"
                  >
                     <div className="md:w-1/3 p-12 md:p-24 border-b md:border-b-0 md:border-r border-white/10 flex items-center justify-center bg-tj-darker relative overflow-hidden">
                        <span className="font-display text-[150px] md:text-[200px] text-white/5 font-black tracking-tighter mix-blend-screen absolute -left-10 md:left-0 top-1/2 -translate-y-1/2">01</span>
                        <div className="relative z-10 text-tj-gold">
                           <Fingerprint size={48} className="opacity-80" />
                        </div>
                     </div>
                     <div className="md:w-2/3 p-12 md:p-24 flex flex-col justify-center items-start bg-[#020202]">
                        <h3 className="text-white font-display text-4xl sm:text-6xl tracking-tighter mb-8 uppercase">{t.home.pillars.p1Title}</h3>
                        <p className="text-gray-500 text-xs md:text-sm uppercase tracking-widest leading-loose max-w-xl">
                           {t.home.pillars.p1Desc} <br /><span className="text-white mt-8 block font-xl tracking-tight normal-case">{t.home.pillars.p1Highlight}</span>
                        </p>
                     </div>
                  </motion.div>

                  {/* Pillar 02 (Reversed Assembly) */}
                  <motion.div
                     initial={{ opacity: 0 }}
                     whileInView={{ opacity: 1 }}
                     transition={{ duration: 0.8 }}
                     viewport={{ once: true, margin: "-100px" }}
                     className="w-full flex flex-col md:flex-row-reverse items-stretch border-b border-white/10"
                  >
                     <div className="md:w-1/3 p-12 md:p-24 border-b md:border-b-0 md:border-l border-white/10 flex items-center justify-center bg-tj-darker relative overflow-hidden">
                        <span className="font-display text-[150px] md:text-[200px] text-white/5 font-black tracking-tighter mix-blend-screen absolute -right-10 md:right-0 top-1/2 -translate-y-1/2">02</span>
                        <div className="relative z-10 text-tj-gold">
                           <Zap size={48} className="opacity-80" />
                        </div>
                     </div>
                     <div className="md:w-2/3 p-12 md:p-24 flex flex-col justify-center items-end text-right bg-black">
                        <h3 className="text-white font-display text-4xl sm:text-6xl tracking-tighter mb-8 uppercase">{t.home.pillars.p2Title}</h3>
                        <p className="text-gray-500 text-xs md:text-sm uppercase tracking-widest leading-loose max-w-xl">
                           {t.home.pillars.p2Desc} <br /><span className="text-white mt-8 block font-xl tracking-tight normal-case">{t.home.pillars.p2Highlight}</span>
                        </p>
                     </div>
                  </motion.div>

                  {/* Pillar 03 */}
                  <motion.div
                     initial={{ opacity: 0 }}
                     whileInView={{ opacity: 1 }}
                     transition={{ duration: 0.8 }}
                     viewport={{ once: true, margin: "-100px" }}
                     className="w-full flex flex-col md:flex-row items-stretch border-b border-white/10"
                  >
                     <div className="md:w-1/3 p-12 md:p-24 border-b md:border-b-0 md:border-r border-white/10 flex items-center justify-center bg-tj-darker relative overflow-hidden">
                        <span className="font-display text-[150px] md:text-[200px] text-white/5 font-black tracking-tighter mix-blend-screen absolute -left-10 md:left-0 top-1/2 -translate-y-1/2">03</span>
                        <div className="relative z-10 text-tj-gold">
                           <Target size={48} className="opacity-80" />
                        </div>
                     </div>
                     <div className="md:w-2/3 p-12 md:p-24 flex flex-col justify-center items-start bg-[#020202]">
                        <h3 className="text-white font-display text-4xl sm:text-6xl tracking-tighter mb-8 uppercase">{t.home.pillars.p3Title}</h3>
                        <p className="text-gray-500 text-xs md:text-sm uppercase tracking-widest leading-loose max-w-xl">
                           {t.home.pillars.p3Desc} <br /><span className="text-white mt-8 block font-xl tracking-tight normal-case">{t.home.pillars.p3Highlight}</span>
                        </p>
                     </div>
                  </motion.div>

               </div>
            </section>

            {/* --- DEALERSHIP INFO TICKER --- */}
            <section className="bg-tj-dark border-y border-white/10 py-12 overflow-hidden relative">
               <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-tj-dark to-transparent z-10"></div>
               <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-tj-dark to-transparent z-10"></div>

               <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-900/50 rounded-full animate-pulse">
                     <Activity size={12} className="text-green-500" />
                     <span className="text-[9px] uppercase tracking-widest text-green-400">{t.home.signals.label}</span>
                  </div>
               </div>

               <div className="flex gap-8 animate-marquee whitespace-nowrap items-center">
                  {t.home.signals.items.map((item, i) => (
                     <div key={i} className="flex items-center gap-4 bg-black/40 border border-white/5 px-6 py-3 rounded">
                        <div className="w-1.5 h-1.5 bg-tj-gold rounded-full animate-ping"></div>
                        <span className="text-xs font-mono text-gray-300 tracking-wider uppercase">{item}</span>
                     </div>
                  ))}
                  {t.home.signals.items.map((item, i) => (
                     <div key={`dup-${i}`} className="flex items-center gap-4 bg-black/40 border border-white/5 px-6 py-3 rounded">
                        <div className="w-1.5 h-1.5 bg-tj-gold rounded-full animate-ping"></div>
                        <span className="text-xs font-mono text-gray-300 tracking-wider uppercase">{item}</span>
                     </div>
                  ))}
               </div>
            </section>

            {/* --- ARCHITECTURAL DIFFERENCES --- */}
            <section className="w-full border-b border-white/10 relative">
               <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
                  {/* Column 1 */}
                  <Link to="/vin" className="p-12 md:p-20 group relative overflow-hidden flex flex-col items-start bg-black hover:bg-tj-darker transition-colors duration-700">
                     <div className="mb-12 text-tj-gold relative z-10">
                        <Diamond size={24} />
                     </div>
                     <h3 className="font-display text-2xl text-white mb-6 tracking-widest relative z-10 uppercase">{t.home.cards.vetting.title}</h3>
                     <p className="text-gray-500 text-[10px] leading-relaxed mb-12 relative z-10 uppercase tracking-widest">
                        {t.home.cards.vetting.desc}
                     </p>
                     <span className="text-[10px] uppercase tracking-ultra text-white flex items-center gap-4 transition-all duration-700 mt-auto border-b border-transparent group-hover:border-tj-gold pb-1 w-max">
                        {t.home.cards.vetting.cta}
                     </span>
                  </Link>

                  {/* Column 2 */}
                  <Link to="/about" className="p-12 md:p-20 group relative overflow-hidden flex flex-col items-start bg-[#020202] hover:bg-tj-darker transition-colors duration-700">
                     <div className="mb-12 text-tj-gold relative z-10">
                        <Heart size={24} />
                     </div>
                     <h3 className="font-display text-2xl text-tj-gold mb-6 tracking-widest relative z-10 uppercase">{t.home.cards.psych.title}</h3>
                     <p className="text-gray-500 text-[10px] leading-relaxed mb-12 relative z-10 uppercase tracking-widest">
                        {t.home.cards.psych.desc}
                     </p>
                     <span className="text-[10px] uppercase tracking-ultra text-white flex items-center gap-4 transition-all duration-700 mt-auto border-b border-transparent group-hover:border-tj-gold pb-1 w-max">
                        {t.home.cards.psych.cta}
                     </span>
                  </Link>

                  {/* Column 3 */}
                  <div className="p-12 md:p-20 group relative overflow-hidden flex flex-col items-start bg-black hover:bg-tj-darker transition-colors duration-700">
                     <div className="mb-12 text-tj-gold relative z-10">
                        <Zap size={24} />
                     </div>
                     <h3 className="font-display text-2xl text-white mb-6 tracking-widest relative z-10 uppercase">{t.home.cards.velocity.title}</h3>
                     <p className="text-gray-500 text-[10px] leading-relaxed mb-12 relative z-10 uppercase tracking-widest">
                        {t.home.cards.velocity.desc}
                     </p>
                     <span className="text-[10px] uppercase tracking-ultra text-white flex items-center gap-4 transition-all duration-700 mt-auto border-b border-transparent group-hover:border-white pb-1 w-max opacity-50">
                        {t.home.cards.velocity.cta}
                     </span>
                  </div>
               </div>
            </section>

            {/* --- INVENTORY CTA --- */}
            <section className="h-[50vh] relative flex items-center overflow-hidden border-t border-white/10 group bg-black">
               <div className="max-w-[1920px] mx-auto w-full px-6 flex flex-col md:flex-row items-center justify-between z-10 relative">
                  <h2 className="text-5xl md:text-8xl font-display text-white tracking-tighter mix-blend-difference mb-8 md:mb-0">
                     {t.home.vault.title.toUpperCase()}
                  </h2>
                  <Link to="/inventory" className="brutal-outline px-12 py-8 bg-transparent text-white border-white/20 hover:bg-white hover:text-black">
                     {t.home.vault.enter}
                  </Link>
               </div>
               {/* Architectural overlay lines */}
               <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 pointer-events-none" />
               <div className="absolute top-0 left-1/2 w-px h-full bg-white/5 pointer-events-none" />
            </section>

         </motion.div >
      </>
   );
};

export default Home;
