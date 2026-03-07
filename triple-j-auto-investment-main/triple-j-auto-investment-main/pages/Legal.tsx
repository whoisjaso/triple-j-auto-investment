import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, FileText, Scale, Lock, Building2, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';

const Legal = () => {
  const { section } = useParams();
  const { t } = useLanguage();

  const contentMap: Record<string, { title: string; icon: LucideIcon }> = {
    'dmv': { title: 'Texas DMV Information', icon: Building2 },
    'doc-fee': { title: 'Documentary Fee Disclosure', icon: FileText },
    'title-policy': { title: 'Title & Identity Policy', icon: ShieldCheck },
    'returns': { title: 'Returns & Deposits', icon: Scale },
    'arbitration': { title: 'Arbitration Agreement', icon: Scale },
    'privacy': { title: t.policies.privacy.title, icon: Lock },
    'terms': { title: t.policies.terms.title, icon: FileText }
  };

  const data: { title: string; icon: LucideIcon } = section && contentMap[section] ? contentMap[section] : { title: t.legal.title, icon: FileText };
  const Icon = data.icon;

  return (
    <>
    <SEO
      title={`${data.title} | Triple J Auto Investment`}
      description="Legal information and policies for Triple J Auto Investment. Houston TX dealer, License P171632."
      path={`/legal/${section || ''}`}
    />
    <div className="min-h-screen bg-black pt-40 pb-20 px-4 md:px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-tj-gold text-xs uppercase tracking-widest mb-12 hover:text-white transition-colors">
          <ArrowLeft size={14} /> {t.legal.backToHome}
        </Link>

        <div className="bg-tj-dark border border-white/10 p-6 md:p-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-tj-gold"></div>

           <div className="flex items-center gap-6 mb-10 border-b border-white/5 pb-10">
             <div className="p-4 bg-black border border-tj-gold/30 text-tj-gold">
               <Icon size={32} />
             </div>
             <div>
               <p className="text-gray-400 text-[10px] uppercase tracking-[0.3em] mb-2">{t.legal.subtitle}</p>
               <h1 className="font-display text-3xl text-white tracking-wide">{data.title}</h1>
             </div>
           </div>

           <div className="prose prose-invert max-w-none">
             <div className="p-6 bg-black/50 border-l-2 border-tj-gold text-sm text-gray-400">
               <p className="mb-4 uppercase tracking-widest text-xs font-bold text-tj-gold">{t.legal.disclaimer.title}</p>
               <p className="mb-4">
                 {t.legal.disclaimer.content}
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{t.footer.location}</p>
                    <p className="text-white">{t.legal.dealerInfo.address}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{t.footer.dealerLicense}</p>
                    <p className="text-white font-mono">P171632</p>
                  </div>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Legal;
