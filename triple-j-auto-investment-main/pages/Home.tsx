import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/Store';
import { ArrowRight, Diamond, Heart, Zap, Fingerprint, Target, Activity, Star, ChevronDown, Phone, Key, Users } from 'lucide-react';
import { motion, useTransform, useSpring, useInView } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';

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
         <div className="text-3xl md:text-5xl font-display text-white mb-2 tabular-nums">
            <motion.span>{display}</motion.span>
            {suffix && <span className="text-tj-gold">{suffix}</span>}
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

         {/* --- HERO SECTION --- */}
         <div className="relative min-h-screen -mt-36 pt-36 flex flex-col justify-center items-center overflow-hidden">

            {/* Abstract SVG Animation Background */}
            <div className="absolute inset-0 pointer-events-none">
               <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 1000 700"
                  preserveAspectRatio="xMidYMid slice"
               >
                  <defs>
                     <linearGradient id="heroGoldPath" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(212,175,55,0)" />
                        <stop offset="50%" stopColor="rgba(212,175,55,0.3)" />
                        <stop offset="100%" stopColor="rgba(212,175,55,0)" />
                     </linearGradient>
                     <linearGradient id="heroGoldGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(212,175,55,0)" />
                        <stop offset="40%" stopColor="rgba(212,175,55,0.15)" />
                        <stop offset="60%" stopColor="rgba(212,175,55,0.15)" />
                        <stop offset="100%" stopColor="rgba(212,175,55,0)" />
                     </linearGradient>
                  </defs>

                  {/* Animated flowing paths */}
                  {heroSvgPaths.map((path, i) => (
                     <motion.path
                        key={`path-${i}`}
                        d={path.d}
                        stroke="url(#heroGoldPath)"
                        strokeWidth={path.strokeWidth}
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                           pathLength: [0, 1, 0],
                           opacity: [0, path.maxOpacity, 0],
                        }}
                        transition={{
                           duration: path.duration,
                           repeat: Infinity,
                           ease: "easeInOut",
                           delay: i * 0.4,
                        }}
                     />
                  ))}

                  {/* Floating particle circles */}
                  {heroSvgCircles.map((circle, i) => (
                     <motion.circle
                        key={`circle-${i}`}
                        cx={circle.cx}
                        r={circle.r}
                        fill="rgba(212,175,55,0.4)"
                        initial={{ cy: circle.cyStart, opacity: 0 }}
                        animate={{
                           cy: [circle.cyStart, circle.cyEnd, circle.cyStart],
                           opacity: [0, circle.maxOpacity, 0],
                        }}
                        transition={{
                           duration: circle.duration,
                           repeat: Infinity,
                           ease: "easeInOut",
                           delay: i * 1.5,
                        }}
                     />
                  ))}
               </svg>

               {/* Subtle radial gradient overlay */}
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_70%,rgba(0,0,0,0.8)_100%)]" />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">

               {/* Se Habla Espanol Badge */}
               <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="inline-flex items-center gap-2 border border-tj-gold/30 rounded-full px-4 py-1.5 mb-8"
               >
                  <span className="w-1.5 h-1.5 rounded-full bg-tj-gold/60" />
                  <span className="text-tj-gold text-[10px] uppercase tracking-[0.3em] font-bold">
                     {t.home.seHabla}
                  </span>
               </motion.div>

               {/* Main Heading */}
               <motion.h1
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 50, damping: 20 }}
                  className="font-display text-4xl md:text-6xl lg:text-7xl text-white tracking-tight mb-4"
               >
                  {t.home.hero.heading}
               </motion.h1>

               {/* Subheading */}
               <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="text-tj-gold text-xs md:text-sm uppercase tracking-[0.3em] font-bold mb-6"
               >
                  {t.home.hero.subheading}
               </motion.p>

               {/* Tagline */}
               <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                  className="font-serif italic text-sm md:text-lg text-gray-400 max-w-xl mx-auto mb-10"
               >
                  {t.home.hero.tagline}
               </motion.p>

               {/* CTA Buttons */}
               <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                  className="flex flex-col sm:flex-row items-center gap-4"
               >
                  {/* Primary: Schedule a Visit */}
                  <Link
                     to="/contact"
                     className="bg-tj-gold text-black py-4 px-8 text-xs font-bold tracking-[0.3em] uppercase hover:bg-white transition-colors duration-300"
                  >
                     {t.home.hero.scheduleVisit}
                  </Link>

                  {/* Secondary: Call Now */}
                  <a
                     href="tel:+18324009760"
                     className="inline-flex items-center gap-3 bg-transparent border-2 border-white text-white py-4 px-8 text-xs font-bold tracking-[0.3em] uppercase hover:bg-tj-gold hover:border-tj-gold hover:text-black transition-all duration-300"
                  >
                     <Phone size={14} />
                     {t.home.hero.callNow}
                  </a>
               </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 2, duration: 1 }}
               className="absolute bottom-8 z-10 animate-bounce text-tj-gold/50 flex flex-col items-center gap-2 cursor-pointer"
               onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            >
               <span className="text-[9px] uppercase tracking-widest">{t.home.hero.scrollPrompt}</span>
               <ChevronDown size={20} />
            </motion.div>
         </div>

         {/* --- AUTHORITY METRICS --- */}
         <section className="relative py-16 md:py-24 bg-black border-b border-white/10 overflow-hidden">
            {/* Subtle gradient background accent */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.03)_0%,transparent_60%)]" />

            <div className="relative max-w-5xl mx-auto px-4 md:px-6">
               {/* Section title */}
               <p className="text-center text-[10px] uppercase tracking-[0.4em] text-tj-gold/60 mb-12 font-display">
                  {t.home.authority.title}
               </p>

               {/* Metrics grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                  {metrics.map((metric, i) => (
                     <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                     >
                        <CountUpNumber
                           value={metric.value}
                           suffix={metric.suffix}
                           label={metric.label}
                           icon={metric.icon}
                        />
                     </motion.div>
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
         <section className="py-16 md:py-24 bg-[#050505] relative overflow-hidden border-b border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-tj-gold/5 via-transparent to-transparent"></div>

            <div className="max-w-[1920px] mx-auto px-4 md:px-6">
               <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                  <motion.div
                     initial={{ opacity: 0, x: -50 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true }}
                  >
                     <h2 className="text-3xl sm:text-4xl md:text-6xl font-display text-white mb-2 flex flex-wrap items-center gap-3 sm:gap-4">
                        {t.home.arsenal.title.toUpperCase()} <span className="text-xs font-mono text-tj-gold bg-tj-gold/10 px-2 py-1 rounded border border-tj-gold/20 align-middle tracking-widest uppercase">{t.home.arsenal.subtitle}</span>
                     </h2>
                     <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">{t.home.arsenal.desc}</p>
                  </motion.div>
                  <Link to="/inventory" className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-widest text-tj-gold hover:text-white transition-colors">
                     {t.home.arsenal.viewAll} <ArrowRight size={12} />
                  </Link>
               </div>

               {hasVehicles ? (
                  <motion.div
                     variants={containerVariants}
                     initial="hidden"
                     whileInView="visible"
                     viewport={{ once: true, margin: "-100px" }}
                     className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                     {featuredVehicles.map((vehicle, idx) => (
                        <motion.div variants={itemVariants} key={vehicle.id}>
                           <Link to="/inventory" className="group relative aspect-[3/4] md:aspect-[4/5] overflow-hidden border border-white/10 bg-gray-900 cursor-pointer block">
                              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-green-500/30">
                                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                 <span className="text-[8px] uppercase tracking-widest text-green-500 font-bold">{t.common.available}</span>
                              </div>

                              <div className="absolute top-4 right-4 z-20">
                                 <span className="text-lg font-display text-white drop-shadow-md tracking-wider">
                                    ${vehicle.price.toLocaleString()}
                                 </span>
                              </div>

                              {/* Rental Badge — shown on all available vehicles */}
                              {vehicle.status === 'Available' && (
                                 <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-tj-gold/90 backdrop-blur px-2.5 py-1 border border-tj-gold">
                                    <Key size={10} className="text-black" />
                                    <span className="text-[8px] uppercase tracking-widest text-black font-bold">
                                       {vehicle.dailyRate ? `$${vehicle.dailyRate}${t.common.perDay}` : t.common.saleAndRental}
                                    </span>
                                 </div>
                              )}

                              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>

                              <motion.img
                                 src={vehicle.imageUrl}
                                 alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                 loading="lazy"
                                 className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0"
                                 whileHover={{ scale: 1.1 }}
                                 transition={{ duration: 0.7 }}
                              />

                              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                 <p className="text-tj-gold text-[10px] uppercase tracking-[0.2em] mb-1">{vehicle.year} {vehicle.make}</p>
                                 <h3 className="text-2xl font-display text-white leading-none mb-4">{vehicle.model}</h3>
                                 <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                                    <span>{t.common.viewAll}</span>
                                    <div className="w-8 h-px bg-current"></div>
                                 </div>
                              </div>
                           </Link>
                        </motion.div>
                     ))}
                  </motion.div>
               ) : (
                  <div className="py-16 text-center border border-white/5 bg-white/[0.02]">
                     <p className="text-gray-400 text-sm mb-4">{t.polish.emptyInventory}</p>
                     <a
                        href="tel:+18324009760"
                        className="inline-flex items-center gap-2 text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors"
                     >
                        <Phone size={14} /> {t.common.phone}
                     </a>
                  </div>
               )}

               <div className="mt-8 text-center md:hidden">
                  <Link to="/inventory" className="inline-block border border-tj-gold text-tj-gold px-8 py-4 text-xs uppercase tracking-[0.3em] font-bold hover:bg-tj-gold hover:text-black transition-colors">
                     {t.home.arsenal.viewAll}
                  </Link>
               </div>
            </div>
         </section>

         {/* --- VALUE PILLARS --- */}
         <section className="py-16 md:py-24 px-4 md:px-6 max-w-[1920px] mx-auto bg-black">
            <div className="flex items-end justify-between mb-16 border-b border-white/10 pb-6">
               <h2 className="text-white font-display text-4xl md:text-5xl tracking-tighter">
                  {t.home.pillars.title.split(' ')[0]} <span className="text-tj-gold">{t.home.pillars.title.split(' ').slice(1).join(' ')}</span>
               </h2>
               <p className="hidden md:block text-gray-400 text-xs font-mono uppercase tracking-widest">
                  {t.home.pillars.subtitle}
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
               {/* Pillar 1 */}
               <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-tj-dark p-6 md:p-8 group hover:bg-white/5 transition-colors duration-500 relative overflow-hidden min-h-[300px] md:min-h-[350px] flex flex-col justify-between"
               >
                  <div>
                     <div className="text-tj-gold mb-6 group-hover:scale-110 transition-transform duration-500 origin-left">
                        <Fingerprint size={40} className="group-hover:animate-pulse" />
                     </div>
                     <h3 className="text-white font-display text-2xl sm:text-3xl tracking-wide mb-4">{t.home.pillars.p1Title}</h3>
                     <p className="text-gray-400 text-sm leading-relaxed font-light">
                        {t.home.pillars.p1Desc} <br /><span className="text-white">{t.home.pillars.p1Highlight}</span>
                     </p>
                  </div>
                  <div className="w-full h-px bg-white/10 group-hover:bg-tj-gold/50 transition-colors duration-500 flex items-center">
                     <div className="w-full h-full bg-tj-gold transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out"></div>
                  </div>
               </motion.div>

               {/* Pillar 2 */}
               <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-tj-dark p-6 md:p-8 group hover:bg-white/5 transition-colors duration-500 relative overflow-hidden min-h-[300px] md:min-h-[350px] flex flex-col justify-between"
               >
                  <div>
                     <div className="text-tj-gold mb-6 group-hover:scale-110 transition-transform duration-500 origin-left">
                        <Zap size={40} className="group-hover:text-white transition-colors" />
                     </div>
                     <h3 className="text-white font-display text-2xl sm:text-3xl tracking-wide mb-4">{t.home.pillars.p2Title}</h3>
                     <p className="text-gray-400 text-sm leading-relaxed font-light">
                        {t.home.pillars.p2Desc} <br /><span className="text-white">{t.home.pillars.p2Highlight}</span>
                     </p>
                  </div>
                  <div className="w-full h-px bg-white/10 group-hover:bg-tj-gold/50 transition-colors duration-500 flex items-center">
                     <div className="w-full h-full bg-tj-gold transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out delay-100"></div>
                  </div>
               </motion.div>

               {/* Pillar 3 */}
               <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-tj-dark p-6 md:p-8 group hover:bg-white/5 transition-colors duration-500 relative overflow-hidden min-h-[300px] md:min-h-[350px] flex flex-col justify-between"
               >
                  <div>
                     <div className="text-tj-gold mb-6 group-hover:scale-110 transition-transform duration-500 origin-left">
                        <Target size={40} className="group-hover:rotate-90 transition-transform duration-700" />
                     </div>
                     <h3 className="text-white font-display text-2xl sm:text-3xl tracking-wide mb-4">{t.home.pillars.p3Title}</h3>
                     <p className="text-gray-400 text-sm leading-relaxed font-light">
                        {t.home.pillars.p3Desc} <br /><span className="text-white">{t.home.pillars.p3Highlight}</span>
                     </p>
                  </div>
                  <div className="w-full h-px bg-white/10 group-hover:bg-tj-gold/50 transition-colors duration-500 flex items-center">
                     <div className="w-full h-full bg-tj-gold transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out delay-200"></div>
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

         {/* --- WHAT SETS US APART --- */}
         <section className="py-16 md:py-24 px-4 md:px-6 max-w-[1600px] mx-auto">
            <div className="text-center mb-16">
               <h2 className="font-display text-sm text-tj-gold tracking-[0.5em] uppercase mb-4">{t.home.architecture}</h2>
               <div className="w-px h-16 bg-gradient-to-b from-tj-gold to-transparent mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Card 1 */}
               <Link to="/vin" className="bg-tj-dark border border-white/5 p-6 md:p-8 group hover:border-tj-gold hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden shadow-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] hover:bg-gradient-to-b hover:from-tj-dark hover:to-tj-gold/5">
                  <div className="absolute -right-12 -top-12 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                     <Diamond size={150} />
                  </div>

                  <div className="mb-8 text-tj-gold transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_25px_rgba(212,175,55,0.8)] relative z-10">
                     <Diamond size={32} className="group-hover:animate-[spin_4s_linear_infinite]" />
                  </div>

                  <h3 className="font-display text-xl text-white mb-4 tracking-widest relative z-10 group-hover:text-tj-gold transition-colors">{t.home.cards.vetting.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-6 relative z-10 group-hover:text-gray-300 transition-colors">
                     {t.home.cards.vetting.desc}
                  </p>
                  <span className="text-[9px] uppercase tracking-widest text-tj-gold flex items-center gap-2 group-hover:gap-4 transition-all">
                     {t.home.cards.vetting.cta} <ArrowRight size={10} />
                  </span>
               </Link>

               {/* Card 2 (Featured) */}
               <Link to="/about" className="bg-gradient-to-br from-black to-tj-dark border border-tj-gold/30 p-6 md:p-8 group hover:border-tj-gold hover:-translate-y-3 hover:scale-[1.05] transition-all duration-500 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_60px_rgba(212,175,55,0.2)] z-10 scale-[1.02]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-tj-gold/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse"></div>

                  <div className="mb-8 text-tj-gold transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_30px_rgba(212,175,55,1)] relative z-10">
                     <Heart size={32} className="group-hover:animate-gold-pulse" />
                  </div>

                  <h3 className="font-display text-xl text-white mb-4 tracking-widest relative z-10 group-hover:text-tj-gold transition-colors">{t.home.cards.psych.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-6 relative z-10 group-hover:text-white transition-colors">
                     {t.home.cards.psych.desc}
                  </p>
                  <span className="text-[9px] uppercase tracking-widest text-white border-b border-tj-gold pb-0.5 group-hover:text-tj-gold group-hover:border-white transition-colors">
                     {t.home.cards.psych.cta}
                  </span>
               </Link>

               {/* Card 3 */}
               <div className="bg-tj-dark border border-white/5 p-6 md:p-8 group hover:border-tj-gold hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden shadow-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] hover:bg-gradient-to-b hover:from-tj-dark hover:to-tj-gold/5">
                  <div className="absolute -right-12 -top-12 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                     <Zap size={150} />
                  </div>

                  <div className="mb-8 text-tj-gold transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_25px_rgba(212,175,55,0.8)] relative z-10">
                     <Zap size={32} className="group-hover:animate-gold-pulse" />
                  </div>

                  <h3 className="font-display text-xl text-white mb-4 tracking-widest relative z-10 group-hover:text-tj-gold transition-colors">{t.home.cards.velocity.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-6 relative z-10 group-hover:text-gray-300 transition-colors">
                     {t.home.cards.velocity.desc}
                  </p>
                  <span className="text-[9px] uppercase tracking-widest text-gray-400 flex items-center gap-2 group-hover:text-white transition-colors">
                     {t.home.cards.velocity.cta} <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                  </span>
               </div>
            </div>
         </section>

         {/* --- INVENTORY CTA --- */}
         <section className="h-[70vh] relative flex items-center justify-center overflow-hidden border-t border-white/10 group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale brightness-50 group-hover:brightness-75 group-hover:grayscale-0 transition-all duration-[1.5s] ease-out transform group-hover:scale-105"></div>
            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/30 transition-colors duration-700"></div>

            <div className="relative z-10 text-center px-6">
               <div className="mb-6 inline-block overflow-hidden">
                  <span className="block text-tj-gold text-xs font-mono uppercase tracking-[0.5em] translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                     {t.home.vault.access}
                  </span>
               </div>

               <h2 className="text-5xl sm:text-6xl md:text-9xl font-display text-white mb-10 tracking-tighter mix-blend-overlay group-hover:mix-blend-normal transition-all duration-700">
                  {t.home.vault.title}
               </h2>

               <Link to="/inventory" className="inline-flex flex-col items-center gap-2 text-white hover:text-tj-gold transition-colors duration-300">
                  <div className="w-20 h-20 border border-white/30 rounded-full flex items-center justify-center group-hover:border-tj-gold group-hover:scale-110 transition-all duration-500 bg-black/20 backdrop-blur-sm">
                     <ArrowRight size={32} className="group-hover:-rotate-45 transition-transform duration-500" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">{t.home.vault.enter}</span>
               </Link>
            </div>
         </section>

      </motion.div>
      </>
   );
};

export default Home;
