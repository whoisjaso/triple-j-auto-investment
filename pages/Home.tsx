import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/Store';
import { ArrowRight, Diamond, Brain, Zap, Fingerprint, Target, Activity, Crosshair, Wifi, ChevronDown } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

// --- PSYCHOLOGICAL UTILITIES ---

const DecryptText = ({ text, delay = 0, speed = 30 }: { text: string, delay?: number, speed?: number }) => {
   const [display, setDisplay] = useState('');
   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&';

   useEffect(() => {
      let iteration = 0;
      const startTimeout = setTimeout(() => {
         const interval = setInterval(() => {
            setDisplay(text
               .split('')
               .map((letter, index) => {
                  if (index < iteration) {
                     return text[index];
                  }
                  return chars[Math.floor(Math.random() * chars.length)];
               })
               .join('')
            );

            if (iteration >= text.length) {
               clearInterval(interval);
            }

            iteration += 1 / 2; // Faster decoding for short attention spans
         }, speed);
         return () => clearInterval(interval);
      }, delay);
      return () => clearTimeout(startTimeout);
   }, [text, delay, speed]);

   return <span>{display}</span>;
};

// Subliminal Flash Component - Primes the user's brain
const SubliminalPrime = () => {
   const [word, setWord] = useState('');
   const [visible, setVisible] = useState(false);
   const words = ['AUTHORITY', 'CONTROL', 'LEGACY', 'DOMINION', 'SOVEREIGNTY'];

   useEffect(() => {
      // Flash a random word every few seconds for 100ms
      const interval = setInterval(() => {
         if (Math.random() > 0.7) {
            setWord(words[Math.floor(Math.random() * words.length)]);
            setVisible(true);
            setTimeout(() => setVisible(false), 150); // Subconscious flash speed
         }
      }, 4000);
      return () => clearInterval(interval);
   }, []);

   if (!visible) return null;

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none mix-blend-overlay">
         <motion.h2
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 0.1, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="text-[20vw] font-display font-black text-white tracking-tighter uppercase"
         >
            {word}
         </motion.h2>
      </div>
   );
};

