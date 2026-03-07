# Homepage Premium Showroom Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the homepage from stark brutalism to an immersive premium showroom with Ken Burns hero, luxury animations, green+gold palette, and elevated vehicle cards.

**Architecture:** Upgrade all 8 existing sections in-place within `pages/Home.tsx`, importing from the existing `components/luxury/` library (ScrollReveal, AnimatedText, MagneticButton, NoiseOverlay, SmoothScroll). Add NoiseOverlay + SmoothScroll wrappers in `App.tsx`. Add a Ken Burns CSS keyframe in `src/index.css`.

**Tech Stack:** React, Tailwind CSS, Framer Motion (existing), GSAP (existing via luxury components), Lenis (existing)

---

### Task 1: Add Ken Burns keyframe and utility classes to index.css

**Files:**
- Modify: `triple-j-auto-investment-main/src/index.css` (append after line 130)

**Step 1: Add the Ken Burns keyframe and shimmer animation**

Add these at the end of `src/index.css`:

```css
/* Ken Burns slow zoom for hero backgrounds */
@keyframes kenBurns {
  0% { transform: scale(1); }
  100% { transform: scale(1.12); }
}

.animate-ken-burns {
  animation: kenBurns 20s ease-in-out alternate infinite;
}

/* Gold shimmer for ticker */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

**Step 2: Verify dev server picks up the change**

Run: check http://localhost:3003 — should load without CSS errors.

**Step 3: Commit**

```bash
git add triple-j-auto-investment-main/src/index.css
git commit -m "style: add Ken Burns keyframe and shimmer animation for homepage redesign"
```

---

### Task 2: Add NoiseOverlay and SmoothScroll to App.tsx

**Files:**
- Modify: `triple-j-auto-investment-main/App.tsx`

**Step 1: Add imports**

At the top of `App.tsx`, after the existing imports (around line 14), add:

```tsx
import { NoiseOverlay, SmoothScroll } from './components/luxury';
```

**Step 2: Wrap AppContent with SmoothScroll and add NoiseOverlay**

In the `AppContent` component (line 567-632), wrap the return content with `SmoothScroll` and add `NoiseOverlay`:

Change the return in `AppContent` from:
```tsx
    <div className="min-h-screen flex flex-col bg-tj-green text-gray-200 font-sans">
```

To:
```tsx
    <SmoothScroll>
    <div className="min-h-screen flex flex-col bg-tj-green text-gray-200 font-sans">
```

And before the closing `</div>` (before `</SmoothScroll>`), right after `<Footer />`:
```tsx
      <Footer />
      <NoiseOverlay opacity={0.03} />
    </div>
    </SmoothScroll>
