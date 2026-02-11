/**
 * CustomerDashboard - Logged-in customer view showing all registrations
 * Route: /customer/dashboard
 *
 * - Checks auth session on mount, redirects to /customer/login if none
 * - Fetches registrations filtered by RLS (customer_phone = auth.jwt()->>'phone')
 * - Active registrations on top, completed in collapsible section
 * - Each registration links to /track/{orderId}-{accessToken}
 * - NotificationPreferences (compact) per registration
 * - Listens for auth state changes (session expiry)
 *
 * Phase 04-04: Customer Portal - Notifications & Login
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, ChevronDown, ChevronRight, Car, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase/config';
import { formatPhone } from '../utils/phone';
import NotificationPreferences from '../components/NotificationPreferences';
import { RegistrationStageKey, NotificationPreference, REGISTRATION_STAGES } from '../types';

// Lightweight display type (we map DB rows inline, not importing unexported transformer)
interface DashboardRegistration {
  id: string;
  orderId: string;
  customerName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  currentStage: RegistrationStageKey;
  accessToken: string;
  notificationPref: NotificationPreference;
  createdAt: string;
}

// Stage order for progress bar rendering
const STAGE_ORDER: RegistrationStageKey[] = [
  'sale_complete',
  'documents_collected',
  'submitted_to_dmv',
  'dmv_processing',
  'sticker_ready',
  'sticker_delivered',
];

const stageIndex = (stage: RegistrationStageKey): number => {
  if (stage === 'rejected') return 3; // visual position at dmv_processing
  const idx = STAGE_ORDER.indexOf(stage);
  return idx >= 0 ? idx : 0;
};

const getStageLabel = (stage: RegistrationStageKey): string => {
  const config = REGISTRATION_STAGES.find(s => s.key === stage);
  return config?.label || stage;
};

const getStageBadgeClasses = (stage: RegistrationStageKey): string => {
  if (stage === 'rejected') return 'bg-red-500/20 text-red-400';
  if (stage === 'sticker_delivered') return 'bg-green-500/20 text-green-400';
  return 'bg-amber-500/20 text-amber-400';
};

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<DashboardRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Fetch registrations for authenticated customer
  const fetchRegistrations = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('registrations')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching registrations:', fetchError);
        setError('Failed to load registrations. Please try again.');
        return;
      }

      // Map snake_case DB rows to camelCase display format
      const mapped: DashboardRegistration[] = (data || []).map((row: any) => ({
        id: row.id,
        orderId: row.order_id,
        customerName: row.customer_name,
        vehicleYear: row.vehicle_year,
        vehicleMake: row.vehicle_make,
        vehicleModel: row.vehicle_model,
        currentStage: row.current_stage,
        accessToken: row.access_token,
        notificationPref: row.notification_pref ?? 'both',
        createdAt: row.created_at,
      }));

      setRegistrations(mapped);
    } catch (err) {
      console.error('Unexpected error fetching registrations:', err);
      setError('An unexpected error occurred.');
    }
  }, []);

  // Check session and fetch data
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/customer/login');
        return;
      }

      // Extract phone from JWT
      const userPhone = session.user?.phone || '';
      setPhone(userPhone);

      await fetchRegistrations();
      setLoading(false);
    };

    init();
  }, [navigate, fetchRegistrations]);

  // Listen for auth state changes (session expiry)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/customer/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/customer/login');
  };

  // Handle preference update (update local state to reflect change)
  const handlePrefUpdate = (regId: string, newPref: NotificationPreference) => {
    setRegistrations(prev =>
      prev.map(r => r.id === regId ? { ...r, notificationPref: newPref } : r)
    );
  };

  // Split registrations
  const active = registrations.filter(r => r.currentStage !== 'sticker_delivered');
  const completed = registrations.filter(r => r.currentStage === 'sticker_delivered');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-tj-green to-black flex items-center justify-center">
        <div className="text-center">
          <img
            src="/GoldTripleJLogo.png"
            alt="Triple J"
            className="w-16 h-16 mx-auto mb-4 animate-pulse"
          />
          <p className="text-gray-500 text-sm">Loading your registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-tj-green to-black">
      {/* Header */}
      <header className="px-4 md:px-8 pt-4 pb-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl md:text-2xl text-white tracking-wide">
              Your Registrations
            </h1>
            {phone && (
              <p className="text-gray-500 text-sm mt-1">
                {formatPhone(phone)}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      <div className="px-4 md:px-8 pb-12">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Empty state */}
          {registrations.length === 0 && !error && (
            <div className="text-center py-16">
              <Car size={48} className="text-gray-700 mx-auto mb-4" />
              <h2 className="font-display text-lg text-gray-400 mb-2">No Registrations Found</h2>
              <p className="text-gray-600 text-sm max-w-sm mx-auto">
                No registrations found for this phone number. If you recently purchased a vehicle, your registration may still be processing.
              </p>
            </div>
          )}

          {/* Active Registrations */}
          {active.length > 0 && (
            <section>
              <h2 className="text-[10px] uppercase tracking-widest text-tj-gold font-bold mb-3">
                Active ({active.length})
              </h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {active.map((reg) => (
                    <RegistrationCard
                      key={reg.id}
                      registration={reg}
                      onPrefUpdate={(newPref) => handlePrefUpdate(reg.id, newPref)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Completed Registrations (collapsible) */}
          {completed.length > 0 && (
            <section>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3 hover:text-gray-300 transition-colors"
              >
                {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Completed ({completed.length})
              </button>
              <AnimatePresence>
                {showCompleted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {completed.map((reg) => (
                      <RegistrationCard
                        key={reg.id}
                        registration={reg}
                        muted
                        onPrefUpdate={(newPref) => handlePrefUpdate(reg.id, newPref)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

// ================================================================
// Registration Card Component
// ================================================================

interface RegistrationCardProps {
  registration: DashboardRegistration;
  muted?: boolean;
  onPrefUpdate: (newPref: NotificationPreference) => void;
}

const RegistrationCard: React.FC<RegistrationCardProps> = ({
  registration,
  muted = false,
  onPrefUpdate,
}) => {
  const currentIdx = stageIndex(registration.currentStage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-lg border p-4 transition-colors ${
        muted
          ? 'bg-white/[0.02] border-white/5'
          : 'bg-white/5 border-white/10 hover:border-tj-gold/20'
      }`}
    >
      {/* Top row: Vehicle + Preferences */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className={`font-display text-base tracking-wide ${muted ? 'text-gray-500' : 'text-white'}`}>
            {registration.vehicleYear} {registration.vehicleMake} {registration.vehicleModel}
          </h3>
          <p className="text-gray-600 text-xs mt-0.5">
            Order: {registration.orderId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationPreferences
            registrationId={registration.id}
            currentPreference={registration.notificationPref}
            onUpdate={onPrefUpdate}
            compact
          />
        </div>
      </div>

      {/* Stage badge */}
      <div className="mb-3">
        <span className={`inline-block text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-medium ${getStageBadgeClasses(registration.currentStage)}`}>
          {getStageLabel(registration.currentStage)}
        </span>
      </div>

      {/* Mini progress bar (6 segments) */}
      <div className="flex gap-1 mb-3">
        {STAGE_ORDER.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              idx <= currentIdx
                ? registration.currentStage === 'rejected'
                  ? 'bg-red-500/60'
                  : 'bg-tj-gold'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* View Details link */}
      <Link
        to={`/track/${registration.orderId}-${registration.accessToken}`}
        className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
          muted
            ? 'text-gray-600 hover:text-gray-400'
            : 'text-tj-gold hover:text-white'
        }`}
      >
        View Details <ExternalLink size={12} />
      </Link>
    </motion.div>
  );
};

export default CustomerDashboard;
