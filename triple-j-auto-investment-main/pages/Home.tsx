import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/Store';
import { ArrowRight, ChevronDown, Phone, Key, Star, Users } from 'lucide-react';
import { motion, useTransform, useSpring, useInView } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';
import { ScrollReveal, AnimatedText, MagneticButton } from '../components/luxury';

// --- COUNT-UP METRIC ---
const CountUpNumber = ({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) => {
   const ref = useRef<HTMLDivElement>(null);
   const isInView = useInView(ref, { once: true, margin: "-100px" });
   const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
   const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

   useEffect(() => {
      if (isInView) spring.set(value);
   }, [isInView, spring, value]);

   return (
      <div ref={ref} className="text-center">
         <div className="text-4xl md:text-6xl font-display text-tj-gold mb-3 tabular-nums">
            <motion.span>{display}</motion.span>
            {suffix && <span className="text-tj-gold/60">{suffix}</span>}
         </div>
         <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-gray-500">{label}</p>
      </div>
   );
};

const Home = () => {
   const { vehicles } = useStore();
   const { t } = useLanguage();
   const featuredVehicles = vehicles
      .filter(v => v.status === 'Available')
      .sort((a, b) => b.price - a.price)
      .slice(0, 3);

   const hasVehicles = featuredVehicles.length > 0;

   const metrics = [
      { value: 500, suffix: '+', label: t.home.authority.familiesServed },
      { value: 150, suffix: '+', label: t.home.authority.fiveStarReviews },
      { value: 3, suffix: '+', label: t.home.authority.yearsInBusiness },
      { value: 800, suffix: '+', label: t.home.authority.vehiclesDelivered },
   ];

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
            className="bg-tj-green overflow-hidden font-sans selection:bg-tj-gold selection:text-black"
         >

            {/* ===== HERO ===== */}
            <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
               {/* Background: Ken Burns vehicle image */}
               <div className="absolute inset-0">
                  <div
                     className="absolute inset-0 animate-ken-burns will-change-transform"
                     style={{
                        backgroundImage: `url(${featuredVehicles[0]?.imageUrl || '/GoldTripleJLogo.png'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                     }}
                  />
                  <div className="absolute inset-0 bg-tj-green/90" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04)_0%,transparent_60%)]" />
               </div>

               {/* Content — dead center */}
               <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
                  <motion.p
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 1, delay: 0.2 }}
                     className="text-tj-gold/60 text-[10px] uppercase tracking-[0.5em] mb-8"
                  >
                     {t.home.seHabla}
                  </motion.p>

                  <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[0.9] uppercase mb-4">
                     <AnimatedText text="TRIPLE J" type="chars" animation="fadeUp" delay={0.4} stagger={0.03} className="block" />
                  </h1>
                  <motion.p
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 1, delay: 0.9 }}
                     className="font-display text-sm md:text-base tracking-[0.4em] text-tj-gold/70 uppercase mb-12"
                  >
                     AUTO INVESTMENT
                  </motion.p>

                  <motion.p
                     initial={{ opacity: 0, y: 15 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.8, delay: 1.2 }}
                     className="font-serif italic text-base md:text-lg text-gray-400 max-w-lg mx-auto mb-14 leading-relaxed"
                  >
                     {t.home.hero.tagline}
                  </motion.p>

                  <motion.div
                     initial={{ opacity: 0, y: 15 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 1.6 }}
                     className="flex flex-col sm:flex-row items-center justify-center gap-4"
                  >
                     <MagneticButton href="/contact" className="px-10 py-5 text-[11px]">
                        {t.home.hero.scheduleVisit}
                     </MagneticButton>
                     <MagneticButton href="tel:+18324009760" className="px-10 py-5 text-[11px]" strength={0.3}>
                        <Phone size={12} />
                        {t.home.hero.callNow}
                     </MagneticButton>
                  </motion.div>
               </div>

               {/* Scroll hint */}
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5, duration: 1 }}
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
               >
                  <span className="text-[8px] uppercase tracking-[0.4em] text-gray-600">Scroll</span>
                  <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                     <ChevronDown size={14} className="text-tj-gold/40" />
                  </motion.div>
               </motion.div>
            </section>

            {/* ===== METRICS ===== */}
            <section className="py-24 md:py-32 border-t border-white/5">
               <div className="max-w-4xl mx-auto px-6">
                  <ScrollReveal direction="up" distance={30}>
                     <p className="text-center text-[10px] uppercase tracking-[0.5em] text-gray-600 mb-20">
                        {t.home.authority.title}
                     </p>
                  </ScrollReveal>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-16">
                     {metrics.map((m, i) => (
                        <ScrollReveal key={i} direction="up" delay={i * 0.1} distance={30}>
                           <CountUpNumber value={m.value} suffix={m.suffix} label={m.label} />
                        </ScrollReveal>
                     ))}
                  </div>
               </div>
            </section>

            {/* ===== GOLD TICKER ===== */}
            <div className="bg-tj-gold text-black py-3 overflow-hidden select-none">
               <div className="animate-marquee whitespace-nowrap flex items-center font-display font-black tracking-[0.2em] text-xs md:text-sm will-change-transform">
                  {Array(3).fill(null).map((_, i) => (
                     <React.Fragment key={i}>
                        {t.home.ticker.map((text, idx) => (
                           <React.Fragment key={idx}>
                              <span className="mx-8">{text}</span>
                              <Star size={10} className="mx-2" />
                           </React.Fragment>
                        ))}
                     </React.Fragment>
                  ))}
               </div>
            </div>

            {/* ===== FEATURED VEHICLES ===== */}
            <section className="py-24 md:py-32 border-t border-white/5">
               <div className="max-w-6xl mx-auto px-6">
                  <ScrollReveal direction="up" distance={30}>
                     <div className="text-center mb-20">
                        <h2 className="font-display text-3xl md:text-5xl text-white uppercase tracking-wide mb-4">
                           {t.home.arsenal.title.toUpperCase()}
                        </h2>
                        <p className="text-gray-500 text-xs uppercase tracking-[0.3em]">{t.home.arsenal.desc}</p>
                     </div>
                  </ScrollReveal>

                  {hasVehicles ? (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {featuredVehicles.map((vehicle, idx) => (
                           <ScrollReveal key={vehicle.id} direction="up" delay={idx * 0.12} distance={40}>
                              <Link
                                 to="/inventory"
                                 className="group relative aspect-[3/4] overflow-hidden bg-gray-900 block border border-white/5 hover:border-tj-gold/20 transition-all duration-700 hover:-translate-y-1"
                              >
                                 {/* Available badge */}
                                 <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 border border-green-500/20">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[8px] uppercase tracking-widest text-green-400 font-bold">{t.common.available}</span>
                                 </div>

                                 {/* Price */}
                                 <div className="absolute top-4 right-4 z-20">
                                    <span className="text-base font-display text-white bg-black/40 backdrop-blur-sm px-3 py-1.5 border border-white/10">
                                       ${vehicle.price.toLocaleString()}
                                    </span>
                                 </div>

                                 {/* Rental badge */}
                                 {vehicle.status === 'Available' && (
                                    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-tj-gold/90 px-2.5 py-1 border border-tj-gold">
                                       <Key size={10} className="text-black" />
                                       <span className="text-[8px] uppercase tracking-widest text-black font-bold">
                                          {vehicle.dailyRate ? `$${vehicle.dailyRate}${t.common.perDay}` : t.common.saleAndRental}
                                       </span>
                                    </div>
                                 )}

                                 {/* Image */}
                                 <motion.img
                                    src={vehicle.imageUrl}
                                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                    whileHover={{ scale: 1.03 }}
                                    transition={{ duration: 0.7 }}
                                 />

                                 {/* Info overlay */}
                                 <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20">
                                    <p className="text-tj-gold text-[10px] uppercase tracking-[0.2em] mb-1">{vehicle.year} {vehicle.make}</p>
                                    <h3 className="text-xl font-display text-white leading-none">{vehicle.model}</h3>
                                 </div>
                              </Link>
                           </ScrollReveal>
                        ))}
                     </div>
                  ) : (
                     <div className="py-16 text-center">
                        <p className="text-gray-500 text-sm mb-4">{t.polish.emptyInventory}</p>
                        <a href="tel:+18324009760" className="inline-flex items-center gap-2 text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors">
                           <Phone size={14} /> {t.common.phone}
                        </a>
                     </div>
                  )}

                  <ScrollReveal direction="up" delay={0.3}>
                     <div className="text-center mt-16">
                        <MagneticButton href="/inventory" className="px-10 py-5 text-[11px]">
                           {t.home.arsenal.viewAll}
                           <ArrowRight size={12} />
                        </MagneticButton>
                     </div>
                  </ScrollReveal>
               </div>
            </section>

            {/* ===== WHY TRIPLE J ===== */}
            <section className="py-24 md:py-32 border-t border-white/5">
               <div className="max-w-3xl mx-auto px-6">
                  <ScrollReveal direction="up" distance={30}>
                     <div className="text-center mb-20">
                        <p className="text-[10px] uppercase tracking-[0.5em] text-gray-600 mb-6">{t.home.architecture}</p>
                        <h2 className="font-display text-3xl md:text-5xl text-white uppercase tracking-wide">
                           {t.home.pillars.title}
                        </h2>
                     </div>
                  </ScrollReveal>

                  <div className="space-y-20">
                     {[
                        { num: '01', title: t.home.pillars.p1Title, desc: t.home.pillars.p1Desc, highlight: t.home.pillars.p1Highlight },
                        { num: '02', title: t.home.pillars.p2Title, desc: t.home.pillars.p2Desc, highlight: t.home.pillars.p2Highlight },
                        { num: '03', title: t.home.pillars.p3Title, desc: t.home.pillars.p3Desc, highlight: t.home.pillars.p3Highlight },
                     ].map((pillar, i) => (
                        <ScrollReveal key={i} direction="up" delay={i * 0.1} distance={40}>
                           <div className="text-center">
                              <span className="font-display text-6xl md:text-7xl text-white/[0.03] block mb-4">{pillar.num}</span>
                              <h3 className="font-display text-xl md:text-2xl text-white uppercase tracking-widest mb-6">{pillar.title}</h3>
                              <p className="text-gray-500 text-sm leading-relaxed max-w-lg mx-auto">
                                 {pillar.desc}
                              </p>
                              <p className="text-white text-sm mt-4 max-w-lg mx-auto">{pillar.highlight}</p>
                              <div className="w-8 h-px bg-tj-gold/30 mx-auto mt-8" />
                           </div>
                        </ScrollReveal>
                     ))}
                  </div>
               </div>
            </section>

            {/* ===== INVENTORY CTA ===== */}
            <section className="py-32 md:py-40 border-t border-white/5">
               <div className="max-w-3xl mx-auto px-6 text-center">
                  <ScrollReveal direction="up" distance={30}>
                     <h2 className="font-display text-4xl md:text-7xl text-white uppercase tracking-tight mb-8">
                        {t.home.vault.title}
                     </h2>
                     <p className="text-gray-500 text-sm mb-12 max-w-md mx-auto">{t.home.vault.access}</p>
                     <MagneticButton href="/inventory" className="px-12 py-6 text-[11px]">
                        {t.home.vault.enter}
                        <ArrowRight size={14} />
                     </MagneticButton>
                  </ScrollReveal>
               </div>
            </section>

         </motion.div>
      </>
   );
};

export default Home;