```

**Step 3: Verify the page loads**

Check http://localhost:3003 — should see subtle film grain texture and smoother scrolling.

**Step 4: Commit**

```bash
git add triple-j-auto-investment-main/App.tsx
git commit -m "feat: add NoiseOverlay and SmoothScroll wrappers for luxury feel"
```

---

### Task 3: Redesign the Hero section

**Files:**
- Modify: `triple-j-auto-investment-main/pages/Home.tsx`

**Step 1: Add luxury imports**

Replace the existing imports at the top of `Home.tsx` (line 1-7) with:

```tsx
import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { ArrowRight, Diamond, Heart, Zap, Fingerprint, Target, Activity, Star, ChevronDown, Phone, Key, Users } from 'lucide-react';
import { motion, useTransform, useSpring, useInView } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';
import { ScrollReveal, AnimatedText, MagneticButton } from '../components/luxury';
```

**Step 2: Replace the hero section**

Replace the entire `{/* --- BRUTALIST HERO SECTION --- */}` block (lines 99-184) with:

```tsx
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
```

**Step 3: Verify hero renders correctly**

Check http://localhost:3003 — hero should show full-viewport with Ken Burns image, animated text, gold corner accents, magnetic buttons, and scroll indicator.

**Step 4: Commit**

```bash
git add triple-j-auto-investment-main/pages/Home.tsx
git commit -m "feat: redesign homepage hero with Ken Burns, AnimatedText, and MagneticButtons"
```

---

### Task 4: Upgrade Authority Metrics section

**Files:**
- Modify: `triple-j-auto-investment-main/pages/Home.tsx`

**Step 1: Replace the authority metrics section**

Replace the `{/* --- AUTHORITY METRICS --- */}` block (lines ~187-218 after task 3) with:

```tsx
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
```

**Step 2: Update the CountUpNumber component styling**

Replace the CountUpNumber return block (lines ~23-32) to use gold numbers:

```tsx
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
```

**Step 3: Verify metrics section**

Check http://localhost:3003 — metrics should have dark green background with gold radial glow, scroll-triggered entrance, gold numbers.

**Step 4: Commit**

```bash
git add triple-j-auto-investment-main/pages/Home.tsx
git commit -m "feat: upgrade authority metrics with green bg, gold glow, and ScrollReveal"
```

---

### Task 5: Upgrade Featured Vehicles section

**Files:**
- Modify: `triple-j-auto-investment-main/pages/Home.tsx`

**Step 1: Replace the featured vehicles section**

Replace the `{/* --- FEATURED VEHICLES --- */}` block with:

```tsx
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
```

**Step 2: Verify vehicle cards**

Check http://localhost:3003 — cards should have gold glow on hover, subtle lift, glass-morphism badges, ScrollReveal staggered entrance, green section background.

**Step 3: Commit**

```bash
git add triple-j-auto-investment-main/pages/Home.tsx
git commit -m "feat: upgrade featured vehicles with gold glow, glass badges, and ScrollReveal"
```

---

### Task 6: Upgrade Value Pillars section

**Files:**
- Modify: `triple-j-auto-investment-main/pages/Home.tsx`

**Step 1: Replace the value pillars section**

Replace the `{/* --- VALUE PILLARS (BRUTALIST STACK) --- */}` block with:

```tsx
            {/* --- VALUE PILLARS --- */}
            <section className="bg-tj-green w-full relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-tj-greenDeep/50 to-tj-green/50" />

               <div className="relative flex flex-col">

                  {/* Pillar 01 */}
                  <ScrollReveal direction="left" distance={80}>
                     <div className="w-full flex flex-col md:flex-row items-stretch border-b border-white/10">
                        <div className="md:w-1/3 p-12 md:p-24 border-b md:border-b-0 md:border-r border-white/10 flex items-center justify-center bg-tj-greenDeep/80 relative overflow-hidden">
                           <span className="font-display text-[150px] md:text-[200px] text-white/5 font-black tracking-tighter mix-blend-screen absolute -left-10 md:left-0 top-1/2 -translate-y-1/2">01</span>
                           <div className="relative z-10 text-tj-gold">
                              <Fingerprint size={48} className="opacity-80" />
                           </div>
                        </div>
                        <div className="md:w-2/3 p-12 md:p-24 flex flex-col justify-center items-start bg-tj-green/40 backdrop-blur-sm">
                           <div className="w-8 h-px bg-tj-gold/40 mb-6" />
                           <h3 className="text-white font-display text-4xl sm:text-6xl tracking-tighter mb-8 uppercase">{t.home.pillars.p1Title}</h3>
                           <p className="text-gray-400 text-xs md:text-sm uppercase tracking-widest leading-loose max-w-xl">
                              {t.home.pillars.p1Desc} <br /><span className="text-white mt-8 block font-xl tracking-tight normal-case">{t.home.pillars.p1Highlight}</span>
                           </p>
                        </div>
                     </div>
                  </ScrollReveal>

                  {/* Pillar 02 (Reversed) */}
                  <ScrollReveal direction="right" distance={80}>
                     <div className="w-full flex flex-col md:flex-row-reverse items-stretch border-b border-white/10">
                        <div className="md:w-1/3 p-12 md:p-24 border-b md:border-b-0 md:border-l border-white/10 flex items-center justify-center bg-tj-greenDeep/80 relative overflow-hidden">
                           <span className="font-display text-[150px] md:text-[200px] text-white/5 font-black tracking-tighter mix-blend-screen absolute -right-10 md:right-0 top-1/2 -translate-y-1/2">02</span>
                           <div className="relative z-10 text-tj-gold">
                              <Zap size={48} className="opacity-80" />
                           </div>
                        </div>
                        <div className="md:w-2/3 p-12 md:p-24 flex flex-col justify-center items-end text-right bg-tj-green/40 backdrop-blur-sm">
                           <div className="w-8 h-px bg-tj-gold/40 mb-6 self-end" />
                           <h3 className="text-white font-display text-4xl sm:text-6xl tracking-tighter mb-8 uppercase">{t.home.pillars.p2Title}</h3>
                           <p className="text-gray-400 text-xs md:text-sm uppercase tracking-widest leading-loose max-w-xl">
                              {t.home.pillars.p2Desc} <br /><span className="text-white mt-8 block font-xl tracking-tight normal-case">{t.home.pillars.p2Highlight}</span>
                           </p>
                        </div>
                     </div>
                  </ScrollReveal>

                  {/* Pillar 03 */}
                  <ScrollReveal direction="left" distance={80}>
                     <div className="w-full flex flex-col md:flex-row items-stretch border-b border-white/10">
                        <div className="md:w-1/3 p-12 md:p-24 border-b md:border-b-0 md:border-r border-white/10 flex items-center justify-center bg-tj-greenDeep/80 relative overflow-hidden">
                           <span className="font-display text-[150px] md:text-[200px] text-white/5 font-black tracking-tighter mix-blend-screen absolute -left-10 md:left-0 top-1/2 -translate-y-1/2">03</span>
                           <div className="relative z-10 text-tj-gold">
                              <Target size={48} className="opacity-80" />
                           </div>
                        </div>
                        <div className="md:w-2/3 p-12 md:p-24 flex flex-col justify-center items-start bg-tj-green/40 backdrop-blur-sm">
                           <div className="w-8 h-px bg-tj-gold/40 mb-6" />
                           <h3 className="text-white font-display text-4xl sm:text-6xl tracking-tighter mb-8 uppercase">{t.home.pillars.p3Title}</h3>
                           <p className="text-gray-400 text-xs md:text-sm uppercase tracking-widest leading-loose max-w-xl">
                              {t.home.pillars.p3Desc} <br /><span className="text-white mt-8 block font-xl tracking-tight normal-case">{t.home.pillars.p3Highlight}</span>
                           </p>
                        </div>
                     </div>
                  </ScrollReveal>

               </div>
            </section>
