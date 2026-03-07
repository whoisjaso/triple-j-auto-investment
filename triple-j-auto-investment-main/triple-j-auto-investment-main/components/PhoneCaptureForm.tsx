import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/Store';
import { createVehicleLead, isValidPhone } from '../services/vehicleLeadService';
import { LeadActionType } from '../types';

interface PhoneCaptureFormProps {
  actionType: LeadActionType;
  vehicleId: string;
  vehicleVin: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export const PhoneCaptureForm: React.FC<PhoneCaptureFormProps> = ({
  actionType,
  vehicleId,
  vehicleVin,
  label,
  description,
  icon,
  className = '',
}) => {
  const { t } = useLanguage();
  const { addLead } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const e = t.engagement;

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handlePhoneChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const raw = ev.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(formatPhone(raw));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (!isValidPhone(digits)) {
      setError(e?.invalidPhone || 'Please enter a valid phone number');
      return;
    }

    setStatus('submitting');
    setError('');

    try {
      const lead = createVehicleLead({
        actionType,
        phone: digits,
        vehicleId,
        vehicleVin,
      });
      await addLead(lead);
      setStatus('success');
      setWasSubmitted(true);

      // Auto-collapse after 3 seconds
      setTimeout(() => {
        setIsExpanded(false);
        setStatus('idle');
        setPhone('');
      }, 3000);
    } catch {
      setStatus('error');
      setError('Something went wrong. Please try again.');
    }
  };

  const handleKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === 'Enter') handleSubmit();
    if (ev.key === 'Escape') {
      setIsExpanded(false);
      setPhone('');
      setError('');
    }
  };

  // Collapsed state
  if (!isExpanded) {
    return (
      <button
        onClick={() => { if (!wasSubmitted) setIsExpanded(true); }}
        className={`w-full text-left p-4 rounded-lg border transition-all min-h-[44px] ${
          wasSubmitted
            ? 'bg-green-500/[0.05] border-green-500/20'
            : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.10] cursor-pointer'
        } ${className}`}
        disabled={wasSubmitted}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${wasSubmitted ? 'text-green-400' : 'text-tj-gold'}`}>
            {wasSubmitted ? <CheckCircle size={18} /> : icon}
          </div>
          <div>
            <p className={`text-sm font-medium ${wasSubmitted ? 'text-green-400' : 'text-white'}`}>
              {wasSubmitted ? (e?.submitted || 'Submitted!') : label}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {wasSubmitted ? (e?.wellBeInTouch || "We'll be in touch soon") : description}
            </p>
          </div>
        </div>
      </button>
    );
  }

  // Expanded state
  return (
    <div className={`rounded-lg border border-white/[0.10] bg-white/[0.03] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="mt-0.5 text-tj-gold">{icon}</div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          {status === 'success' ? (
            <div className="px-4 pb-4 text-center">
              <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-400">{e?.submitted || 'Submitted!'}</p>
              <p className="text-[10px] text-gray-500 mt-1">{e?.wellBeInTouch || "We'll be in touch soon"}</p>
            </div>
          ) : (
            <div className="px-4 pb-4">
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-white/[0.04] border border-white/[0.08] rounded-l text-gray-500 text-sm">
                  +1
                </div>
                <input
                  ref={inputRef}
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onKeyDown={handleKeyDown}
                  placeholder="(832) 400-9760"
                  aria-label={e?.phoneNumber || 'Phone Number'}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] border-l-0 rounded-r text-white px-4 py-3 text-sm placeholder:text-gray-600 focus:border-tj-gold/40 focus:ring-1 focus:ring-tj-gold/20 focus:outline-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 mt-2 text-red-400">
                  <AlertCircle size={12} />
                  <p className="text-[10px]">{error}</p>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setIsExpanded(false); setPhone(''); setError(''); }}
                  className="px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] text-gray-500 hover:text-gray-300 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={status === 'submitting'}
                  className="flex-1 py-2.5 bg-tj-gold text-black font-bold text-[10px] uppercase tracking-[0.2em] rounded hover:bg-tj-gold/90 transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {e?.sending || 'Sending...'}
                    </>
                  ) : (
                    e?.submit || 'Submit'
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
