import React from 'react';
import { DollarSign, CreditCard, Banknote, Building2, Shield, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

const PaymentOptions = () => {
  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16 border-b border-white/10 pb-12">
          <div className="inline-flex items-center gap-2 mb-6 text-tj-gold text-xs uppercase tracking-[0.4em]">
            <DollarSign size={16} />
            <span>Financial Instruments</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display text-white tracking-tight mb-6">
            PAYMENT OPTIONS
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Multiple paths to acquisition. Choose the method that aligns with your capital strategy.
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
                <h3 className="text-white font-display text-2xl mb-2">Cash Payment</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">Instant Settlement</p>
              </div>
            </div>
            <div className="space-y-4 text-gray-400">
              <p className="leading-relaxed">
                The most direct path. Immediate vehicle release upon payment verification.
              </p>
              <div className="bg-black/50 border border-white/5 p-4">
                <h4 className="text-white text-sm font-bold mb-2 flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  ADVANTAGES
                </h4>
                <ul className="text-xs space-y-1">
                  <li>• Same-day pickup</li>
                  <li>• No financing fees or interest</li>
                  <li>• Strongest negotiating position</li>
                  <li>• No credit check required</li>
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
                <h3 className="text-white font-display text-2xl mb-2">Cashier's Check</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">Bank-Verified</p>
              </div>
            </div>
            <div className="space-y-4 text-gray-400">
              <p className="leading-relaxed">
                Secure bank-issued instrument. Verified same-day release.
              </p>
              <div className="bg-black/50 border border-white/5 p-4">
                <h4 className="text-white text-sm font-bold mb-2">REQUIREMENTS</h4>
                <ul className="text-xs space-y-1">
                  <li>• Must be from a US-based bank</li>
                  <li>• Made payable to "Triple J Auto Investment"</li>
                  <li>• Subject to bank verification call</li>
                  <li>• Bring valid government-issued ID</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Wire Transfer */}
          <div className="bg-tj-dark border border-white/10 p-10 hover:border-tj-gold/50 transition-all group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                <Building2 size={32} />
              </div>
              <div>
                <h3 className="text-white font-display text-2xl mb-2">Wire Transfer</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">Electronic Settlement</p>
              </div>
            </div>
            <div className="space-y-4 text-gray-400">
              <p className="leading-relaxed">
                Preferred for high-value transactions. Instant confirmation, immediate release.
              </p>
              <div className="bg-black/50 border border-white/5 p-4">
                <h4 className="text-white text-sm font-bold mb-2">WIRE INSTRUCTIONS</h4>
                <p className="text-xs mb-3">Contact us for secure wire transfer details. Instructions sent via encrypted email.</p>
                <div className="text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500">Processing Time:</span>
                    <span className="text-white">Same Business Day</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Typical Fee:</span>
                    <span className="text-white">$15-$30 (Bank Dependent)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financing */}
          <div className="bg-tj-dark border border-white/10 p-10 hover:border-tj-gold/50 transition-all group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                <CreditCard size={32} />
              </div>
              <div>
                <h3 className="text-white font-display text-2xl mb-2">Financing</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">Third-Party Lenders</p>
              </div>
            </div>
            <div className="space-y-4 text-gray-400">
              <p className="leading-relaxed">
                Strategic capital deployment through approved lenders. Terms: 24-72 months.
              </p>
              <div className="bg-black/50 border border-white/5 p-4">
                <h4 className="text-white text-sm font-bold mb-2">APPROVAL REQUIREMENTS</h4>
                <ul className="text-xs space-y-1">
                  <li>• Credit score 580+ (minimum)</li>
                  <li>• Proof of income and residence</li>
                  <li>• Valid insurance coverage</li>
                  <li>• Down payment 10-25% (score dependent)</li>
                </ul>
              </div>
              <a href="/finance" className="inline-block text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors">
                Apply for Pre-Qualification →
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
                If immediate pickup is required, use cash, cashier's check, or wire transfer instead.
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-black border border-white/10 p-8">
          <div className="flex items-start gap-4">
            <Shield className="text-tj-gold flex-shrink-0" size={24} />
            <div>
              <h3 className="text-white font-bold mb-3">SECURITY & FRAUD PROTECTION</h3>
              <div className="text-gray-400 text-sm space-y-2">
                <p>
                  • All large transactions are verified through banking institutions
                </p>
                <p>
                  • We will <strong className="text-white">never</strong> ask you to wire money to a personal account
                </p>
                <p>
                  • If you receive suspicious payment requests claiming to be from Triple J, contact us immediately at <a href="tel:+18327777580" className="text-tj-gold hover:text-white transition-colors">+1 (832) 777-7580</a>
                </p>
                <p>
                  • All wire instructions are sent via encrypted email from <strong className="text-white">@triplejautoinvestment.com</strong> domain only
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <h3 className="text-white font-display text-2xl mb-4">QUESTIONS ABOUT PAYMENT?</h3>
          <p className="text-gray-400 mb-6">
            Contact us to discuss payment arrangements for your specific situation.
          </p>
          <a
            href="/contact"
            className="inline-block bg-tj-gold text-black font-bold px-8 py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-colors"
          >
            CONTACT HEADQUARTERS
          </a>
        </div>

      </div>
    </div>
  );
};

export default PaymentOptions;