const Home = () => {
   const { vehicles } = useStore();
   const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
   const { scrollY } = useScroll();

   // Smooth Parallax
   const y1 = useTransform(scrollY, [0, 500], [0, 200]);
   const opacity = useTransform(scrollY, [0, 300], [1, 0]);

   // Mouse Parallax for Hero
   const mouseX = useSpring(0, { stiffness: 50, damping: 20 });
   const mouseY = useSpring(0, { stiffness: 50, damping: 20 });

   // Get Top 3 Available Assets for "The Arsenal"
   const featuredAssets = vehicles
      .filter(v => v.status === 'Available')
      .sort((a, b) => b.price - a.price)
      .slice(0, 3);

   // Fallback if no assets
   const hasAssets = featuredAssets.length > 0;

   useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
         const x = (e.clientX / window.innerWidth) - 0.5;
         const y = (e.clientY / window.innerHeight) - 0.5;
         setMousePos({ x, y });
         mouseX.set(x);
         mouseY.set(y);
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => {
         window.removeEventListener('mousemove', handleMouseMove);
      };
   }, []);

   const containerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
   };

   const itemVariants = {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
   };

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="bg-black overflow-hidden font-sans selection:bg-tj-gold selection:text-black"
      >
         <SubliminalPrime />

         {/* --- HERO SECTION: THE SIGNAL --- */}
         <div className="relative h-screen flex flex-col justify-center items-center overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none">
               {/* Base Image with Active Parallax (Mouse + Scroll) */}
               <motion.div
                  className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2830&auto=format&fit=crop')] bg-cover bg-center"
                  style={{
                     scale: 1.1,
                     x: useTransform(mouseX, [-0.5, 0.5], [20, -20]),
                     y: useTransform(mouseY, [-0.5, 0.5], [20, -20]),
                     filter: 'grayscale(100%) contrast(110%) brightness(0.35)'
                  }}
               ></motion.div>

               {/* Digital Noise / Grain */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse"></div>

               {/* Vignette */}
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)]"></div>
            </div>

            <motion.div
               style={{ y: y1, opacity }}
               className="relative z-10 text-center px-6 w-full max-w-[1920px]"
            >
               {/* Status Bar - Gamified HUD */}
               <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-between items-center w-full max-w-5xl mx-auto mb-16 border-t border-b border-white/5 py-3 backdrop-blur-sm"
               >
                  <div className="flex items-center gap-4">
                     <div className="flex gap-1">
                        <div className="w-1 h-3 bg-tj-gold/50 animate-pulse"></div>
                        <div className="w-1 h-3 bg-tj-gold/80 animate-pulse delay-75"></div>
                        <div className="w-1 h-3 bg-tj-gold animate-pulse delay-150"></div>
                     </div>
                     <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-mono">
                        System Override: <span className="text-white">Active</span>
                     </span>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-tj-gold font-mono">
                     <Wifi size={12} className="animate-pulse" />
                     <DecryptText text="Uplink Established" delay={200} />
                  </div>
               </motion.div>

               {/* Main Typography - Massive & Responsive */}
               <h1 className="font-display text-[13vw] md:text-[11vw] leading-[0.8] text-white tracking-tighter mix-blend-difference mb-12 select-none perspective-1000">
                  <motion.span
                     initial={{ opacity: 0, rotateX: 90 }}
                     animate={{ opacity: 1, rotateX: 0 }}
                     transition={{ duration: 1, type: "spring", bounce: 0.4 }}
                     className="block origin-bottom"
                  >
                     ARCHITECT
                  </motion.span>
                  <motion.span
                     initial={{ opacity: 0, rotateX: -90 }}
                     animate={{ opacity: 1, rotateX: 0 }}
                     transition={{ duration: 1, delay: 0.2, type: "spring", bounce: 0.4 }}
                     className="block text-transparent bg-clip-text bg-gradient-to-b from-tj-gold via-yellow-600 to-transparent origin-top"
                  >
                     REALITY
                  </motion.span>
               </h1>

               {/* Action Trigger - Immediate Dopamine */}
               <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="flex flex-col items-center gap-6"
               >
                  <p className="text-sm md:text-lg text-gray-400 font-serif italic max-w-xl">
                     "Identity precedes results. Upgrade your avatar."
                  </p>

                  <Link to="/inventory" className="group relative overflow-hidden bg-white text-black px-20 py-6 text-xs font-bold tracking-[0.4em] uppercase hover:bg-tj-gold transition-colors duration-300 clip-path-polygon mt-4">
                     <span className="relative z-10 flex items-center gap-3">
                        Initiate Acquisition <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                     </span>
                     {/* Scanline Effect on Button */}
                     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  </Link>
               </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 2, duration: 1 }}
               className="absolute bottom-12 animate-bounce text-tj-gold/50 flex flex-col items-center gap-2 cursor-pointer mix-blend-difference"
               onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            >
               <span className="text-[9px] uppercase tracking-widest writing-vertical-rl">Decrypt Asset Data</span>
               <ChevronDown size={20} />
            </motion.div>
         </div>

         {/* --- SUBCONSCIOUS TICKER (High Velocity) --- */}
         <div className="bg-tj-gold text-black py-3 border-y border-black overflow-hidden relative z-20 select-none">
            <div className="animate-marquee whitespace-nowrap flex items-center font-display font-black tracking-[0.2em] text-xs md:text-sm">
               {Array(3).fill(null).map((_, i) => (
                  <React.Fragment key={i}>
                     <span className="mx-8">PSYCHOLOGY DRIVES ECONOMICS</span> <Crosshair size={12} />
                     <span className="mx-8">VELOCITY IS POWER</span> <Crosshair size={12} />
                     <span className="mx-8">REMOVE FRICTION</span> <Crosshair size={12} />
                     <span className="mx-8">WEALTH IS A STATE OF MIND</span> <Crosshair size={12} />
                     <span className="mx-8">YOU ARE WHAT YOU DRIVE</span> <Crosshair size={12} />
                  </React.Fragment>
               ))}
            </div>
         </div>

         {/* --- THE ARSENAL (Instant Asset Preview) --- */}
         {hasAssets && (
            <section className="py-24 bg-[#050505] relative overflow-hidden border-b border-white/10">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-tj-gold/5 via-transparent to-transparent"></div>

               <div className="max-w-[1920px] mx-auto px-6">
                  <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                     <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                     >
                        <h2 className="text-4xl md:text-6xl font-display text-white mb-2 flex items-center gap-4">
                           THE ARSENAL <span className="text-xs font-mono text-tj-gold bg-tj-gold/10 px-2 py-1 rounded border border-tj-gold/20 align-middle tracking-widest uppercase">Live Allocations</span>
                        </h2>
                        <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Select your instrument of power.</p>
                     </motion.div>
                     <Link to="/inventory" className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-widest text-tj-gold hover:text-white transition-colors">
                        View Full Manifest <ArrowRight size={12} />
                     </Link>
                  </div>

                  <motion.div
                     variants={containerVariants}
                     initial="hidden"
                     whileInView="visible"
                     viewport={{ once: true, margin: "-100px" }}
                     className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                     {featuredAssets.map((vehicle, idx) => (
                        <motion.div variants={itemVariants} key={vehicle.id}>
                           <Link to="/inventory" className="group relative aspect-[3/4] md:aspect-[4/5] overflow-hidden border border-white/10 bg-gray-900 cursor-pointer block">
                              {/* Active Status Blinker */}
                              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-green-500/30">
                                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                 <span className="text-[8px] uppercase tracking-widest text-green-500 font-bold">Available</span>
                              </div>

                              {/* Price Tag */}
                              <div className="absolute top-4 right-4 z-20">
                                 <span className="text-lg font-display text-white drop-shadow-md tracking-wider">
                                    ${vehicle.price.toLocaleString()}
                                 </span>
                              </div>

                              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>

                              <motion.img
                                 src={vehicle.imageUrl}
                                 alt={vehicle.model}
                                 className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0"
                                 whileHover={{ scale: 1.1 }}
                                 transition={{ duration: 0.7 }}
                              />

                              {/* Info Overlay */}
                              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                 <p className="text-tj-gold text-[10px] uppercase tracking-[0.2em] mb-1">{vehicle.year} {vehicle.make}</p>
                                 <h3 className="text-2xl font-display text-white leading-none mb-4">{vehicle.model}</h3>
                                 <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                                    <span>Inspect Asset</span>
                                    <div className="w-8 h-px bg-current"></div>
                                 </div>
                              </div>
                           </Link>
                        </motion.div>
                     ))}
                  </motion.div>

                  <div className="mt-8 text-center md:hidden">
                     <Link to="/inventory" className="inline-block border border-tj-gold text-tj-gold px-8 py-4 text-xs uppercase tracking-widest font-bold">
                        Access Full Vault
                     </Link>
                  </div>
               </div>
            </section>
         )}

         {/* --- DOCTRINE PILLARS (Visual Anchors) --- */}
         <section className="py-24 px-6 max-w-[1920px] mx-auto bg-black">
            <div className="flex items-end justify-between mb-16 border-b border-white/10 pb-6">
               <h2 className="text-white font-display text-4xl md:text-5xl tracking-tighter">
                  THE <span className="text-tj-gold">TRINITY</span>
               </h2>
               <p className="hidden md:block text-gray-500 text-xs font-mono uppercase tracking-widest">
                  Operating System V3.0
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
               {/* Pillar 1 */}
               <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-tj-dark p-10 group hover:bg-white/5 transition-colors duration-500 relative overflow-hidden h-[350px] flex flex-col justify-between"
               >
                  <div>
                     <div className="text-tj-gold mb-6 group-hover:scale-110 transition-transform duration-500 origin-left">
                        <Fingerprint size={40} className="group-hover:animate-pulse" />
                     </div>
                     <h3 className="text-white font-display text-3xl tracking-wide mb-4">IDENTITY</h3>
                     <p className="text-gray-500 text-sm leading-relaxed font-light">
                        The vehicle is not transport. It is a reinforced psychological environment. <br /><span className="text-white">Verify your status.</span>
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
                  className="bg-tj-dark p-10 group hover:bg-white/5 transition-colors duration-500 relative overflow-hidden h-[350px] flex flex-col justify-between"
               >
                  <div>
                     <div className="text-tj-gold mb-6 group-hover:scale-110 transition-transform duration-500 origin-left">
                        <Zap size={40} className="group-hover:text-white transition-colors" />
                     </div>
                     <h3 className="text-white font-display text-3xl tracking-wide mb-4">VELOCITY</h3>
                     <p className="text-gray-500 text-sm leading-relaxed font-light">
                        Money hates friction. Our acquisition process is designed for speed. <br /><span className="text-white">Move without resistance.</span>
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
                  className="bg-tj-dark p-10 group hover:bg-white/5 transition-colors duration-500 relative overflow-hidden h-[350px] flex flex-col justify-between"
               >
                  <div>
                     <div className="text-tj-gold mb-6 group-hover:scale-110 transition-transform duration-500 origin-left">
                        <Target size={40} className="group-hover:rotate-90 transition-transform duration-700" />
                     </div>
                     <h3 className="text-white font-display text-3xl tracking-wide mb-4">PRECISION</h3>
                     <p className="text-gray-500 text-sm leading-relaxed font-light">
                        No noise. Only signal. Every asset is vetted for mechanical and aesthetic sovereignty. <br /><span className="text-white">Trust the data.</span>
                     </p>
                  </div>
                  <div className="w-full h-px bg-white/10 group-hover:bg-tj-gold/50 transition-colors duration-500 flex items-center">
                     <div className="w-full h-full bg-tj-gold transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out delay-200"></div>
                  </div>
               </motion.div>
            </div>
         </section>

         {/* --- LIVE SIGNALS (Social Proof / FOMO) --- */}
         <section className="bg-tj-dark border-y border-white/10 py-12 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-tj-dark to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-tj-dark to-transparent z-10"></div>

            <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-900/50 rounded-full animate-pulse">
                  <Activity size={12} className="text-green-500" />
                  <span className="text-[9px] uppercase tracking-widest text-green-400">Intercepted Transmissions</span>
               </div>
            </div>

            <div className="flex gap-8 animate-marquee whitespace-nowrap items-center">
               {[
                  "ASSET SECURED: 2021 G-WAGON (HOUSTON)",
                  "DOMINION ESTABLISHED: SECTOR 7",
                  "ROLLS ROYCE WRAITH: DEPLOYED",
                  "CLIENT IDENTITY: VERIFIED",
                  "TRANSACTION VELOCITY: < 24 HOURS",
                  "LAMBORGHINI HURACAN: ALLOCATED",
                  "STATUS: SOVEREIGN"
               ].map((signal, i) => (
                  <div key={i} className="flex items-center gap-4 bg-black/40 border border-white/5 px-6 py-3 rounded">
                     <div className="w-1.5 h-1.5 bg-tj-gold rounded-full animate-ping"></div>
                     <span className="text-xs font-mono text-gray-300 tracking-wider uppercase">{signal}</span>
                  </div>
               ))}
               {/* Duplicate for smooth loop */}
               {[
                  "ASSET SECURED: 2021 G-WAGON (HOUSTON)",
                  "DOMINION ESTABLISHED: SECTOR 7",
                  "ROLLS ROYCE WRAITH: DEPLOYED",
                  "CLIENT IDENTITY: VERIFIED",
                  "TRANSACTION VELOCITY: < 24 HOURS",
                  "LAMBORGHINI HURACAN: ALLOCATED",
                  "STATUS: SOVEREIGN"
               ].map((signal, i) => (
                  <div key={`dup-${i}`} className="flex items-center gap-4 bg-black/40 border border-white/5 px-6 py-3 rounded">
                     <div className="w-1.5 h-1.5 bg-tj-gold rounded-full animate-ping"></div>
                     <span className="text-xs font-mono text-gray-300 tracking-wider uppercase">{signal}</span>
                  </div>
               ))}
            </div>
         </section>

         {/* --- SYSTEM ARCHITECTURE --- */}
         <section className="py-20 px-6 max-w-[1600px] mx-auto">
            <div className="text-center mb-16">
               <h2 className="font-display text-sm text-tj-gold tracking-[0.5em] uppercase mb-4">System Architecture</h2>
               <div className="w-px h-16 bg-gradient-to-b from-tj-gold to-transparent mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Card 1 */}
               <Link to="/vin" className="bg-tj-dark border border-white/5 p-8 group hover:border-tj-gold hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden shadow-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] hover:bg-gradient-to-b hover:from-tj-dark hover:to-tj-gold/5">
                  <div className="absolute -right-12 -top-12 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                     <Diamond size={150} />
                  </div>

                  <div className="mb-8 text-tj-gold transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_25px_rgba(212,175,55,0.8)] relative z-10">
                     <Diamond size={32} className="group-hover:animate-[spin_4s_linear_infinite]" />
                  </div>

                  <h3 className="font-display text-xl text-white mb-4 tracking-widest relative z-10 group-hover:text-tj-gold transition-colors">Sovereign Vetting</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-6 relative z-10 group-hover:text-gray-300 transition-colors">
                     Truth is specific. We verify identity and history to ensure every asset aligns with your kingdom.
                  </p>
                  <span className="text-[9px] uppercase tracking-widest text-tj-gold flex items-center gap-2 group-hover:gap-4 transition-all">
                     Access Intel <ArrowRight size={10} />
                  </span>
               </Link>

               {/* Card 2 (Featured) */}
               <Link to="/about" className="bg-gradient-to-br from-black to-tj-dark border border-tj-gold/30 p-8 group hover:border-tj-gold hover:-translate-y-3 hover:scale-[1.05] transition-all duration-500 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_60px_rgba(212,175,55,0.2)] z-10 scale-[1.02]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-tj-gold/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse"></div>

                  <div className="mb-8 text-tj-gold transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_30px_rgba(212,175,55,1)] relative z-10">
                     <Brain size={32} className="group-hover:animate-gold-pulse" />
                  </div>

                  <h3 className="font-display text-xl text-white mb-4 tracking-widest relative z-10 group-hover:text-tj-gold transition-colors">Psychological Moonshot</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-6 relative z-10 group-hover:text-white transition-colors">
                     Bending behavior around a new identity. Elevating self-perception through strategic acquisition.
                  </p>
                  <span className="text-[9px] uppercase tracking-widest text-white border-b border-tj-gold pb-0.5 group-hover:text-tj-gold group-hover:border-white transition-colors">
                     View Doctrine
                  </span>
               </Link>

               {/* Card 3 */}
               <div className="bg-tj-dark border border-white/5 p-8 group hover:border-tj-gold hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden shadow-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] hover:bg-gradient-to-b hover:from-tj-dark hover:to-tj-gold/5">
                  <div className="absolute -right-12 -top-12 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                     <Zap size={150} />
                  </div>

                  <div className="mb-8 text-tj-gold transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_25px_rgba(212,175,55,0.8)] relative z-10">
                     <Zap size={32} className="group-hover:animate-gold-pulse" />
                  </div>

                  <h3 className="font-display text-xl text-white mb-4 tracking-widest relative z-10 group-hover:text-tj-gold transition-colors">Strategic Velocity</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-6 relative z-10 group-hover:text-gray-300 transition-colors">
                     Money responds to order. Our streamlined operations remove friction, allowing you to move fast.
                  </p>
                  <span className="text-[9px] uppercase tracking-widest text-gray-600 flex items-center gap-2 group-hover:text-white transition-colors">
                     Status: Optimized <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                  </span>
               </div>
            </div>
         </section>

         {/* --- INVENTORY TEASER (Gamified Access) --- */}
         <section className="h-[70vh] relative flex items-center justify-center overflow-hidden border-t border-white/10 group">
            {/* Background Image with Reveal Effect */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale brightness-50 group-hover:brightness-75 group-hover:grayscale-0 transition-all duration-[1.5s] ease-out transform group-hover:scale-105"></div>
            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/30 transition-colors duration-700"></div>

            {/* Central Content */}
            <div className="relative z-10 text-center">
               <div className="mb-6 inline-block overflow-hidden">
                  <span className="block text-tj-gold text-xs font-mono uppercase tracking-[0.5em] translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                     Secure Access Only
                  </span>
               </div>

               <h2 className="text-6xl md:text-9xl font-display text-white mb-10 tracking-tighter mix-blend-overlay group-hover:mix-blend-normal transition-all duration-700">
                  THE VAULT
               </h2>

               <Link to="/inventory" className="inline-flex flex-col items-center gap-2 text-white hover:text-tj-gold transition-colors duration-300">
                  <div className="w-20 h-20 border border-white/30 rounded-full flex items-center justify-center group-hover:border-tj-gold group-hover:scale-110 transition-all duration-500 bg-black/20 backdrop-blur-sm">
                     <ArrowRight size={32} className="group-hover:-rotate-45 transition-transform duration-500" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">Enter Collection</span>
               </Link>
            </div>
         </section>

      </motion.div>
   );
};

export default Home;
