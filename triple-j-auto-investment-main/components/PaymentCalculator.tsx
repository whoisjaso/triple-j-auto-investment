import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { estimateMonthlyPayment } from '../services/marketEstimateService';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

interface PaymentCalculatorProps {
  price: number;
  className?: string;
  onFirstInteraction?: () => void;
}

const DOWN_PRESETS = [0, 500, 1000, 1500, 2000];
const TERM_OPTIONS = [12, 18, 24, 36];

export const PaymentCalculator: React.FC<PaymentCalculatorProps> = ({ price, className = '', onFirstInteraction }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [downPayment, setDownPayment] = useState(500);
  const [termMonths, setTermMonths] = useState(24);
  const interactedRef = useRef(false);

  const monthly = useMemo(
    () => estimateMonthlyPayment(price, downPayment, termMonths),
    [price, downPayment, termMonths]
  );

  const e = t.engagement;

  return (
    <div className={`bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden ${className}`}>
      {/* Collapsed header */}
      <button
        onClick={() => {
          const willOpen = !isOpen;
          setIsOpen(willOpen);
          if (willOpen && !interactedRef.current && onFirstInteraction) {
            interactedRef.current = true;
            onFirstInteraction();
          }
        }}
        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors min-h-[44px]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <Calculator size={18} className="text-tj-gold" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
            {e?.paymentCalculator || 'Payment Calculator'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg text-white">
            Est. ${monthly}/mo
          </span>
          {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </div>
      </button>

      {/* Expanded body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-2 border-t border-white/[0.04]">
              {/* Down Payment */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                    {e?.downPayment || 'Down Payment'}
                  </label>
                  <span className="font-display text-lg text-white">${downPayment.toLocaleString()}</span>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={0}
                  max={2000}
                  step={100}
                  value={downPayment}
                  onChange={(ev) => setDownPayment(Number(ev.target.value))}
                  className="w-full h-1 bg-white/[0.08] rounded-full appearance-none cursor-pointer accent-tj-gold [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-tj-gold [&::-webkit-slider-thumb]:cursor-pointer"
                />

                {/* Quick-select buttons */}
                <div className="flex gap-2 mt-3">
                  {DOWN_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDownPayment(amt)}
                      className={`flex-1 py-2 text-[9px] font-bold tracking-[0.1em] rounded transition-all min-h-[36px] ${
                        downPayment === amt
                          ? 'bg-tj-gold text-black'
                          : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]'
                      }`}
                    >
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Term Selection */}
              <div className="mb-5">
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 block">
                  {e?.loanTerm || 'Loan Term'}
                </label>
                <div className="flex gap-2">
                  {TERM_OPTIONS.map((term) => (
                    <button
                      key={term}
                      onClick={() => setTermMonths(term)}
                      className={`flex-1 py-2.5 text-[10px] font-bold tracking-[0.1em] rounded transition-all min-h-[40px] ${
                        termMonths === term
                          ? 'bg-tj-gold text-black'
                          : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]'
                      }`}
                    >
                      {term} {e?.months || 'mo'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result */}
              <div className="text-center py-4 border-t border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">
                  {e?.estimatedMonthly || 'Estimated Monthly'}
                </p>
                <p className="font-display text-4xl text-white mb-1">
                  ${monthly}<span className="text-lg text-gray-400">/mo</span>
                </p>
                <p className="text-[10px] text-gray-500">
                  {(e?.withDown || 'with {amount} down').replace('{amount}', `$${downPayment.toLocaleString()}`)} &middot; {termMonths} {e?.months || 'months'}
                </p>
                <p className="text-[9px] text-gray-600 mt-2">
                  {e?.paymentDisclaimer || 'Estimate only. Subject to credit approval. See dealer for details.'}
                </p>
              </div>

              {/* CTA */}
              <Link
                to="/finance"
                className="block text-center py-3 mt-2 border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20 text-[10px] uppercase tracking-[0.2em] transition-all min-h-[44px] flex items-center justify-center"
              >
                {t.vehicleDetail?.applyForFinancing || 'Apply for Financing'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
