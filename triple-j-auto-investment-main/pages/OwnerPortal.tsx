/**
 * OwnerPortal - Primary owner-facing dashboard page
 * Route: /owner
 *
 * Auth guard: redirects to /customer/login if no active session.
 * Fetches owner data (registration) and referral data in parallel.
 * Shows vehicle card, documents, service reminders, and value tracker.
 *
 * Phase 19-02: Owner Portal UI
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/config';
import { getOwnerData, getReferralData } from '../services/ownerPortalService';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';
import OwnerVehicleCard from '../components/owner/OwnerVehicleCard';
import OwnerDocuments from '../components/owner/OwnerDocuments';
import OwnerServiceReminders from '../components/owner/OwnerServiceReminders';
import OwnerValueTracker from '../components/owner/OwnerValueTracker';
import type { Registration, OwnerReferral } from '../types';

const OwnerPortal: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tp = t.ownerPortal;

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [referral, setReferral] = useState<OwnerReferral | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const init = async () => {
      // Auth guard
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/customer/login');
        return;
      }

      const phone = session.user?.phone || '';

      // Extract first name from phone session (fallback to empty)
      // Owner name comes from registration.customerName after fetch

      try {
        // Parallel fetch: owner data + referral data
        const [ownerData, referralData] = await Promise.all([
          getOwnerData(phone),
          getReferralData(phone),
        ]);

        setRegistration(ownerData);
        setReferral(referralData);

        if (ownerData?.customerName) {
          setFirstName(ownerData.customerName.split(' ')[0] ?? ownerData.customerName);
        }
      } catch (err) {
        console.error('[OwnerPortal] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  // Listen for session expiry
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/customer/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const seo = (
    <SEO
      title="Owner Portal | Triple J Auto Investment"
      description="Your personal vehicle owner portal."
      path="/owner"
      noindex={true}
    />
  );

  if (loading) {
    return (
      <>
        {seo}
        <div className="min-h-screen bg-gradient-to-b from-black via-tj-green to-black flex items-center justify-center">
          <div className="text-center">
            <img
              src="/GoldTripleJLogo.png"
              alt="Triple J"
              className="w-16 h-16 mx-auto mb-4 animate-pulse"
            />
            <p className="text-gray-400 text-sm">{tp.loading}</p>
          </div>
        </div>
      </>
    );
  }

  if (!registration) {
    return (
      <>
        {seo}
        <div className="min-h-screen bg-gradient-to-b from-black via-tj-green to-black flex items-center justify-center px-4">
          <div className="max-w-sm w-full p-6 md:p-8 bg-black/40 border border-tj-gold/10 rounded-lg text-center">
            <img
              src="/GoldTripleJLogo.png"
              alt="Triple J"
              className="w-12 h-12 mx-auto mb-4 opacity-60"
            />
            <p className="text-gray-400 text-sm leading-relaxed mb-6">{tp.emptyState}</p>
            <Link
              to="/customer/dashboard"
              className="inline-block text-[10px] uppercase tracking-[0.3em] text-tj-gold hover:text-white transition-colors"
            >
              View Registrations
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {seo}
      <div className="min-h-screen bg-gradient-to-b from-black via-tj-green to-black px-4 md:px-8 pb-16">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Header */}
          <div className="pt-6 pb-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-tj-gold mb-1">{tp.title}</p>
            {firstName ? (
              <p className="font-display text-xl text-white">
                {tp.welcome}, {firstName}
              </p>
            ) : (
              <p className="font-display text-xl text-white">{tp.title}</p>
            )}
          </div>

          {/* Vehicle Card */}
          <OwnerVehicleCard registration={registration} />

          {/* Documents */}
          <OwnerDocuments registration={registration} />

          {/* Service Reminders */}
          <OwnerServiceReminders registration={registration} />

          {/* Value Tracker */}
          <OwnerValueTracker registration={registration} />

          {/* Plan 03 will add: Referral section + Upgrade section */}

        </div>
      </div>
    </>
  );
};

export default OwnerPortal;
