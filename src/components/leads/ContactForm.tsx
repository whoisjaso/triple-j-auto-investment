"use client";

import { useActionState } from "react";
import { submitLead, type LeadFormState } from "@/lib/actions/leads";
import type { LeadSource } from "@/types/database";

interface ContactFormProps {
  source: LeadSource;
  vehicleName?: string;
  showVehicleField?: boolean;
  showDownPayment?: boolean;
}

const initialState: LeadFormState = { success: false };

export default function ContactForm({
  source,
  vehicleName,
  showVehicleField,
  showDownPayment,
}: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitLead,
    initialState
  );

  if (state.success) {
    return (
      <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] p-8 md:p-10 text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-400/80 mx-auto mb-4"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h3 className="font-serif text-xl text-tj-cream mb-2">
          Thank you!
        </h3>
        <p className="text-sm text-white/50 mb-6">
          We&rsquo;ll be in touch soon. Expect a call within 24 hours.
        </p>
        <a
          href="tel:+18324009760"
          className="inline-flex items-center gap-2 font-accent text-[10px] uppercase tracking-[0.2em] text-tj-gold/80 hover:text-tj-gold transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Or call now — (832) 400-9760
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.error && (
        <div
          role="alert"
          className="border border-red-500/20 bg-red-500/5 rounded-sm px-4 py-3 text-sm text-red-400"
        >
          {state.error}
        </div>
      )}

      <input type="hidden" name="source" value={source} />

      {/* Name */}
      <div>
        <label
          htmlFor="lead-name"
          className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5"
        >
          Name <span className="text-tj-gold/50">*</span>
        </label>
        <input
          id="lead-name"
          name="name"
          type="text"
          required
          minLength={2}
          autoComplete="name"
          className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pb-2 outline-none transition-colors min-h-[44px]"
        />
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="lead-phone"
          className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5"
        >
          Phone <span className="text-tj-gold/50">*</span>
        </label>
        <input
          id="lead-phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pb-2 outline-none transition-colors min-h-[44px]"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="lead-email"
          className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5"
        >
          Email
        </label>
        <input
          id="lead-email"
          name="email"
          type="email"
          autoComplete="email"
          className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pb-2 outline-none transition-colors min-h-[44px]"
        />
      </div>

      {/* Vehicle of Interest */}
      {showVehicleField && (
        <div>
          <label
            htmlFor="lead-vehicle"
            className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5"
          >
            Vehicle of Interest
          </label>
          <input
            id="lead-vehicle"
            name="vehicleName"
            type="text"
            defaultValue={vehicleName ?? ""}
            className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pb-2 outline-none transition-colors min-h-[44px]"
          />
        </div>
      )}

      {/* Down Payment Budget */}
      {showDownPayment && (
        <div>
          <label
            htmlFor="lead-downpayment"
            className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5"
          >
            Down Payment Budget
          </label>
          <input
            id="lead-downpayment"
            name="downPayment"
            type="text"
            placeholder="e.g., $500"
            className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pb-2 outline-none transition-colors min-h-[44px] placeholder:text-white/10"
          />
        </div>
      )}

      {/* Message */}
      <div>
        <label
          htmlFor="lead-message"
          className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5"
        >
          Message
        </label>
        <textarea
          id="lead-message"
          name="message"
          rows={4}
          className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm pb-2 outline-none transition-colors resize-none min-h-[44px]"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2.5 w-full min-h-[52px] bg-tj-gold/90 hover:bg-tj-gold disabled:bg-tj-gold/40 text-black font-accent text-[11px] uppercase tracking-[0.2em] rounded-sm transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="animate-spin"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.75" />
            </svg>
            Sending...
          </>
        ) : (
          "Send Message"
        )}
      </button>
    </form>
  );
}
