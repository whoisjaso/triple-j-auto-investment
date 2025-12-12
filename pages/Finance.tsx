import React, { useState } from 'react';
import { DollarSign, Calculator, Shield, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { useStore } from '../context/Store';

const Finance = () => {
  const { addLead } = useStore();
  const [form, setForm] = useState({
    name: '', phone: '', email: '', vehicleInterest: '',
    estimatedPrice: '', downPayment: '', creditScore: 'good'
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    setTimeout(() => {
      addLead({
        id: Math.random().toString(36).substr(2, 9),
        name: form.name,
        email: form.email,
        phone: form.phone,
        interest: `Financing Inquiry: ${form.vehicleInterest} - Est. $${form.estimatedPrice}`,
        date: new Date().toISOString(),
        status: 'New'
      });
      setStatus('submitted');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 mb-6 text-tj-gold text-xs uppercase tracking-[0.4em]">
            <DollarSign size={16} />
            <span>Capital Strategies</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display text-white tracking-tight mb-6">
            FINANCING
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Strategic capital deployment. Partner lenders provide competitive rates for qualified buyers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">

          {/* Benefit 1 */}
          <div className="bg-tj-dark border border-white/10 p-8 hover:border-tj-gold/50 transition-all">
            <div className="w-12 h-12 bg-tj-gold/10 border border-tj-gold/30 flex items-center justify-center mb-6 text-tj-gold">
              <Calculator size={24} />
            </div>
            <h3 className="text-white font-display text-xl mb-3">Transparent Terms</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              No hidden fees. No balloon payments. Clear APR disclosure before commitment.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="bg-tj-dark border border-white/10 p-8 hover:border-tj-gold/50 transition-all">
            <div className="w-12 h-12 bg-tj-gold/10 border border-tj-gold/30 flex items-center justify-center mb-6 text-tj-gold">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-white font-display text-xl mb-3">Flexible Terms</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              24 to 72-month terms available. Early payoff accepted without penalty.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="bg-tj-dark border border-white/10 p-8 hover:border-tj-gold/50 transition-all">
            <div className="w-12 h-12 bg-tj-gold/10 border border-tj-gold/30 flex items-center justify-center mb-6 text-tj-gold">
              <Shield size={24} />
            </div>
            <h3 className="text-white font-display text-xl mb-3">Credit Tiers Accepted</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Prime, near-prime, and select subprime profiles considered based on vehicle and down payment.
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Application Form */}
          <div className="bg-tj-dark border border-white/10 p-12">
            <div className="absolute top-0 left-0 w-full h-1 bg-tj-gold"></div>

            {status === 'submitted' ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto border border-tj-gold rounded-full flex items-center justify-center mb-6 bg-tj-gold/10">
                  <CheckCircle className="text-tj-gold" size={40} />
                </div>
                <h3 className="text-2xl font-display text-white mb-4">APPLICATION RECEIVED</h3>
                <p className="text-gray-400 mb-8">
                  Our financing partner will contact you within 24 hours with pre-qualification results.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-white font-display text-2xl mb-2">FINANCING PRE-QUALIFICATION</h2>
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-8">Soft credit inquiry only</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Full Name</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Phone</label>
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Vehicle of Interest</label>
                    <input
                      required
                      type="text"
                      value={form.vehicleInterest}
                      onChange={e => setForm({...form, vehicleInterest: e.target.value})}
                      placeholder="e.g., 2021 G-Wagon or VIN"
                      className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Estimated Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          required
                          type="number"
                          value={form.estimatedPrice}
                          onChange={e => setForm({...form, estimatedPrice: e.target.value})}
                          className="w-full bg-black border border-gray-700 p-4 pl-8 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Down Payment</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          required
                          type="number"
                          value={form.downPayment}
                          onChange={e => setForm({...form, downPayment: e.target.value})}
                          className="w-full bg-black border border-gray-700 p-4 pl-8 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Credit Profile (Estimate)</label>
                    <select
                      value={form.creditScore}
                      onChange={e => setForm({...form, creditScore: e.target.value})}
                      className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors appearance-none"
                    >
                      <option value="excellent">Excellent (750+)</option>
                      <option value="good">Good (700-749)</option>
                      <option value="fair">Fair (650-699)</option>
                      <option value="poor">Below 650</option>
                    </select>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4 text-xs text-gray-400">
                    <p className="mb-2">
                      <AlertTriangle size={14} className="inline mr-2 text-tj-gold" />
                      By submitting, you authorize a soft credit inquiry which does not impact your credit score.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full bg-tj-gold text-black font-bold py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {status === 'submitting' ? 'PROCESSING...' : 'SUBMIT PRE-QUALIFICATION'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="space-y-8">

            {/* Requirements */}
            <div className="bg-black border border-white/10 p-8">
              <h3 className="text-white font-display text-xl mb-6 flex items-center gap-2">
                <CheckCircle size={20} className="text-tj-gold" />
                REQUIREMENTS
              </h3>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-tj-gold">•</span>
                  <span>Valid driver's license or government-issued ID</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-tj-gold">•</span>
                  <span>Proof of income (pay stubs or bank statements)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-tj-gold">•</span>
                  <span>Proof of residence (utility bill or lease agreement)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-tj-gold">•</span>
                  <span>Insurance coverage confirmation</span>
                </li>
              </ul>
            </div>

            {/* Rates */}
            <div className="bg-black border border-white/10 p-8">
              <h3 className="text-white font-display text-xl mb-6">ESTIMATED RATES</h3>
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs uppercase tracking-widest text-gray-500">Excellent Credit</span>
                    <span className="text-tj-gold font-mono text-lg">4.9% - 6.9%</span>
                  </div>
                  <p className="text-xs text-gray-600">750+ score, 20%+ down</p>
                </div>
                <div className="border-b border-white/5 pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs uppercase tracking-widest text-gray-500">Good Credit</span>
                    <span className="text-white font-mono text-lg">7.9% - 10.9%</span>
                  </div>
                  <p className="text-xs text-gray-600">700-749 score, 15%+ down</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs uppercase tracking-widest text-gray-500">Fair Credit</span>
                    <span className="text-white font-mono text-lg">11.9% - 16.9%</span>
                  </div>
                  <p className="text-xs text-gray-600">650-699 score, 25%+ down required</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-6">
                *Rates subject to change. Final APR determined by lender based on full credit profile.
              </p>
            </div>

            {/* Warning */}
            <div className="bg-red-900/10 border border-red-900/30 p-6">
              <h4 className="text-red-500 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle size={16} />
                Important Notice
              </h4>
              <p className="text-gray-400 text-xs leading-relaxed">
                Financing is subject to approval by third-party lenders. Triple J Auto Investment does not provide direct financing. We are a dealership, not a bank.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Finance;
