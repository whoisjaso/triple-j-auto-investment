import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/Store';
import { Sparkles } from 'lucide-react';

import { SEO } from '../components/SEO';
import { ScrollReveal, MaybachScrollAnimation, KeyScrollAnimation } from '../components/luxury';
import { ScrollAnimation } from '../components/luxury/ScrollAnimation';
import { useLanguage } from '../context/LanguageContext';
import { useGSAPAnimations } from '../hooks/useGSAPAnimations';

const Home = () => {
   useGSAPAnimations();

   const { t } = useLanguage();
   const lx = t.home.luxury;
   const { vehicles } = useStore();
   const featuredVehicles = vehicles
      .filter(v => v.status === 'Available')
      .sort((a, b) => b.price - a.price)
      .slice(0, 3);

   const hasVehicles = featuredVehicles.length > 0;

   return (
      <>
         <SEO
            title="Triple J | Sovereign Asset Acquisition House"
            description="Houston's premier pre-owned luxury vehicle dealership. Old-world standards. Modern precision. Zero compromise."
            path="/"
         />

         <div className="bg-[#F7F7F7] text-[#0e1b16] min-h-screen selection:bg-tj-gold/30 selection:text-[#0e1b16]">

            {/* 1. THE CINEMATIC CAR HERO — Maybach scroll animation */}
            <MaybachScrollAnimation />

            {/* 3. THE KEY — Scroll-driven key fob reveal */}
            <KeyScrollAnimation />

            {/* 4. SOVEREIGN ASSETS / OUR COLLECTION */}
            <section className="bg-[#F7F7F7] relative z-10" style={{ padding: 'var(--space-section) 0' }}>
               <div className="max-w-[1400px] mx-auto px-6 md:px-12">
                  <div data-animate="fade-up" className="flex flex-col items-center text-center mb-24">
                     <div data-animate="rule" className="w-[80px] h-[1px] bg-[#C9A84C] mb-8" />
                     <h2 className="font-sans text-[10px] md:text-xs font-light tracking-[0.3em] uppercase text-[#C9A84C] mb-6">
                        {lx.collection.label}
                     </h2>
                     <h3 className="font-serif text-4xl md:text-5xl text-[#0e1b16]">
                        {lx.collection.title}
                     </h3>
                  </div>

                  {hasVehicles ? (
                     <div data-animate="stagger" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14">
                        {featuredVehicles.map((vehicle) => (
                           <Link key={vehicle.id} to={`/vehicles/${vehicle.slug}`} className="group block">
                              <div className="aspect-[4/5] relative overflow-hidden bg-[#f5f5f4] border border-tj-gold/15 mb-8 transition-colors duration-700 group-hover:border-tj-gold/40">
                                 <img
                                    src={vehicle.imageUrl || "/GoldTripleJLogo.png"}
                                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100 ${!vehicle.imageUrl && 'p-16 object-contain opacity-20'}`}
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-[#F7F7F7]/70 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-700" />
                              </div>
                              <div className="flex flex-col items-center text-center px-4">
                                 <p className="font-sans text-[10px] font-light tracking-[0.3em] uppercase text-[#C9A84C] mb-4">
                                    {vehicle.year} {vehicle.make}
                                 </p>
                                 <h4 className="font-serif text-2xl md:text-3xl text-[#0e1b16] mb-4 group-hover:text-tj-gold transition-colors duration-500">
                                    {vehicle.model}
                                 </h4>
                                 <p className="font-accent text-tj-greenAccent tracking-widest text-sm">
                                    ${vehicle.price.toLocaleString()}
                                 </p>
                              </div>
                           </Link>
                        ))}
                     </div>
                  ) : (
                     <div className="py-32 text-center border border-tj-gold/15 bg-[#f5f5f4] flex flex-col items-center justify-center max-w-3xl mx-auto px-6">
                        <Sparkles size={24} className="text-tj-gold/40 mb-8" />
                        <p className="text-tj-greenAccent text-base font-sans mb-10 max-w-md mx-auto leading-relaxed">
                           {lx.collection.emptyMessage}
                        </p>
                        <Link to="/contact" className="btn-rr">
                           {lx.collection.contactConcierge} <span className="group-hover:translate-x-2 transition-transform duration-500">&#8594;</span>
                        </Link>
                     </div>
                  )}

                  <div className="mt-24 text-center">
                     <Link to="/inventory" className="btn-rr">
                        {lx.collection.viewAll} <span className="group-hover:translate-x-2 transition-transform duration-500">&#8594;</span>
                     </Link>
                  </div>
               </div>
            </section>

            {/* 5. THE EXPERIENCE — Logo forge scroll animation with overlay cards */}
            <ScrollAnimation />

            {/* 6. AI CONCIERGE CTA SECTION */}
            <section className="bg-[#F7F7F7] relative overflow-hidden border-t border-tj-gold/15" style={{ padding: 'var(--space-section) 0' }}>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                  <img src="/GoldTripleJLogo.png" alt="" className="w-[120vw] max-w-[1400px] h-auto object-contain" />
               </div>

               <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                  <div data-animate="fade-up">
                     <img src="/GoldTripleJLogo.png" alt="Crest" className="w-16 h-16 mx-auto mb-10 object-contain opacity-90" />
                     <div data-animate="rule" className="w-[80px] h-[1px] bg-[#C9A84C] mb-8 mx-auto" />
                     <h2 className="font-sans text-[10px] md:text-xs font-light tracking-[0.3em] uppercase text-[#C9A84C] mb-6">{lx.concierge.label}</h2>
                     <h3 className="font-serif text-5xl md:text-6xl text-[#0e1b16] mb-10 leading-tight">
                        {lx.concierge.title}<br className="hidden md:block" /> {lx.concierge.title2}
                     </h3>

                     <div className="my-16">
                        <a
                           href="tel:+18324009760"
                           className="inline-block font-serif italic text-5xl md:text-7xl lg:text-8xl text-tj-gold hover:text-[#0e1b16] transition-colors duration-500"
                        >
                           (832) 400-9760
                        </a>
                     </div>

                     <div className="flex flex-col sm:flex-row justify-center gap-6 md:gap-8">
                        <a href="tel:+18324009760" className="btn-rr">
                           {lx.concierge.connectNow} <span className="group-hover:translate-x-2 transition-transform duration-500">&#8594;</span>
                        </a>
                        <Link to="/about" className="btn-rr">
                           {lx.concierge.exploreEthos} <span className="group-hover:translate-x-2 transition-transform duration-500">&#8594;</span>
                        </Link>
                     </div>
                  </div>
               </div>
            </section>

            {/* 7. TRUST / HERITAGE STRIP */}
            <section className="py-20 bg-[#F7F7F7] border-y border-tj-gold/15">
               <div className="max-w-[1400px] mx-auto px-6">
                  <div data-animate="stagger" className="flex flex-wrap justify-center items-center gap-10 md:gap-20 text-center">
                     <span className="font-sans text-[10px] md:text-xs font-light tracking-[0.3em] uppercase text-tj-greenAccent">{lx.trust.established}</span>
                     <div className="w-[1px] h-6 bg-tj-gold/25 hidden md:block" />
                     <span className="font-sans text-[10px] md:text-xs font-light tracking-[0.3em] uppercase text-tj-greenAccent">{lx.trust.location}</span>
                     <div className="w-[1px] h-6 bg-tj-gold/25 hidden md:block" />
                     <span className="font-sans text-[10px] md:text-xs font-light tracking-[0.3em] uppercase text-tj-greenAccent">{lx.trust.license}</span>
                     <div className="w-[1px] h-6 bg-tj-gold/25 hidden md:block" />
                     <span className="font-sans text-[10px] md:text-xs font-light tracking-[0.3em] uppercase text-tj-greenAccent">{lx.trust.bilingual}</span>
                  </div>
               </div>
            </section>

         </div>
      </>
   );
};

export default Home;
