/**
 * OwnerReferralSection - Family Circle Referral Program
 *
 * Displays the owner's unique referral code and link with share/copy
 * buttons, personal referral count, tier progress, and community counter.
 *
 * Mobile-first: native share sheet on mobile, clipboard fallback on desktop.
 *
 * Phase 19-03: Referral + Upgrade
 */

import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, Users, Gift } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getCommunityReferralCount } from '../../services/ownerPortalService';
import { REFERRAL_TIERS } from '../../types';
import type { OwnerReferral } from '../../types';

interface OwnerReferralSectionProps {
  referral: OwnerReferral | null;
}

const OwnerReferralSection: React.FC<OwnerReferralSectionProps> = ({ referral }) => {
  const { t } = useLanguage();
  const tp = t.ownerPortal;

  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const [communityCount, setCommunityCount] = useState<number>(0);

  useEffect(() => {
    getCommunityReferralCount().then(setCommunityCount);
  }, []);

  const handleShareLink = async () => {
    if (!referral) return;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'Triple J Auto Investment',
          text: 'I bought my car from Triple J and love it. Check them out!',
          url: referral.referralLink,
        });
      } catch {
        // User cancelled the share sheet -- not an error
      }
    } else {
      try {
        await navigator.clipboard.writeText(referral.referralLink);
        setCopied('link');
        setTimeout(() => setCopied(null), 2500);
      } catch {
        // Clipboard access denied
      }
    }
  };

  const handleCopyCode = async () => {
    if (!referral) return;
    try {
      await navigator.clipboard.writeText(referral.referralCode);
      setCopied('code');
      setTimeout(() => setCopied(null), 2500);
    } catch {
      // Clipboard access denied
    }
  };

  // Edge case: trigger has not fired yet
  if (!referral) {
    return (
      <div className="p-6 md:p-8 bg-black/40 border border-tj-gold/10 rounded-lg">
        <p className="text-[10px] uppercase tracking-[0.3em] text-tj-gold mb-4">
          {tp.referralTitle}
        </p>
        <p className="text-sm text-gray-400">
          Your referral code is being generated... Check back in a few minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-black/40 border border-tj-gold/10 rounded-lg">
      {/* Section Title */}
      <p className="text-[10px] uppercase tracking-[0.3em] text-tj-gold mb-6">
        {tp.referralTitle}
      </p>

      {/* Referral Code */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">
          {tp.yourCode}
        </p>
        <p className="font-mono text-lg tracking-widest text-tj-gold">
          {referral.referralCode}
        </p>
      </div>

      {/* Referral Link */}
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">
          {tp.yourLink}
        </p>
        <p className="text-[11px] text-gray-400 truncate max-w-full">
          {referral.referralLink}
        </p>
      </div>

      {/* Share Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={handleShareLink}
          className="flex-1 flex items-center justify-center gap-2 min-h-[44px] py-4 px-8 text-xs tracking-[0.3em] uppercase bg-tj-gold text-black hover:bg-tj-gold/90 rounded transition-colors"
        >
          {copied === 'link' ? (
            <>
              <Check size={14} />
              {tp.copied}
            </>
          ) : (
            <>
              <Share2 size={14} />
              {tp.shareLink}
            </>
          )}
        </button>

        <button
          onClick={handleCopyCode}
          className="flex-1 flex items-center justify-center gap-2 min-h-[44px] py-4 px-8 text-xs tracking-[0.3em] uppercase border border-tj-gold/30 text-tj-gold hover:border-tj-gold/60 rounded transition-colors"
        >
          {copied === 'code' ? (
            <>
              <Check size={14} />
              {tp.copied}
            </>
          ) : (
            <>
              <Copy size={14} />
              {tp.copyCode}
            </>
          )}
        </button>
      </div>

      {/* Personal Referral Count */}
      <div className="mb-6 p-4 bg-black/20 rounded border border-tj-gold/5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">
          {tp.referralCount}
        </p>
        <p className="text-xl text-white font-medium">{referral.referralCount}</p>
      </div>

      {/* Tier Progress */}
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">
          {tp.tierProgress}
        </p>
        <div className="space-y-3">
          {REFERRAL_TIERS.map((tier, idx) => {
            const reached = referral.referralCount >= tier.count;
            const tierLabels = [tp.tier1, tp.tier2, tp.tier3];
            return (
              <div key={tier.count} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    reached
                      ? 'bg-tj-gold border-tj-gold'
                      : 'border-tj-gold/30 bg-transparent'
                  }`}
                >
                  {reached && <Check size={10} className="text-black" strokeWidth={3} />}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Gift size={12} className={reached ? 'text-tj-gold' : 'text-gray-600'} />
                  <p
                    className={`text-[11px] ${
                      reached ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {tierLabels[idx]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Counter */}
      <div className="flex items-center gap-2 text-gray-400">
        <Users size={14} className="flex-shrink-0" />
        <p className="text-[11px]">
          <span className="text-white font-medium">{communityCount}</span>{' '}
          {tp.communityCount}
        </p>
      </div>
    </div>
  );
};

export default OwnerReferralSection;
