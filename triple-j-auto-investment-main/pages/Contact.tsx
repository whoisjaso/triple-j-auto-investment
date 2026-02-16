import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, MessageSquare, AlertTriangle } from 'lucide-react';
import { useStore } from '../context/Store';
import { openSmartMap } from '../App';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

const Contact = () => {
  const { addLead } = useStore();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      await addLead({
        id: Math.random().toString(36).substr(2, 9),
        name: form.name,
        email: form.email,
        phone: form.phone,
        interest: `General Inquiry: ${form.message}`,
        date: new Date().toISOString(),
        status: 'New'
      });
      setStatus('sent');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <>
    <SEO
      title="Contact Triple J Auto Investment | Houston Car Dealer | (832) 400-9760"
      description="Visit Triple J Auto Investment at 8774 Almeda Genoa Rd, Houston TX 77075. Call (832) 400-9760. Open Mon-Sat 9AM-6PM. Se habla espanol. Sales and rental inquiries welcome."
      path="/contact"
    />
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
            <MessageSquare size={16} />
            <span>{t.contact.subtitle}</span>
          </motion.div>
          <motion.h1
            className="text-6xl md:text-8xl font-display text-white tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {t.contact.title}
          </motion.h1>
          <motion.p
            className="text-gray-400 text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t.contact.desc}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Contact Form */}
          <motion.div
            className="bg-tj-dark border border-white/10 p-6 md:p-8 relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-tj-gold"></div>

            {status === 'sent' ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto border border-tj-gold rounded-full flex items-center justify-center mb-6 bg-tj-gold/10">
                  <CheckCircle className="text-tj-gold" size={40} />
                </div>
                <h3 className="text-2xl font-display text-white mb-4">{t.contact.form.sent}</h3>
                <p className="text-gray-400 mb-8">
                  {t.contact.form.sentDesc}
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t.contact.form.name}</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors"
                    placeholder={t.contact.form.placeholders.name}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t.contact.form.phone}</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors"
                    placeholder={t.contact.form.placeholders.phone}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t.contact.form.email}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors"
                    placeholder={t.contact.form.placeholders.email}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t.contact.form.message}</label>
                  <textarea
                    required
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors"
                    placeholder={t.contact.form.placeholders.message}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-tj-gold text-black font-bold py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {status === 'sending' ? t.contact.form.submitting : (
                    <>
                      <Send size={16} />
                      <span>{t.contact.form.submit}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact Info */}
          <motion.div className="space-y-8">

            {/* Headquarters */}
            <motion.div
              className="bg-black border border-white/10 p-6 md:p-8 hover:border-tj-gold/50 transition-colors group"
              variants={fadeUp}
              custom={0}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">{t.contact.info.hq}</h3>
                  <p className="text-gray-400 text-sm uppercase tracking-widest">{t.contact.info.location}</p>
                </div>
              </div>
              <address className="not-italic text-gray-300 mb-4">
                8774 Almeda Genoa Road<br />
                Houston, Texas 77075<br />
                United States
              </address>
              <button
                onClick={openSmartMap}
                className="text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
              >
                {t.contact.info.openNav} <span>→</span>
              </button>
            </motion.div>

            {/* Phone */}
            <motion.div
              className="bg-black border border-white/10 p-6 md:p-8 hover:border-tj-gold/50 transition-colors group"
              variants={fadeUp}
              custom={1}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">{t.contact.info.directLine}</h3>
                  <p className="text-gray-400 text-sm uppercase tracking-widest">{t.contact.info.voice}</p>
                </div>
              </div>
              <a href="tel:+18324009760" className="text-white text-2xl font-mono hover:text-tj-gold transition-colors block">
                +1 (832) 400-9760
              </a>
            </motion.div>

            {/* Hours */}
            <motion.div
              className="bg-black border border-white/10 p-6 md:p-8 hover:border-tj-gold/50 transition-colors group"
              variants={fadeUp}
              custom={2}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">{t.contact.info.hours}</h3>
                  <p className="text-gray-400 text-sm uppercase tracking-widest">{t.contact.info.window}</p>
                </div>
              </div>
              <div className="space-y-2 text-gray-300">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-xs uppercase tracking-widest">{t.contact.info.weekdays}</span>
                  <span className="font-mono">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-xs uppercase tracking-widest">{t.contact.info.saturday}</span>
                  <span className="font-mono">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs uppercase tracking-widest">{t.contact.info.sunday}</span>
                  <span className="font-mono text-red-500">{t.contact.info.closed}</span>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Contact;
