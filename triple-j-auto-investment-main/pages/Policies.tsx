import React from 'react';
import { Shield, AlertTriangle, FileText, Scale } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Policies = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16 border-b border-white/10 pb-12">
          <div className="inline-flex items-center gap-2 mb-6 text-tj-gold text-xs uppercase tracking-[0.4em]">
            <Shield size={16} />
            <span>{t.footer.legal}</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display text-white tracking-tight mb-6">
            {t.policies.title}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t.policies.subtitle}
          </p>
        </div>

        {/* AS-IS Policy */}
        <section className="mb-16 bg-red-900/10 border border-red-900/30 p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-500">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-white font-display text-3xl mb-2">{t.policies.asIs.title.toUpperCase()}</h2>
              <p className="text-red-500 text-xs uppercase tracking-widest">{t.policies.asIs.noWarranties} &bull; {t.policies.asIs.noReturns}</p>
            </div>
          </div>
          <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-4">
            <p>
              <strong className="text-white">{t.policies.asIs.mainWarning}</strong>
              {' '}{t.policies.asIs.p1}
            </p>
            <p>
              {t.policies.asIs.p2}
            </p>
            <p className="font-bold text-white">
              {t.policies.asIs.acknowledge}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              {t.policies.asIs.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Payment Policy */}
        <section className="mb-16 bg-tj-dark border border-white/10 p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold">
              <FileText size={32} />
            </div>
            <div>
              <h2 className="text-white font-display text-3xl mb-2">{t.policies.payment.title.toUpperCase()}</h2>
              <p className="text-tj-gold text-xs uppercase tracking-widest">{t.policies.payment.acceptedMethods}</p>
            </div>
          </div>
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-white font-bold mb-2">{t.policies.payment.methodsTitle.toUpperCase()}</h3>
              <ul className="list-disc pl-6 space-y-2">
                {t.policies.payment.methods.map((m, i) => (
                  <li key={i}><strong>{m.method}</strong> {m.detail}</li>
                ))}
              </ul>
            </div>
            <div className="bg-black/50 border border-white/5 p-6">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-tj-gold" />
                {t.policies.payment.deposit.title.toUpperCase()}
              </h3>
              <p className="text-sm">
                {t.policies.payment.deposit.content}
              </p>
            </div>
          </div>
        </section>

        {/* Title & Registration Policy */}
        <section className="mb-16 bg-tj-dark border border-white/10 p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold">
              <Scale size={32} />
            </div>
            <div>
              <h2 className="text-white font-display text-3xl mb-2">{t.policies.titleRegistration.title.toUpperCase()}</h2>
              <p className="text-tj-gold text-xs uppercase tracking-widest">{t.policies.titleRegistration.compliance}</p>
            </div>
          </div>
          <div className="space-y-6 text-gray-300">
            <p>
              {t.policies.titleRegistration.introBefore} <strong className="text-white">{t.policies.titleRegistration.introHighlight}</strong> {t.policies.titleRegistration.introAfter}
            </p>
            <div>
              <h3 className="text-white font-bold mb-2">{t.policies.titleRegistration.buyerTitle.toUpperCase()}</h3>
              <ul className="list-disc pl-6 space-y-2">
                {t.policies.titleRegistration.buyerItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-black/50 border border-white/5 p-6">
              <p className="text-sm">
                <strong className="text-white">{t.policies.titleRegistration.outOfStateLabel}</strong> {t.policies.titleRegistration.outOfState}
              </p>
            </div>
          </div>
        </section>

        {/* Inspection & Test Drive Policy */}
        <section className="mb-16 bg-tj-dark border border-white/10 p-6 md:p-8">
          <h2 className="text-white font-display text-3xl mb-6">{t.policies.inspection.title.toUpperCase()}</h2>
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-white font-bold mb-2">{t.policies.inspection.prePurchaseTitle.toUpperCase()}</h3>
              <p>
                {t.policies.inspection.prePurchaseContent}
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-2">{t.policies.inspection.testDriveTitle.toUpperCase()}</h3>
              <ul className="list-disc pl-6 space-y-2">
                {t.policies.inspection.testDriveItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Privacy & Data Policy */}
        <section className="mb-16 bg-tj-dark border border-white/10 p-6 md:p-8">
          <h2 className="text-white font-display text-3xl mb-6">{t.policies.privacy.title.toUpperCase()}</h2>
          <div className="space-y-4 text-gray-300">
            <p>{t.policies.privacy.content}</p>
            <p className="text-sm text-gray-400">
              {t.policies.privacyConsent}
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="bg-black border border-white/10 p-6 md:p-8 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">{t.legal.disclaimer.title}</p>
          <p className="text-gray-400 text-sm leading-relaxed max-w-3xl mx-auto">
            {t.policies.terms.content}
          </p>
          <p className="text-gray-400 text-xs mt-4">
            {t.footer.dealerLicense}: <strong className="text-white">P171632</strong>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Policies;
