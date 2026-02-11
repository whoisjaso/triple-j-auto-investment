/**
 * CustomerLogin - Phone OTP login for customers
 * Route: /customer/login (NOT /login which is admin)
 *
 * Two-step flow:
 * 1. Phone input -> sends OTP via Supabase signInWithOtp
 * 2. Code verification -> verifyOtp, then navigate to /customer/dashboard
 *
 * Phase 04-04: Customer Portal - Notifications & Login
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, KeyRound, ArrowLeft, ExternalLink } from 'lucide-react';
import { supabase } from '../supabase/config';
import { normalizePhone, formatPhone } from '../utils/phone';

type Step = 'phone' | 'verify';

const CustomerLogin: React.FC = () => {
  const navigate = useNavigate();

  // State machine
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);

  // Tracking link input
  const [trackingLink, setTrackingLink] = useState('');

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/customer/dashboard');
      }
    };
    checkSession();
  }, [navigate]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Validate phone has at least 10 digits
  const isPhoneValid = phone.replace(/\D/g, '').length >= 10;

  const handleSendCode = useCallback(async () => {
    setLoading(true);
    setError(null);
    const normalized = normalizePhone(phone);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone: normalized });
      if (otpError) {
        setError(otpError.message);
        setLoading(false);
      } else {
        setNormalizedPhone(normalized);
        setStep('verify');
        setResendCooldown(60);
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }, [phone]);

  const handleVerify = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: code,
        type: 'sms',
      });
      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
      } else {
        // Success - navigate to customer dashboard
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setLoading(false);
    }
  }, [normalizedPhone, code, navigate]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setResendCooldown(60);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
      if (otpError) {
        setError(otpError.message);
      }
    } catch {
      setError('Failed to resend code. Please try again.');
    }
  }, [normalizedPhone, resendCooldown]);

  const handleTrackingGo = () => {
    const key = trackingLink.trim();
    if (!key) return;
    // Accept either full URL with /track/ or just the access key
    const match = key.match(/\/track\/(.+)/);
    const accessKey = match ? match[1] : key;
    navigate(`/track/${accessKey}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-tj-green to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <img
            src="/GoldTripleJLogo.png"
            alt="Triple J Auto Investment"
            className="w-16 h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="font-display text-2xl md:text-3xl text-white tracking-wide">
            Track Your Registrations
          </h1>
          <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
            Enter your phone number to view all your registrations with Triple J Auto Investment.
          </p>
        </div>

        {/* Step 1: Phone Input */}
        {step === 'phone' && (
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                Phone Number
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm font-mono bg-white/5 border border-white/10 rounded px-3 py-3">
                  +1
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="flex-1 bg-white/5 border border-white/10 rounded px-4 py-3 text-white placeholder-gray-600 focus:border-tj-gold/50 focus:outline-none focus:ring-1 focus:ring-tj-gold/30 transition-colors"
                  autoComplete="tel"
                  onKeyDown={(e) => e.key === 'Enter' && isPhoneValid && handleSendCode()}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSendCode}
              disabled={!isPhoneValid || loading}
              className="w-full bg-tj-gold text-black font-bold uppercase tracking-widest py-3 rounded flex items-center justify-center gap-2 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="animate-pulse">Sending...</span>
              ) : (
                <>
                  Send Code <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Code Verification */}
        {step === 'verify' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-4">
                <Phone size={14} className="text-tj-gold" />
                <span className="text-gray-300 text-sm">{formatPhone(normalizedPhone)}</span>
              </div>
              <p className="text-gray-400 text-sm">
                Enter the 6-digit code sent to your phone.
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                Verification Code
              </label>
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-gray-500" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-center font-mono text-lg tracking-[0.3em] placeholder-gray-600 focus:border-tj-gold/50 focus:outline-none focus:ring-1 focus:ring-tj-gold/30 transition-colors"
                  autoComplete="one-time-code"
                  onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && handleVerify()}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={code.length !== 6 || loading}
              className="w-full bg-tj-gold text-black font-bold uppercase tracking-widest py-3 rounded flex items-center justify-center gap-2 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="animate-pulse">Verifying...</span>
              ) : (
                <>
                  Verify <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setError(null);
                }}
                className="text-gray-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={14} /> Different number
              </button>
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-tj-gold hover:text-white transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-600 text-[10px] uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Tracking link input */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">
            Have a tracking link?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingLink}
              onChange={(e) => setTrackingLink(e.target.value)}
              placeholder="Paste your access key or link"
              className="flex-1 bg-white/5 border border-white/10 rounded px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:border-tj-gold/50 focus:outline-none transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleTrackingGo()}
            />
            <button
              onClick={handleTrackingGo}
              disabled={!trackingLink.trim()}
              className="bg-white/5 border border-white/10 rounded px-4 py-2.5 text-tj-gold hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