```

**Step 2: Verify pillars scroll in from left/right alternating**

Check http://localhost:3003 — pillars should alternate left/right entrance on scroll, green backgrounds, gold accent lines.

**Step 3: Commit**

```bash
git add triple-j-auto-investment-main/pages/Home.tsx
git commit -m "feat: upgrade value pillars with green bg, ScrollReveal, and gold accents"
```

---

### Task 7: Upgrade Dealership Info Ticker and Architectural Differences sections

**Files:**
- Modify: `triple-j-auto-investment-main/pages/Home.tsx`

**Step 1: Replace the dealership info ticker**

Replace the `{/* --- DEALERSHIP INFO TICKER --- */}` block with:

```tsx
            {/* --- DEALERSHIP INFO TICKER --- */}
            <section className="bg-tj-greenDeep border-y border-white/10 py-12 overflow-hidden relative">
               <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-tj-greenDeep to-transparent z-10" />
               <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-tj-greenDeep to-transparent z-10" />

               <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-900/50 rounded-full animate-pulse">
                     <Activity size={12} className="text-green-500" />
                     <span className="text-[9px] uppercase tracking-widest text-green-400">{t.home.signals.label}</span>
                  </div>
               </div>

               <div className="flex gap-8 animate-marquee whitespace-nowrap items-center">
                  {t.home.signals.items.map((item, i) => (
                     <div key={i} className="flex items-center gap-4 bg-black/30 backdrop-blur-md border border-white/5 hover:border-tj-gold/20 px-6 py-3 transition-colors duration-500">
                        <div className="w-1.5 h-1.5 bg-tj-gold rounded-full animate-ping" />
                        <span className="text-xs font-mono text-gray-300 tracking-wider uppercase">{item}</span>
                     </div>
                  ))}
                  {t.home.signals.items.map((item, i) => (
                     <div key={`dup-${i}`} className="flex items-center gap-4 bg-black/30 backdrop-blur-md border border-white/5 hover:border-tj-gold/20 px-6 py-3 transition-colors duration-500">
                        <div className="w-1.5 h-1.5 bg-tj-gold rounded-full animate-ping" />
                        <span className="text-xs font-mono text-gray-300 tracking-wider uppercase">{item}</span>
                     </div>
                  ))}
               </div>
            </section>
