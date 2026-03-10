"use client";

import { useActionState } from "react";
import Image from "next/image";
import { loginAdmin, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = { success: false };

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAdmin, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/GoldTripleJLogo.png"
            alt="Triple J Auto Investment"
            width={64}
            height={64}
            className="w-16 h-16 object-contain"
            priority
          />
        </div>

        <h1 className="text-center text-lg font-serif text-neutral-200 mb-8">
          Admin Sign In
        </h1>

        <form action={formAction} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-4 py-3 text-neutral-100 placeholder:text-neutral-500 focus:border-tj-gold/50 focus:ring-1 focus:ring-tj-gold/30 focus:outline-none min-h-[44px]"
              placeholder="Enter admin password"
            />
          </div>

          {state.error && (
            <p className="text-red-400 text-sm" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-tj-gold/90 hover:bg-tj-gold text-black font-accent text-xs uppercase tracking-[0.15em] py-3 rounded-md min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Signing in\u2026" : "Sign In"}
          </button>
        </form>

        <p className="mt-10 text-center text-neutral-600 text-xs">
          Triple J Auto Investment
        </p>
      </div>
    </div>
  );
}
