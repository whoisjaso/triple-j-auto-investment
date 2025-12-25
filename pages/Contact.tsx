import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { useStore } from '../context/Store';
import { openSmartMap } from '../App';
import { useLanguage } from '../context/LanguageContext';

const Contact = () => {
  const { addLead } = useStore();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    setTimeout(() => {
      addLead({
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
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 mb-6 text-tj-gold text-xs uppercase tracking-[0.4em]">
            <MessageSquare size={16} />
            <span>{t.contact.subtitle}</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display text-white tracking-tight mb-6">
            {t.contact.title}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t.contact.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Contact Form */}
          <div className="bg-tj-dark border border-white/10 p-12">
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
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">{t.contact.form.name}</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                    placeholder={t.contact.form.placeholders.name}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">{t.contact.form.phone}</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                    placeholder={t.contact.form.placeholders.phone}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">{t.contact.form.email}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                    placeholder={t.contact.form.placeholders.email}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">{t.contact.form.message}</label>
                  <textarea
                    required
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
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
          </div>

          {/* Contact Info */}
          <div className="space-y-8">

            {/* Headquarters */}
            <div className="bg-black border border-white/10 p-8 hover:border-tj-gold/50 transition-colors group">
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
            </div>

            {/* Phone */}
            <div className="bg-black border border-white/10 p-8 hover:border-tj-gold/50 transition-colors group">
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
            </div>

            {/* Hours */}
            <div className="bg-black border border-white/10 p-8 hover:border-tj-gold/50 transition-colors group">
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
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
