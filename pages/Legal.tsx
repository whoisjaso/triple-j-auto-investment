import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, FileText, Scale, Lock, Building2 } from 'lucide-react';

const Legal = () => {
  const { section } = useParams();
  
  const contentMap: Record<string, { title: string; icon: React.ElementType }> = {
    'dmv': { title: 'Texas DMV Information', icon: Building2 },
    'doc-fee': { title: 'Documentary Fee Disclosure', icon: FileText },
    'title-policy': { title: 'Title & Identity Policy', icon: ShieldCheck },
    'returns': { title: 'Returns & Deposits', icon: Scale },
    'arbitration': { title: 'Arbitration Agreement', icon: Scale },
    'privacy': { title: 'Privacy Policy', icon: Lock },
    'terms': { title: 'Terms & Conditions', icon: FileText }
  };

  const data = section && contentMap[section] ? contentMap[section] : { title: 'Legal Document', icon: FileText };
  const Icon = data.icon;

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-tj-gold text-xs uppercase tracking-widest mb-12 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Return to Base
        </Link>

        <div className="bg-tj-dark border border-white/10 p-12 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-tj-gold"></div>
           
           <div className="flex items-center gap-6 mb-10 border-b border-white/5 pb-10">
             <div className="p-4 bg-black border border-tj-gold/30 text-tj-gold">
               <Icon size={32} />
             </div>
             <div>
               <p className="text-gray-500 text--[10px] uppercase tracking-[0.3em] mb-2">Compliance & Legal</p>
               <h1 className="font-display text-3xl text-white tracking-wide">{data.title}</h1>
             </div>
           </div>

           <div className="prose prose-invert max-w-none">
             <p className="text-lg text-gray-300 leading-relaxed mb-8 font-serif italic">
               "Compliance is the foundation of sovereignty. We operate with absolute precision within the legal framework of the State of Texas."
             </p>
             
             <div className="p-6 bg-black/50 border-l-2 border-tj-gold text-sm text-gray-400">
               <p className="mb-4 uppercase tracking-widest text-xs font-bold text-tj-gold">Official Notice</p>
               <p className="mb-4">
                 This legal document serves as an official disclosure for Triple J Auto Investment. 
                 For immediate inquiries regarding {data.title}, please contact our headquarters directly.
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Headquarters</p>
                    <p className="text-white">8774 Almeda Genoa Road<br/>Houston, Texas 77075</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Dealer License</p>
                    <p className="text-white font-mono">P171632</p>
                  </div>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Legal;