```

**Step 2: Replace the architectural differences section**

Replace the `{/* --- ARCHITECTURAL DIFFERENCES --- */}` block with:

```tsx
            {/* --- ARCHITECTURAL DIFFERENCES --- */}
            <section className="w-full border-b border-white/10 relative">
               <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
                  {[
                     { to: "/vin", icon: <Diamond size={24} />, title: t.home.cards.vetting.title, desc: t.home.cards.vetting.desc, cta: t.home.cards.vetting.cta, isLink: true },
                     { to: "/about", icon: <Heart size={24} />, title: t.home.cards.psych.title, desc: t.home.cards.psych.desc, cta: t.home.cards.psych.cta, isLink: true, highlight: true },
                     { to: "#", icon: <Zap size={24} />, title: t.home.cards.velocity.title, desc: t.home.cards.velocity.desc, cta: t.home.cards.velocity.cta, isLink: false },
                  ].map((card, idx) => (
                     <ScrollReveal key={idx} direction="up" delay={idx * 0.15}>
                        {card.isLink ? (
                           <Link
                              to={card.to}
                              className="p-12 md:p-20 group relative overflow-hidden flex flex-col items-start bg-tj-green hover:bg-tj-greenDeep transition-all duration-700 hover:shadow-[0_10px_40px_rgba(212,175,55,0.08)] block"
                           >
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-tj-greenDeep/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                              <div className="mb-12 text-tj-gold relative z-10 group-hover:scale-110 transition-transform duration-500">
                                 {card.icon}
                              </div>
                              <h3 className={`font-display text-2xl ${card.highlight ? 'text-tj-gold' : 'text-white'} mb-6 tracking-widest relative z-10 uppercase`}>{card.title}</h3>
                              <p className="text-gray-500 text-[10px] leading-relaxed mb-12 relative z-10 uppercase tracking-widest">
                                 {card.desc}
                              </p>
                              <span className="text-[10px] uppercase tracking-ultra text-white flex items-center gap-4 transition-all duration-700 mt-auto border-b border-transparent group-hover:border-tj-gold pb-1 w-max relative z-10">
                                 {card.cta}
                              </span>
                           </Link>
                        ) : (
                           <div className="p-12 md:p-20 group relative overflow-hidden flex flex-col items-start bg-tj-green hover:bg-tj-greenDeep transition-all duration-700">
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-tj-greenDeep/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                              <div className="mb-12 text-tj-gold relative z-10 group-hover:scale-110 transition-transform duration-500">
                                 {card.icon}
                              </div>
                              <h3 className="font-display text-2xl text-white mb-6 tracking-widest relative z-10 uppercase">{card.title}</h3>
                              <p className="text-gray-500 text-[10px] leading-relaxed mb-12 relative z-10 uppercase tracking-widest">
                                 {card.desc}
                              </p>
                              <span className="text-[10px] uppercase tracking-ultra text-white/50 flex items-center gap-4 mt-auto pb-1 w-max relative z-10">
                                 {card.cta}
                              </span>
                           </div>
                        )}
                     </ScrollReveal>
                  ))}
               </div>
            </section>
