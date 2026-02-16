import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calculator, Shield, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { useStore } from '../context/Store';
import { useLanguage } from '../context/LanguageContext';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

const Finance = () => {
  const { addLead } = useStore();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '', phone: '', email: '', vehicleInterest: '',
    estimatedPrice: '', downPayment: '', creditScore: 'good'
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      await addLead({
        id: Math.random().toString(36).substr(2, 9),
        name: form.name,
        email: form.email,
        phone: form.phone,
        interest: `Financing Inquiry: ${form.vehicleInterest} - Est. $${form.estimatedPrice}`,
        date: new Date().toISOString(),
        status: 'New'
      });
      setStatus('submitted');
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            className="inline-flex items-center gap-2 mb-6 text-tj-gold text-xs uppercase tracking-[0.4em]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DollarSign size={16} />
            <span>{t.finance.badge}</span>
          </motion.div>
          <motion.h1
            className="text-6xl md:text-8xl font-display text-white tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {t.finance.title}
          </motion.h1>
          <motion.p
            className="text-gray-400 text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t.finance.subtitle}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">

          {/* Benefit 1 */}
          <motion.div className="bg-tj-dark border border-white/10 p-6 md:p-8 hover:border-tj-gold/50 transition-all" variants={fadeUp} custom={0} initial="hidden" animate="visible">
            <div className="w-12 h-12 bg-tj-gold/10 border border-tj-gold/30 flex items-center justify-center mb-6 text-tj-gold">
              <Calculator size={24} />
            </div>
            <h3 className="text-white font-display text-xl mb-3">{t.finance.options.step1Title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t.finance.options.step1Desc}
            </p>
          </motion.div>

          {/* Benefit 2 */}
          <motion.div className="bg-tj-dark border border-white/10 p-6 md:p-8 hover:border-tj-gold/50 transition-all" variants={fadeUp} custom={1} initial="hidden" animate="visible">
            <div className="w-12 h-12 bg-tj-gold/10 border border-tj-gold/30 flex items-center justify-center mb-6 text-tj-gold">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-white font-display text-xl mb-3">{t.finance.options.step2Title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t.finance.options.step2Desc}
            </p>
          </motion.div>

          {/* Benefit 3 */}
          <motion.div className="bg-tj-dark border border-white/10 p-6 md:p-8 hover:border-tj-gold/50 transition-all" variants={fadeUp} custom={2} initial="hidden" animate="visible">
            <div className="w-12 h-12 bg-tj-gold/10 border border-tj-gold/30 flex items-center justify-center mb-6 text-tj-gold">
              <Shield size={24} />
            </div>
            <h3 className="text-white font-display text-xl mb-3">{t.finance.options.step3Title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t.finance.options.step3Desc}
            </p>
          </motion.div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Application Form */}
          <motion.div
            className="bg-tj-dark border border-white/10 p-6 md:p-8 relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-tj-gold"></div>

            {status === 'submitted' ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto border border-tj-gold rounded-full flex items-center justify-center mb-6 bg-tj-gold/10">
                  <CheckCircle className="text-tj-gold" size={40} />
                </div>
                <h3 className="text-2xl font-display text-white mb-4">{t.contact.form.sent}</h3>
                <p className="text-gray-400 mb-8">
                  {t.finance.cta.desc}
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors"
                >
                  {t.contact.form.reset}
                </button>
              </div>
            ) : status === 'error' ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto border border-red-500/30 rounded-full flex items-center justify-center mb-6 bg-red-900/10">
                  <AlertTriangle className="text-red-400" size={40} />
                </div>
                <h3 className="text-2xl font-display text-white mb-4">{t.polish.errorFormSubmit}</h3>
                <p className="text-gray-400 mb-2">
                  {t.polish.errorCallUs}{' '}
                  <a href="tel:+18324009760" className="text-tj-gold hover:text-white transition-colors">{t.common.phone}</a>
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-xs uppercase tracking-[0.3em] bg-tj-gold text-black hover:bg-white px-8 py-4 transition-all font-bold"
                >
                  {t.polish.errorTryAgain}
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-white font-display text-2xl mb-2">{t.finance.options.title}</h2>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-8">{t.finance.intro}</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t.contact.form.name}</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t.contact.form.phone}</label>
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t.contact.form.email}</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t.inventory.modal.form.name}</label>
                    <input
                      required
                      type="text"
                      value={form.vehicleInterest}
                      onChange={e => setForm({...form, vehicleInterest: e.target.value})}
                      placeholder={t.finance.form.vehiclePlaceholder}
                      className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t.common.price}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                          required
                          type="number"
                          value={form.estimatedPrice}
                          onChange={e => setForm({...form, estimatedPrice: e.target.value})}
                          className="w-full bg-black border border-gray-700 p-4 pl-8 text-white text-sm focus:border-tj-gold outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t.finance.form.downPayment}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                          required
                          type="number"
                          value={form.downPayment}
                          onChange={e => setForm({...form, downPayment: e.target.value})}
                          className="w-full bg-black border border-gray-700 p-4 pl-8 text-white text-sm focus:border-tj-gold outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t.finance.form.creditProfile}</label>
                    <select
                      value={form.creditScore}
                      onChange={e => setForm({...form, creditScore: e.target.value})}
                      className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors appearance-none"
                    >
                      <option value="excellent">{t.finance.form.creditExcellent}</option>
                      <option value="good">{t.finance.form.creditGood}</option>
                      <option value="fair">{t.finance.form.creditFair}</option>
                      <option value="poor">{t.finance.form.creditPoor}</option>
                    </select>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4 text-xs text-gray-400">
                    <p className="mb-2">
                      <AlertTriangle size={14} className="inline mr-2 text-tj-gold" />
                      {t.finance.form.softInquiryNotice}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full bg-tj-gold text-black font-bold py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {status === 'submitting' ? t.contact.form.submitting : t.inventory.modal.submit}
                  </button>
                </form>
              </>
            )}
          </motion.div>

          {/* Info Sidebar */}
          <div className="space-y-8">

            {/* Requirements */}
            <motion.div className="bg-black border border-white/10 p-6 md:p-8" variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
              <h3 className="text-white font-display text-xl mb-6 flex items-center gap-2">
                <CheckCircle size={20} className="text-tj-gold" />
                {t.finance.requirements.title.toUpperCase()}
              </h3>
              <ul className="space-y-4 text-gray-400 text-sm">
                {t.finance.requirements.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-tj-gold">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Rates */}
            <motion.div className="bg-black border border-white/10 p-6 md:p-8" variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
              <h3 className="text-white font-display text-xl mb-6">{t.finance.rates.title.toUpperCase()}</h3>
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs uppercase tracking-widest text-gray-400">{t.finance.rates.excellent.label}</span>
                    <span className="text-tj-gold font-mono text-lg">{t.finance.rates.excellent.rate}</span>
                  </div>
                  <p className="text-xs text-gray-400">{t.finance.rates.excellent.detail}</p>
                </div>
                <div className="border-b border-white/5 pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs uppercase tracking-widest text-gray-400">{t.finance.rates.good.label}</span>
                    <span className="text-white font-mono text-lg">{t.finance.rates.good.rate}</span>
                  </div>
                  <p className="text-xs text-gray-400">{t.finance.rates.good.detail}</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs uppercase tracking-widest text-gray-400">{t.finance.rates.fair.label}</span>
                    <span className="text-white font-mono text-lg">{t.finance.rates.fair.rate}</span>
                  </div>
                  <p className="text-xs text-gray-400">{t.finance.rates.fair.detail}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-6">
                {t.finance.rates.disclaimer}
              </p>
            </motion.div>

            {/* Warning */}
            <motion.div className="bg-red-900/10 border border-red-900/30 p-6" variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
              <h4 className="text-red-500 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle size={16} />
                {t.finance.importantNotice.title}
              </h4>
              <p className="text-gray-400 text-xs leading-relaxed">
                {t.finance.importantNotice.content}
              </p>
            </motion.div>

          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-white font-display text-2xl mb-4">{t.finance.cta.title}</h3>
          <p className="text-gray-400 mb-4">{t.finance.cta.desc}</p>
          <p className="text-tj-gold text-sm mb-6">{t.finance.cta.phone}</p>
          <a
            href="/contact"
            className="inline-block bg-tj-gold text-black font-bold px-8 py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-colors"
          >
            {t.finance.cta.button}
          </a>
        </motion.div>

      </div>
    </div>
  );
};

export default Finance;
