import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/Store';
import { createVehicleLead, isValidPhone } from '../services/vehicleLeadService';

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

interface AskQuestionFormProps {
  vehicleId: string;
  vehicleVin: string;
  className?: string;
}

export const AskQuestionForm: React.FC<AskQuestionFormProps> = ({
  vehicleId,
  vehicleVin,
  className = '',
}) => {
  const { t } = useLanguage();
  const { addLead } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  const e = t.engagement;

  useEffect(() => {
    if (isExpanded && nameRef.current) nameRef.current.focus();
  }, [isExpanded]);

  const handlePhoneChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const raw = ev.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(formatPhone(raw));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    const trimName = name.trim();
    if (!trimName) { setError(e?.nameRequired || 'Name is required'); return; }
    const digits = phone.replace(/\D/g, '');
    if (!isValidPhone(digits)) { setError(e?.invalidPhone || 'Please enter a valid phone number'); return; }
    const trimQ = question.trim();
    if (trimQ.length < 5) { setError(e?.questionTooShort || 'Please enter your question (at least 5 characters)'); return; }

    setStatus('submitting');
    setError('');

    try {
      const lead = createVehicleLead({
        actionType: 'ask_question',
        phone: digits,
        vehicleId,
        vehicleVin,
        name: trimName,
        message: trimQ,
      });
      await addLead(lead);
      setStatus('success');
    } catch {
      setStatus('error');
      setError(e?.somethingWrong || 'Something went wrong. Please try again.');
    }
  };

  if (!isExpanded && status !== 'success') {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`w-full text-left p-5 rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-tj-gold/20 transition-all cursor-pointer min-h-[44px] ${className}`}
      >
        <div className="flex items-start gap-3">
          <MessageCircle size={18} className="text-tj-gold mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">{e?.askQuestion || 'Ask a Question'}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{e?.askDesc || 'Get answers about this vehicle'}</p>
          </div>
        </div>
      </button>
    );
  }

  if (status === 'success') {
    return (
      <div className={`p-5 rounded-lg border border-green-500/20 bg-green-500/[0.05] text-center ${className}`}>
        <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-green-400">{e?.questionReceived || 'Question Received!'}</p>
        <p className="text-[10px] text-gray-400 mt-1">{e?.questionReceivedDesc || "We'll get back to you shortly"}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-white/[0.10] bg-white/[0.03] overflow-hidden ${className}`}>
      <div className="p-4 flex items-start gap-3">
        <MessageCircle size={18} className="text-tj-gold mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white">{e?.askQuestion || 'Ask a Question'}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{e?.askDesc || 'Get answers about this vehicle'}</p>
        </div>
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-4 space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2 block">
                {e?.yourName || 'Your Name'}
              </label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(ev) => { setName(ev.target.value); if (error) setError(''); }}
                placeholder={e?.yourName || 'Your Name'}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded text-white px-4 py-3 text-sm placeholder:text-gray-600 focus:border-tj-gold/40 focus:ring-1 focus:ring-tj-gold/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2 block">
                {e?.phoneNumber || 'Phone Number'}
              </label>
              <div className="flex">
                <div className="flex items-center px-3 bg-white/[0.04] border border-white/[0.08] rounded-l text-gray-500 text-sm">
                  +1
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(832) 400-9760"
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] border-l-0 rounded-r text-white px-4 py-3 text-sm placeholder:text-gray-600 focus:border-tj-gold/40 focus:ring-1 focus:ring-tj-gold/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2 block">
                {e?.yourQuestion || 'Your Question'}
              </label>
              <textarea
                value={question}
                onChange={(ev) => { setQuestion(ev.target.value.slice(0, 500)); if (error) setError(''); }}
                placeholder={e?.questionPlaceholder || 'What would you like to know about this vehicle?'}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded text-white px-4 py-3 text-sm placeholder:text-gray-600 focus:border-tj-gold/40 focus:ring-1 focus:ring-tj-gold/20 focus:outline-none resize-none"
              />
              {question.length > 400 && (
                <p className="text-[9px] text-gray-500 text-right mt-1">{question.length}/500</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-red-400">
                <AlertCircle size={12} />
                <p className="text-[10px]">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setIsExpanded(false); setName(''); setPhone(''); setQuestion(''); setError(''); }}
                className="px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] text-gray-500 hover:text-gray-300 transition-colors min-h-[44px]"
              >
                {e?.cancel || 'Cancel'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={status === 'submitting'}
                className="flex-1 py-2.5 bg-tj-gold text-black font-bold text-[10px] uppercase tracking-[0.2em] rounded hover:bg-tj-gold/90 transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <><Loader2 size={14} className="animate-spin" /> {e?.sending || 'Sending...'}</>
                ) : (
                  e?.submit || 'Submit'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
