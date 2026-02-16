import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, FileText, Car, CreditCard, ArrowRight, Key } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const serviceIcons = [Car, Key, Search, CreditCard, FileText];
const serviceLinks = ['/inventory', '/contact', '/vin', '/finance', '/contact'];
const serviceCtas = ['viewInventory', 'contactUs', 'learnMore', 'learnMore', 'contactUs'] as const;

const Services = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-20 border-b border-white/10 pb-12">
          <div className="inline-flex items-center gap-2 mb-6 text-tj-gold text-xs uppercase tracking-[0.4em]">
            <Shield size={16} />
            <span>{t.services.badge}</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display text-white tracking-tight mb-6">
            {t.services.title}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t.services.subtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {t.services.list.map((service: { title: string; desc: string; detail: string }, idx: number) => {
            const IconComponent = serviceIcons[idx] || Shield;
            const link = serviceLinks[idx] || '/contact';
            const ctaKey = serviceCtas[idx] || 'learnMore';
            const ctaText = (t.common as Record<string, string>)[ctaKey] || t.services.learnMore;

            return (
              <div key={idx} className="bg-tj-dark border border-white/10 p-6 sm:p-10 hover:border-tj-gold/50 transition-all duration-500 group">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-4 bg-black border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                    <IconComponent size={32} />
                  </div>
                  <div>
                    <h3 className="text-white font-display text-2xl mb-2">{service.title}</h3>
                  </div>
                </div>
                <p className="text-gray-400 leading-relaxed mb-4">
                  {service.desc}
                </p>
                <p className="text-gray-500 leading-relaxed mb-6 text-sm">
                  {service.detail}
                </p>
                <Link to={link} className="text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
                  {ctaText} <ArrowRight size={12} />
                </Link>
              </div>
            );
          })}
        </div>

        {/* What We Don't Do */}
        <div className="bg-red-900/10 border border-red-900/30 p-6 sm:p-12">
          <h2 className="text-white font-display text-3xl mb-8 flex items-center gap-3">
            <span className="text-red-500">&#9888;</span> {t.services.dontDo.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-400">
            {t.services.dontDo.items.map((item: { title: string; desc: string }, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-red-500 text-2xl">&times;</span>
                <div>
                  <h4 className="text-white font-bold mb-1">{item.title}</h4>
                  <p className="text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Services;
