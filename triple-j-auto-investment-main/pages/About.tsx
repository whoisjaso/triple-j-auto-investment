
import React, { useState } from 'react';
import { Heart, Shield, Users, ArrowRight, Star, MapPin, Navigation, Clock, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const About = () => {
  const { t } = useLanguage();
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <div className="bg-tj-green min-h-screen text-white overflow-x-hidden font-sans selection:bg-tj-gold selection:text-black">

      {/* HERO: Our Story */}
      <section className="relative min-h-[100vh] flex flex-col justify-center items-center px-6 py-20 overflow-hidden border-b border-tj-gold/20">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay pointer-events-none grayscale"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-tj-green/95 to-tj-green pointer-events-none"></div>

        {/* Gold Dust Pattern Overlay */}
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
                <div className="absolute top-0 left-0 w-1 h-1 bg-tj-gold"></div>
                <div className="absolute top-0 right-0 w-1 h-1 bg-tj-gold"></div>
                <div className="absolute bottom-0 left-0 w-1 h-1 bg-tj-gold"></div>
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-tj-gold"></div>

                <p className="text-tj-gold text-xs uppercase tracking-[0.6em] font-medium drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]">
                   {t.about.hero.badge}
                </p>
             </div>
          </div>

          <h1 className="font-display text-6xl md:text-9xl leading-none tracking-tighter mb-12 animate-slide-up text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-400 drop-shadow-2xl relative z-10">
            {t.about.hero.title}
          </h1>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12 animate-slide-up relative" style={{animationDelay: '0.2s'}}>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-tj-gold/60 to-transparent hidden md:block"></div>
            <p className="text-lg md:text-2xl text-gray-300 max-w-2xl mx-auto font-serif italic leading-relaxed text-center drop-shadow-lg">
              {t.about.hero.subtitle}
            </p>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-tj-gold/60 to-transparent hidden md:block"></div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Our Story */}
      <section className="py-20 md:py-32 bg-black relative border-t border-tj-gold/20 z-10 overflow-hidden bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80')] bg-fixed bg-cover bg-center">
        <div className="absolute inset-0 bg-black/90"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] bg-fixed mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-tj-green/60 via-black/80 to-black"></div>

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
                     <Heart size={20} />
                     <span className="text-[10px] uppercase tracking-[0.3em]">{t.about.values.v2Title}</span>
                 </div>
                 <p className="font-display text-2xl text-white tracking-wide">{t.about.hero.title}</p>
               </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="order-1 md:order-2">
            <div className="flex items-center gap-4 mb-8">
               <div className="h-px w-12 bg-tj-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
               <h3 className="text-tj-gold text-xs font-bold tracking-[0.4em] uppercase drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">
                 {t.about.hero.badge}
               </h3>
            </div>
            <h2 className="text-4xl md:text-6xl font-display text-white mb-10 leading-none">
              {t.about.story.title}
            </h2>

            <div className="relative bg-gradient-to-br from-tj-green/30 to-black border border-tj-gold/30 p-6 md:p-8 backdrop-blur-sm shadow-[0_0_20px_rgba(212,175,55,0.15)] group hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:border-tj-gold/50 transition-all duration-500">
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-tj-gold/60 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-tj-gold/60 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]"></div>

              <p className="text-gray-300 text-lg leading-loose font-light mb-6">
                 {t.about.story.p1}
              </p>

              <p className="text-gray-300 text-lg leading-loose font-light">
                {t.about.story.p2}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Our Values */}
      <section className="py-20 md:py-32 bg-tj-green border-y border-tj-gold/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.4)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0.4)_75%,transparent_75%,transparent)] bg-[size:40px_40px] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-tj-green/50 to-black/80"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center justify-center p-6 border border-tj-gold/30 bg-black/50 rounded-full mb-10 shadow-[0_0_40px_rgba(212,175,55,0.1)] backdrop-blur-md">
               <Heart className="text-tj-gold" size={32} />
            </div>
            <h2 className="text-5xl md:text-7xl font-display text-white mb-6 tracking-tight">{t.about.values.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { id: '01', icon: Shield, title: t.about.values.v1Title, text: t.about.values.v1Desc },
              { id: '02', icon: Heart, title: t.about.values.v2Title, text: t.about.values.v2Desc },
              { id: '03', icon: Users, title: t.about.values.v3Title, text: t.about.values.v3Desc }
            ].map((card, i) => (
              <div key={i} className="bg-black/60 p-6 md:p-8 group relative overflow-hidden border border-tj-gold/10 hover:border-tj-gold/60 transition-all duration-500 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:-translate-y-2">
                <div className="absolute top-0 left-0 w-full h-1 bg-tj-gold/0 group-hover:bg-tj-gold transition-colors duration-500"></div>

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

      {/* SECTION 3: Bilingual & Community */}
      <section className="py-16 md:py-24 bg-black relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-tj-green/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="flex flex-col justify-center">
               <h2 className="font-display text-5xl md:text-7xl text-white leading-none mb-12">
                 {t.about.story.title}
               </h2>
               <div className="space-y-8 border-l-2 border-tj-gold/20 pl-10 relative">
                 <div className="absolute -left-[5px] top-0 w-2 h-2 bg-tj-gold shadow-[0_0_10px_rgba(212,175,55,1)]"></div>

                 <div className="group">
                   <p className="text-gray-300 text-lg leading-loose font-light">
                     {t.about.story.p3}
                   </p>
                 </div>
               </div>
            </div>

            {/* Info Card */}
            <div className="bg-tj-green/10 backdrop-blur-md border border-tj-gold/20 p-6 md:p-8 relative shadow-2xl group hover:border-tj-gold/40 hover:bg-tj-green/20 transition-all duration-700">
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-tj-gold/40"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-tj-gold/40"></div>

              <h3 className="text-tj-gold text-xs font-bold tracking-[0.4em] uppercase mb-10 flex items-center gap-4 relative z-10">
                 <span className="h-px w-8 bg-tj-gold shadow-[0_0_8px_rgba(212,175,55,0.8)]"></span>
                 {t.about.location.title}
              </h3>

              <ul className="space-y-6 text-gray-300 font-light relative z-10">
                <li className="flex items-center gap-6 border-b border-white/5 pb-4">
                    <div className="h-1.5 w-1.5 bg-tj-gold rotate-45 shadow-[0_0_5px_rgba(212,175,55,0.8)]"></div>
                    <div>
                      <span className="tracking-widest text-xs uppercase font-medium text-gray-400 block mb-1">{t.footer.location}</span>
                      <span className="text-white text-sm">{t.about.location.address}, {t.about.location.city}</span>
                    </div>
                </li>
                <li className="flex items-center gap-6 border-b border-white/5 pb-4">
                    <div className="h-1.5 w-1.5 bg-tj-gold rotate-45 shadow-[0_0_5px_rgba(212,175,55,0.8)]"></div>
                    <div>
                      <span className="tracking-widest text-xs uppercase font-medium text-gray-400 block mb-1">{t.footer.phoneLabel}</span>
                      <span className="text-white text-sm">{t.about.location.phone}</span>
                    </div>
                </li>
                <li className="flex items-center gap-6 border-b border-white/5 pb-4">
                    <div className="h-1.5 w-1.5 bg-tj-gold rotate-45 shadow-[0_0_5px_rgba(212,175,55,0.8)]"></div>
                    <div>
                      <span className="tracking-widest text-xs uppercase font-medium text-gray-400 block mb-1">{t.footer.hours}</span>
                      <span className="text-white text-sm">{t.about.location.hours}</span>
                    </div>
                </li>
                <li className="flex items-center gap-6">
                    <div className="h-1.5 w-1.5 bg-tj-gold rotate-45 shadow-[0_0_5px_rgba(212,175,55,0.8)]"></div>
                    <span className="text-white text-sm">{t.about.location.closed}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

       {/* SECTION 4: Visit Us (Map) */}
       <section className="py-20 bg-tj-dark border-t border-tj-gold/10 relative overflow-hidden">
          <div className="max-w-[1800px] mx-auto px-6">
              <div className="flex flex-col md:flex-row items-start md:items-stretch gap-0 md:gap-12 border border-tj-gold/20">

                  {/* Left: Location Info */}
                  <div className="w-full md:w-1/3 bg-black p-6 md:p-8 flex flex-col justify-center relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-tj-gold"></div>
                      <MapPin className="absolute -right-12 -bottom-12 text-tj-gold/5 w-64 h-64 rotate-12 group-hover:text-tj-gold/10 transition-colors" />

                      <h3 className="text-tj-gold text-xs font-bold tracking-[0.4em] uppercase mb-8 flex items-center gap-2">
                          <MapPin size={14} /> {t.about.location.title}
                      </h3>

                      <div className="space-y-8 relative z-10">
                          <div>
                              <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-2">{t.footer.location}</p>
                              <p className="text-white font-display text-2xl tracking-wide">{t.about.location.address.toUpperCase()}</p>
                              <p className="text-gray-400 font-mono text-sm">{t.about.location.city}</p>
                          </div>

                          <div className="flex items-center gap-2 text-gray-400">
                              <Clock size={14} className="text-tj-gold" />
                              <p className="text-sm">{t.about.location.hours}</p>
                          </div>

                          <div className="flex items-center gap-2 text-gray-400">
                              <Phone size={14} className="text-tj-gold" />
                              <p className="text-sm">{t.about.location.phone}</p>
                          </div>

                          <a
                              href="https://www.google.com/maps/search/?api=1&query=8774+Almeda+Genoa+Road,+Houston,+TX+77075"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-3 bg-white/5 hover:bg-tj-gold text-white hover:text-black px-8 py-4 text-xs uppercase tracking-[0.3em] font-bold transition-all border border-white/10 hover:border-tj-gold"
                          >
                              <Navigation size={16} /> {t.about.location.directions}
                          </a>
                      </div>
                  </div>

                  {/* Right: Interactive Map */}
                  <div className="w-full md:w-2/3 min-h-[300px] md:min-h-[500px] relative bg-gray-900 group">
                       {/* Map skeleton placeholder */}
                       {!mapLoaded && (
                         <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
                           <div className="text-center">
                             <MapPin size={32} className="text-gray-700 mx-auto mb-3 animate-pulse" />
                             <p className="text-gray-400 text-xs uppercase tracking-widest">{t.common.loading}</p>
                           </div>
                         </div>
                       )}

                       <div className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay bg-tj-gold/10 group-hover:bg-transparent transition-colors duration-700"></div>

                       <iframe
                           src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3467.6476078992476!2d-95.23189668456814!3d29.60774498204349!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8640970616297329%3A0x7172801465871632!2s8774%20Almeda%20Genoa%20Rd%2C%20Houston%2C%20TX%2077075!5e0!3m2!1sen!2sus!4v1709664000000!5m2!1sen!2sus"
                           width="100%"
                           height="100%"
                           style={{ border: 0, filter: 'grayscale(100%) invert(92%) contrast(83%)' }}
                           allowFullScreen={true}
                           loading="lazy"
                           referrerPolicy="no-referrer-when-downgrade"
                           className="absolute inset-0 w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                           title="Triple J Auto Investment Location"
                           onLoad={() => setMapLoaded(true)}
                       ></iframe>

                       <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-tj-gold/50 pointer-events-none z-20"></div>
                       <div className="absolute bottom-8 right-8 w-4 h-4 border-b-2 border-r-2 border-tj-gold/50 pointer-events-none z-20"></div>
                  </div>
              </div>
          </div>
       </section>

      {/* CTA */}
      <section className="py-20 md:py-32 bg-tj-green text-center px-4 md:px-6 relative overflow-hidden border-t border-tj-gold/30">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
              <Star className="text-tj-gold fill-tj-gold animate-pulse" size={24} />
          </div>
          <p className="text-tj-gold font-display text-sm tracking-[0.5em] mb-8 uppercase drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">{t.about.hero.badge}</p>
          <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight mb-12 drop-shadow-xl">
            {t.about.cta.title}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-12">
            {t.about.cta.desc}
          </p>

          <div className="inline-block p-0.5 bg-gradient-to-r from-transparent via-tj-gold/50 to-transparent">
            <Link to="/inventory" className="group relative flex items-center gap-4 bg-black border border-tj-gold/50 px-16 py-6 text-xs font-bold tracking-[0.3em] hover:bg-tj-gold hover:text-black transition-all duration-500 shadow-[0_0_30px_rgba(212,175,55,0.15)] hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] uppercase text-white">
              <span className="relative z-10">{t.about.cta.button}</span>
              <ArrowRight size={16} className="relative z-10 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
