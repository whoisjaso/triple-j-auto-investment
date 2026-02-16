import React from 'react';
import { DollarSign, CreditCard, Banknote, Building2, Shield, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PaymentOptions = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16 border-b border-white/10 pb-12">
          <div className="inline-flex items-center gap-2 mb-6 text-tj-gold text-xs uppercase tracking-[0.4em]">
            <DollarSign size={16} />
            <span>{t.paymentOptions.badge}</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display text-white tracking-tight mb-6">
            {t.paymentOptions.title}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t.paymentOptions.subtitle}
          </p>
        </div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">

          {/* Cash */}
          <div className="bg-tj-dark border border-white/10 p-10 hover:border-tj-gold/50 transition-all group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                <Banknote size={32} />
              </div>
              <div>
                <h3 className="text-white font-display text-2xl mb-2">{t.paymentOptions.methods.cash}</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">{t.paymentOptions.methods.cashDesc}</p>
              </div>
            </div>
            <div className="space-y-4 text-gray-400">
              <div className="bg-black/50 border border-white/5 p-4">
                <h4 className="text-white text-sm font-bold mb-2 flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  ADVANTAGES
                </h4>
                <ul className="text-xs space-y-1">
                  <li>&bull; Same-day pickup</li>
                  <li>&bull; No financing fees or interest</li>
                  <li>&bull; Strongest negotiating position</li>
                  <li>&bull; No credit check required</li>
                </ul>
              </div>
              <div className="text-xs text-gray-600">
                <strong className="text-white">Note:</strong> Transactions over $10,000 require IRS Form 8300 reporting.
              </div>
            </div>
          </div>

          {/* Cashier's Check */}
          <div className="bg-tj-dark border border-white/10 p-10 hover:border-tj-gold/50 transition-all group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                <FileText size={32} />
              </div>
              <div>
                <h3 className="text-white font-display text-2xl mb-2">{t.paymentOptions.methods.cashiers}</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">{t.paymentOptions.methods.cashiersDesc}</p>
              </div>
            </div>
            <div className="space-y-4 text-gray-400">
              <div className="bg-black/50 border border-white/5 p-4">
                <h4 className="text-white text-sm font-bold mb-2">REQUIREMENTS</h4>
                <ul className="text-xs space-y-1">
                  <li>&bull; Must be from a US-based bank</li>
                  <li>&bull; Made payable to "Triple J Auto Investment"</li>
                  <li>&bull; Subject to bank verification call</li>
                  <li>&bull; Bring valid government-issued ID</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Debit Card */}
          <div className="bg-tj-dark border border-white/10 p-10 hover:border-tj-gold/50 transition-all group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                <CreditCard size={32} />
              </div>
              <div>
                <h3 className="text-white font-display text-2xl mb-2">{t.paymentOptions.methods.debit}</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">{t.paymentOptions.methods.debitDesc}</p>
              </div>
            </div>
            <div className="space-y-4 text-gray-400">
              <div className="bg-black/50 border border-white/5 p-4">
                <h4 className="text-white text-sm font-bold mb-2">DETAILS</h4>
                <ul className="text-xs space-y-1">
                  <li>&bull; Accepted for deposits and partial payments</li>
                  <li>&bull; Daily limits may apply per your bank</li>
                  <li>&bull; PIN or signature authorization</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Financing */}
          <div className="bg-tj-dark border border-white/10 p-10 hover:border-tj-gold/50 transition-all group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                <Building2 size={32} />
              </div>
              <div>
                <h3 className="text-white font-display text-2xl mb-2">{t.paymentOptions.methods.financing}</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">{t.paymentOptions.methods.financingDesc}</p>
              </div>
            </div>
            <div className="space-y-4 text-gray-400">
              <div className="bg-black/50 border border-white/5 p-4">
                <h4 className="text-white text-sm font-bold mb-2">REQUIREMENTS</h4>
                <ul className="text-xs space-y-1">
                  <li>&bull; Credit score 580+ (minimum)</li>
                  <li>&bull; Proof of income and residence</li>
                  <li>&bull; Valid insurance coverage</li>
                  <li>&bull; Down payment 10-25% (score dependent)</li>
                </ul>
              </div>
              <a href="/finance" className="inline-block text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors">
                {t.common.learnMore} &rarr;
              </a>
            </div>
          </div>

        </div>

        {/* Personal Check Warning */}
        <div className="bg-yellow-900/10 border border-yellow-900/30 p-8 mb-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-yellow-500 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-yellow-500 font-bold text-sm uppercase tracking-widest mb-2">
                PERSONAL CHECKS ACCEPTED WITH HOLD
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We accept personal checks, but vehicle release is delayed <strong className="text-white">3-5 business days</strong> for bank clearance.
                If immediate pickup is required, use cash, cashier's check, or debit card instead.
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-black border border-white/10 p-8">
          <div className="flex items-start gap-4">
            <Shield className="text-tj-gold flex-shrink-0" size={24} />
            <div>
              <h3 className="text-white font-bold mb-3">{t.paymentOptions.fraud.title.toUpperCase()}</h3>
              <div className="text-gray-400 text-sm space-y-2">
                <p>{t.paymentOptions.fraud.content}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">
            {t.paymentOptions.note}
          </p>
          <a
            href="/contact"
            className="inline-block bg-tj-gold text-black font-bold px-8 py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-colors"
          >
            {t.common.contactUs.toUpperCase()}
          </a>
        </div>

      </div>
    </div>
  );
};

export default PaymentOptions;
