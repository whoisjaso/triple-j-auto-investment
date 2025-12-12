
import React from 'react';
import { Crown, Eye, Hexagon, Fingerprint, ArrowRight, Shield, Terminal, Target, Star, MapPin, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="bg-tj-green min-h-screen text-white overflow-x-hidden font-sans selection:bg-tj-gold selection:text-black">
      
      {/* HERO: The Awakening */}
      <section className="relative min-h-[100vh] flex flex-col justify-center items-center px-6 py-20 overflow-hidden border-b border-tj-gold/20">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay pointer-events-none grayscale"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-tj-green/95 to-tj-green pointer-events-none"></div>
        
        {/* Opulent Pattern Overlay - Gold Dust */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05),transparent_60%)]"></div>
        
        {/* Decorative Border Frame */}
        <div className="absolute inset-8 border border-tj-gold/10 pointer-events-none hidden md:block">
            <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-tj-gold/30"></div>
            <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-tj-gold/30"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 border-b border-l border-tj-gold/30"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-tj-gold/30"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="inline-block mb-10 animate-fade-in">
             <div className="px-8 py-3 border border-tj-gold/30 bg-black/60 backdrop-blur-md shadow-[0_0_30px_rgba(212,175,55,0.1)] relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-tj-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                {/* Tiny corner accents for the badge */}
                <div className="absolute top-0 left-0 w-1 h-1 bg-tj-gold"></div>
                <div className="absolute top-0 right-0 w-1 h-1 bg-tj-gold"></div>
                <div className="absolute bottom-0 left-0 w-1 h-1 bg-tj-gold"></div>
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-tj-gold"></div>
                
                <p className="text-tj-gold text-xs uppercase tracking-[0.6em] font-medium drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]">
                   System Restoration Protocol
                </p>
             </div>
          </div>
          
          <h1 className="font-display text-6xl md:text-9xl leading-none tracking-tighter mb-12 animate-slide-up text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-400 drop-shadow-2xl relative z-10">
            PERCEPTION <br />
            IS <span className="text-tj-gold drop-shadow-[0_0_40px_rgba(212,175,55,0.4)]">REALITY</span>
          </h1>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 animate-slide-up relative" style={{animationDelay: '0.2s'}}>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-tj-gold/60 to-transparent hidden md:block"></div>
            <p className="text-lg md:text-2xl text-gray-300 max-w-2xl mx-auto font-serif italic leading-relaxed text-center drop-shadow-lg">
              "Most operate unconsciously. We provide the leverage to reclaim sovereignty through systems, automation, and pure signal."
            </p>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-tj-gold/60 to-transparent hidden md:block"></div>
          </div>
        </div>
      </section>

      {/* SECTION 1: The Problem - Enhanced with Deep Green & Gold & Parallax */}
      <section className="py-32 bg-black relative border-t border-tj-gold/20 z-10 overflow-hidden bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80')] bg-fixed bg-cover bg-center">
        {/* Dark Overlay to keep it subtle */}
        <div className="absolute inset-0 bg-black/90"></div>
        
        {/* Parallax & Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] bg-fixed mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-tj-green/60 via-black/80 to-black"></div>
        
        {/* Vertical Gold Line Running Through */}
        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-tj-gold/20 to-transparent hidden md:block"></div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-24 items-center relative z-10">
          
          {/* Image Card */}
          <div className="order-2 md:order-1 relative group perspective-1000">
            <div className="absolute -inset-2 bg-tj-gold/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative aspect-[4/5] bg-tj-dark border border-tj-gold/30 p-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] group-hover:border-tj-gold/60 group-hover:shadow-[0_0_50px_rgba(212,175,55,0.15)] transition-all duration-700">
               <div className="absolute inset-0 bg-tj-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20 mix-blend-overlay"></div>
               <div className="h-full w-full overflow-hidden relative">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=2068&auto=format&fit=crop')] bg-cover bg-center opacity-70 grayscale contrast-125 transition-transform duration-[1.5s] group-hover:scale-110"></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-tj-green/20 to-transparent"></div>
               </div>
               
               <div className="absolute bottom-8 left-8 right-8 border-t border-tj-gold/30 pt-6 z-30">
                 <div className="flex items-center gap-3 text-tj-gold mb-2">
                     <Eye size={20} />
                     <span className="text-[10px] uppercase tracking-[0.3em]">Observation</span>
                 </div>
                 <p className="font-display text-2xl text-white tracking-wide">AWARENESS <br/> IS CURRENCY</p>
               </div>
            </div>
          </div>
          
          {/* Text Content - Opulent Text Box */}
          <div className="order-1 md:order-2">
            <div className="flex items-center gap-4 mb-8">
               <div className="h-px w-12 bg-tj-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
               <h3 className="text-tj-gold text-xs font-bold tracking-[0.4em] uppercase drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">
                 Subconscious Indoctrination
               </h3>
            </div>
            <h2 className="text-4xl md:text-6xl font-display text-white mb-10 leading-none">
              WHO IS WRITING <br/><span className="text-gray-600 italic font-serif">YOUR SCRIPT?</span>
            </h2>
            
            <div className="relative bg-gradient-to-br from-tj-green/30 to-black border border-tj-gold/30 p-10 backdrop-blur-sm shadow-[0_0_20px_rgba(212,175,55,0.15)] group hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:border-tj-gold/50 transition-all duration-500">
              {/* Ornamental corners with Glow */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-tj-gold/60 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-tj-gold/60 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]"></div>
              
              <p className="text-gray-300 text-lg leading-loose font-light mb-6">
                 The world is a machine of <span className="text-white font-medium border-b border-tj-gold/30">subconscious indoctrination</span>. The drift is designed to keep you reactive. To escape, you must rewrite the source code of your own identity.
              </p>
              
              <p className="text-white text-xl font-serif italic leading-relaxed">
                "Triple J supplies the <span className="text-tj-gold font-semibold">psychological leverage</span> to break the cycle. We restore <span className="text-tj-gold font-semibold">sovereignty</span>."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: The Wealth Framework - Cards with Gold Accents */}
      <section className="py-40 bg-tj-green border-y border-tj-gold/10 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.4)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0.4)_75%,transparent_75%,transparent)] bg-[size:40px_40px] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-tj-green/50 to-black/80"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center justify-center p-6 border border-tj-gold/30 bg-black/50 rounded-full mb-10 shadow-[0_0_40px_rgba(212,175,55,0.1)] backdrop-blur-md">
               <Crown className="text-tj-gold" size={32} />
            </div>
            <h2 className="text-5xl md:text-7xl font-display text-white mb-6 tracking-tight">THE LAW OF <br/><span className="italic font-serif text-tj-gold">IDENTITY</span></h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cards with rich dark backgrounds and gold highlights */}
            {[
              { id: '01', icon: Fingerprint, title: 'IDENTITY', text: 'Identity precedes results. We verify and fortify the sovereign operator.' },
              { id: '02', icon: Shield, title: 'BEHAVIOR', text: 'Eliminate hesitation. We provide the environment for decisive, friction-free action.' },
              { id: '03', icon: Crown, title: 'OUTCOME', text: 'When the internal state is fixed, the external empire expands automatically.' }
            ].map((card, i) => (
              <div key={i} className="bg-black/60 p-10 group relative overflow-hidden border border-tj-gold/10 hover:border-tj-gold/60 transition-all duration-500 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:-translate-y-2">
                {/* Top gold bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-tj-gold/0 group-hover:bg-tj-gold transition-colors duration-500"></div>
                
                {/* Huge background Icon */}
                <div className="absolute -right-12 -bottom-12 text-tj-gold/5 group-hover:text-tj-gold/10 transition-colors duration-700 transform group-hover:scale-110 group-hover:rotate-12">
                   <card.icon size={200} />
                </div>
                
                <div className="relative z-10">
                  <div className="text-tj-gold/50 font-display text-4xl mb-4 opacity-30 group-hover:opacity-100 transition-opacity duration-500">{card.id}</div>
                  <h3 className="text-white text-2xl font-display mb-6 tracking-widest group-hover:text-tj-gold transition-colors">{card.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm font-light group-hover:text-gray-200 transition-colors">
                    {card.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Operational Philosophy - High-End Terminal Look */}
      <section className="py-32 bg-black relative overflow-hidden">
         {/* Atmospheric Glow */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-tj-green/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="flex flex-col justify-center">
               <h2 className="font-display text-5xl md:text-7xl text-white leading-none mb-12">
                 OPERATIONAL <br/><span className="text-tj-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]">DOCTRINE</span>
               </h2>
               <div className="space-y-12 border-l-2 border-tj-gold/20 pl-10 relative">
                 {/* Decorative Gold Dots on Timeline */}
                 <div className="absolute -left-[5px] top-0 w-2 h-2 bg-tj-gold shadow-[0_0_10px_rgba(212,175,55,1)]"></div>
                 <div className="absolute -left-[5px] top-1/2 w-2 h-2 bg-tj-gold/50"></div>
                 <div className="absolute -left-[5px] bottom-0 w-2 h-2 bg-tj-gold/50"></div>

                 <div className="group">
                   <h4 className="text-white font-serif text-3xl mb-2 group-hover:text-tj-gold transition-colors duration-300 cursor-default">Psychology Drives Economics.</h4>
                   <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">The Mindset is the Market.</p>
                 </div>
                 <div className="group">
                   <h4 className="text-white font-serif text-3xl mb-2 group-hover:text-tj-gold transition-colors duration-300 cursor-default">Clarity Drives Scale.</h4>
                   <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">Ambiguity is the enemy of wealth.</p>
                 </div>
                 <div className="group">
                   <h4 className="text-white font-serif text-3xl mb-2 group-hover:text-tj-gold transition-colors duration-300 cursor-default">Identity Drives Behavior.</h4>
                   <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">You cannot out-earn your self-image.</p>
                 </div>
               </div>
            </div>

            {/* The Monolith / Terminal Box */}
            <div className="bg-tj-green/10 backdrop-blur-md border border-tj-gold/20 p-12 relative shadow-2xl group hover:border-tj-gold/40 hover:bg-tj-green/20 transition-all duration-700">
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_4px,6px_100%] pointer-events-none z-0 opacity-50"></div>
              
              {/* Floating Icon */}
              <div className="absolute top-8 right-8 text-tj-gold/10 group-hover:text-tj-gold/20 transition-colors duration-700">
                <Terminal size={80} strokeWidth={1} />
              </div>
              
              {/* Opulent Borders */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-tj-gold/40"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-tj-gold/40"></div>

              <h3 className="text-tj-gold text-xs font-bold tracking-[0.4em] uppercase mb-10 flex items-center gap-4 relative z-10">
                 <span className="h-px w-8 bg-tj-gold shadow-[0_0_8px_rgba(212,175,55,0.8)]"></span>
                 System Output
              </h3>
              
              <ul className="space-y-6 text-gray-300 font-light relative z-10">
                {[
                    "REMOVE FRICTION.",
                    "INCREASE LEVERAGE.",
                    "DECISIVE ACTION.",
                    "VELOCITY WITHOUT LIMIT."
                ].map((item, i) => (
                    <li key={i} className="flex items-center gap-6 group/item border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="h-1.5 w-1.5 bg-tj-gold rotate-45 group-hover/item:rotate-180 transition-transform duration-500 shadow-[0_0_5px_rgba(212,175,55,0.8)]"></div>
                        <span className="tracking-widest text-sm uppercase font-medium text-white group-hover/item:text-tj-gold transition-colors shadow-black drop-shadow-md">{item}</span>
                    </li>
                ))}
              </ul>

              <div className="mt-10 pt-8 border-t border-tj-gold/10 text-center">
                <p className="text-xl font-serif italic text-white/80">
                  "Align with the inevitable."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

       {/* SECTION 4: Headquarters (Interactive Map) */}
       <section className="py-20 bg-tj-dark border-t border-tj-gold/10 relative overflow-hidden">
          <div className="max-w-[1800px] mx-auto px-6">
              <div className="flex flex-col md:flex-row items-start md:items-stretch gap-0 md:gap-12 border border-tj-gold/20">
                  
                  {/* Left: Tactical Intel */}
                  <div className="w-full md:w-1/3 bg-black p-12 flex flex-col justify-center relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-tj-gold"></div>
                      {/* Background Icon */}
                      <MapPin className="absolute -right-12 -bottom-12 text-tj-gold/5 w-64 h-64 rotate-12 group-hover:text-tj-gold/10 transition-colors" />
                      
                      <h3 className="text-tj-gold text-xs font-bold tracking-[0.4em] uppercase mb-8 flex items-center gap-2">
                          <Target size={14} /> Base of Operations
                      </h3>
                      
                      <div className="space-y-8 relative z-10">
                          <div>
                              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Coordinates</p>
                              <p className="text-white font-display text-2xl tracking-wide">8774 ALMEDA GENOA RD</p>
                              <p className="text-gray-400 font-mono text-sm">Houston, TX 77075</p>
                          </div>
                          
                          <div>
                              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Sector</p>
                              <p className="text-white font-display text-xl tracking-wide">USA / SOUTHERN COMMAND</p>
                          </div>

                          <a 
                              href="https://www.google.com/maps/search/?api=1&query=8774+Almeda+Genoa+Road,+Houston,+TX+77075" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-3 bg-white/5 hover:bg-tj-gold text-white hover:text-black px-8 py-4 text-xs uppercase tracking-[0.2em] font-bold transition-all border border-white/10 hover:border-tj-gold"
                          >
                              <Navigation size={16} /> Tactical Approach
                          </a>
                      </div>
                  </div>

                  {/* Right: Interactive Map */}
                  <div className="w-full md:w-2/3 min-h-[500px] relative bg-gray-900 group">
                       {/* Overlay for styling - creates the "Hacker/Satellite" Look */}
                       <div className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay bg-tj-gold/10 group-hover:bg-transparent transition-colors duration-700"></div>
                       
                       {/* Interactive Iframe with Grayscale/Invert filters for Dark Mode */}
                       <iframe 
                           src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3467.6476078992476!2d-95.23189668456814!3d29.60774498204349!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8640970616297329%3A0x7172801465871632!2s8774%20Almeda%20Genoa%20Rd%2C%20Houston%2C%20TX%2077075!5e0!3m2!1sen!2sus!4v1709664000000!5m2!1sen!2sus"
                           width="100%" 
                           height="100%" 
                           style={{ border: 0, filter: 'grayscale(100%) invert(92%) contrast(83%)' }} 
                           allowFullScreen={true} 
                           loading="lazy" 
                           referrerPolicy="no-referrer-when-downgrade"
                           className="absolute inset-0 w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                           title="Headquarters Map"
                       ></iframe>
                       
                       {/* Decorative Crosshairs */}
                       <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-tj-gold/50 pointer-events-none z-20"></div>
                       <div className="absolute bottom-8 right-8 w-4 h-4 border-b-2 border-r-2 border-tj-gold/50 pointer-events-none z-20"></div>
                  </div>
              </div>
          </div>
       </section>

      {/* FOOTER CTA */}
      <section className="py-32 bg-tj-green text-center px-6 relative overflow-hidden border-t border-tj-gold/30">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
              <Star className="text-tj-gold fill-tj-gold animate-pulse" size={24} />
          </div>
          <p className="text-tj-gold font-display text-sm tracking-[0.5em] mb-8 uppercase drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">The Psychological Moonshot</p>
          <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight mb-12 drop-shadow-xl">
            Shift perception. Bend behavior. <br/> <span className="text-tj-gold">Solidify identity.</span>
          </h2>
          
          <div className="inline-block p-0.5 bg-gradient-to-r from-transparent via-tj-gold/50 to-transparent">
            <Link to="/inventory" className="group relative flex items-center gap-4 bg-black border border-tj-gold/50 px-16 py-6 text-xs font-bold tracking-[0.3em] hover:bg-tj-gold hover:text-black transition-all duration-500 shadow-[0_0_30px_rgba(212,175,55,0.15)] hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] uppercase text-white">
              <span className="relative z-10">Initiate Alignment</span>
              <ArrowRight size={16} className="relative z-10 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
