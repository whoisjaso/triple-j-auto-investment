"use client";

import { useState } from "react";

const TERM_OPTIONS = [12, 18, 24, 30, 36];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);

export default function PaymentCalculator({ price }: { price: number }) {
  const [downPayment, setDownPayment] = useState(500);
  const [termMonths, setTermMonths] = useState(24);

  const financed = Math.max(0, price - downPayment);
  const monthly = termMonths > 0 ? financed / termMonths : 0;

  return (
    <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] p-4 md:p-5">
      <h2 className="font-accent text-[10px] uppercase tracking-[0.25em] text-white/30 mb-4">
        Estimated Payment
      </h2>

      {/* Monthly payment display */}
      <div className="mb-5">
        <span className="font-serif text-3xl text-tj-gold">
          {formatCurrency(monthly)}
        </span>
        <span className="text-sm text-white/30 ml-1">/month</span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        {/* Down payment */}
        <div>
          <label htmlFor="calc-down-payment" className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5">
            Down Payment
          </label>
          <div className="relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20 text-sm" aria-hidden="true">
              $
            </span>
            <input
              id="calc-down-payment"
              type="number"
              value={downPayment}
              onChange={(e) => {
                const val = Math.max(0, Math.min(price, Number(e.target.value) || 0));
                setDownPayment(val);
              }}
              min={0}
              max={price}
              step={100}
              className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pl-3.5 pb-1.5 outline-none transition-colors min-h-[44px]"
            />
          </div>
        </div>

        {/* Term */}
        <div>
          <label htmlFor="calc-term" className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5">
            Term (Months)
          </label>
          <select
            id="calc-term"
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pb-1.5 outline-none cursor-pointer transition-colors min-h-[44px] appearance-none"
          >
            {TERM_OPTIONS.map((t) => (
              <option key={t} value={t} className="bg-black">
                {t} months
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-4 font-accent text-[9px] leading-relaxed text-white/20">
        Estimate only. Final terms determined at dealership. Subject to credit
        approval.
      </p>
    </div>
  );
}