```

**Step 3: Verify both sections**

Check http://localhost:3003 — ticker should have green bg with glass cards, difference cards should have green bg with gold glow on hover.

**Step 4: Commit**

```bash
git add triple-j-auto-investment-main/pages/Home.tsx
git commit -m "feat: upgrade info ticker and difference cards with green palette and glass effects"
```

---

### Task 8: Upgrade Inventory CTA (Vault) section and remove dead code

**Files:**
- Modify: `triple-j-auto-investment-main/pages/Home.tsx`

**Step 1: Replace the inventory CTA section**

Replace the `{/* --- INVENTORY CTA --- */}` block with:

```tsx
            {/* --- INVENTORY CTA --- */}
            <section className="relative min-h-[60vh] flex items-center overflow-hidden border-t border-white/10">
               {/* Background with parallax effect */}
               <div className="absolute inset-0">
                  {featuredVehicles[1] && (
                     <div
                        className="absolute inset-0"
                        style={{
                           backgroundImage: `url(${featuredVehicles[1].imageUrl})`,
                           backgroundSize: 'cover',
                           backgroundPosition: 'center',
                           backgroundAttachment: 'fixed',
                        }}
                     />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-tj-green/95 via-tj-green/85 to-tj-green/75" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(212,175,55,0.08)_0%,transparent_60%)]" />
               </div>

               {/* Gold corner accents */}
               <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-tj-gold/30" />
               <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-tj-gold/30" />

               <div className="max-w-[1920px] mx-auto w-full px-6 md:px-12 flex flex-col md:flex-row items-center justify-between z-10 relative py-16">
                  <ScrollReveal direction="left">
                     <h2 className="text-5xl md:text-8xl font-display text-white tracking-tighter mb-8 md:mb-0 uppercase">
                        {t.home.vault.title.toUpperCase()}
                     </h2>
                  </ScrollReveal>
                  <ScrollReveal direction="right" delay={0.2}>
                     <MagneticButton href="/inventory" className="px-12 py-6 text-[11px]">
                        {t.home.vault.enter}
                        <ArrowRight size={14} />
                     </MagneticButton>
                  </ScrollReveal>
               </div>
            </section>
```

**Step 2: Remove the unused heroSvgPaths and heroSvgCircles arrays**

Delete the `heroSvgPaths` array (lines ~37-46) and `heroSvgCircles` array (lines ~48-52) — these were for the old brutalist hero background SVGs and are no longer used.

**Step 3: Update the page wrapper background**

Change the outermost `<motion.div>` className from:
```tsx
className="bg-black overflow-hidden font-sans selection:bg-tj-gold selection:text-black"
```
To:
```tsx
className="bg-tj-green overflow-hidden font-sans selection:bg-tj-gold selection:text-black"
```

**Step 4: Verify the complete homepage**

Scroll through the entire homepage at http://localhost:3003 — every section should use green backgrounds, gold accents, scroll animations, and premium styling.

**Step 5: Commit**

```bash
git add triple-j-auto-investment-main/pages/Home.tsx
git commit -m "feat: complete homepage premium showroom redesign with vault CTA and cleanup"
```

---

### Task 9: Final visual review and polish

**Files:**
- Potentially: `triple-j-auto-investment-main/pages/Home.tsx`
- Potentially: `triple-j-auto-investment-main/src/index.css`

**Step 1: Full page scroll-through review**

Open http://localhost:3003 and scroll through the entire homepage. Check:
- Hero: Ken Burns zoom working, text animation plays, magnetic buttons respond, scroll indicator bounces
- Metrics: Numbers count up, gold color, scroll reveal triggers
- Ticker: Gold banner readable, shimmer effect visible
- Vehicles: Cards lift on hover, gold glow appears, grayscale-to-color works
- Pillars: Alternate left/right reveal on scroll, green bg consistent
- Info ticker: Glass cards, green bg
- Difference cards: Hover glow, icon scale, gold underline on CTA
- Vault: Background image visible through green overlay, corner accents, magnetic button

**Step 2: Mobile responsiveness check**

Open dev tools, toggle mobile viewport (375px). Verify:
- Hero stacks properly, text doesn't overflow
- Vehicle cards stack to single column
- Pillars stack vertically
- CTAs are full-width on mobile
- No horizontal scroll

**Step 3: Fix any visual issues found**

Address any spacing, overflow, or styling issues discovered during review.

**Step 4: Commit any fixes**

```bash
git add triple-j-auto-investment-main/pages/Home.tsx triple-j-auto-investment-main/src/index.css
git commit -m "fix: polish homepage visual issues from review"
```
