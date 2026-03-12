"use client";

import { useActionState } from "react";
import Image from "next/image";
import { loginAdmin, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = { success: false };

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAdmin,
    initialState
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#050505] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-tj-gold/[0.015] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo with glow */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-tj-gold/10 rounded-full blur-2xl scale-[2]" />
            <Image
              src="/GoldTripleJLogo.webp"
              alt="Triple J Auto Investment"
              width={72}
              height={72}
              className="w-[72px] h-[72px] object-contain relative z-10"
              priority
            />
          </div>
        </div>

        <h1 className="text-center font-serif text-xl text-tj-cream/90 tracking-wide mb-2">
          Dealer Portal
        </h1>
        <p className="text-center text-[10px] text-white/20 font-accent uppercase tracking-[0.25em] mb-10">
          Triple J Auto Investment
        </p>

        <form action={formAction} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-[10px] font-accent text-white/30 uppercase tracking-[0.2em] mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-tj-cream/90 placeholder:text-white/15 focus:border-tj-gold/30 focus:bg-white/[0.05] focus:outline-none transition-all duration-300 min-h-[48px] text-sm"
              placeholder="Enter password"
            />
          </div>

          {state.error && (
            <div
              className="bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3"
              role="alert"
            >
              <p className="text-red-400/80 text-sm">{state.error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-tj-gold/90 to-tj-gold-light/90 hover:from-tj-gold hover:to-tj-gold-light text-black font-accent text-xs uppercase tracking-[0.2em] py-3.5 rounded-xl min-h-[48px] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Signing in\u2026" : "Sign In"}
          </button>
        </form>

        <p className="mt-14 text-center text-white/[0.06] text-[10px] font-accent uppercase tracking-[0.15em]">
          Triple J Auto Investment LLC
        </p>
      </div>
    </div>
  );
}
