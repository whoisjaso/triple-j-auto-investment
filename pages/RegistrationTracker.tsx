/**
 * Registration Status Tracker - Customer-Facing Page
 * Accessed via /track or /track/:orderId
 * Projects authority and transparency through locked-stage visibility
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle,
  Clock,
  Circle,
  AlertCircle,
  Car,
  Shield,
  ClipboardCheck,
  FileText,
  Building,
  CheckCircle2,
  Package,
  ChevronRight,
  Phone,
  Mail,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { getRegistrationByOrderId } from '../services/registrationService';
import {
  Registration,
  RegistrationStage,
  REGISTRATION_STAGES,
  OWNERSHIP_COLORS,
  STATUS_COLORS,
  RegistrationStageStatus
} from '../types';

// Stage icons mapping
const STAGE_ICONS: Record<string, React.ReactNode> = {
  payment: <Shield size={20} />,
  insurance: <FileText size={20} />,
  inspection: <ClipboardCheck size={20} />,
  submission: <FileText size={20} />,
  dmv_processing: <Building size={20} />,
  approved: <CheckCircle2 size={20} />,
  ready: <Package size={20} />
};

const RegistrationTracker: React.FC = () => {
  const { orderId: urlOrderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();

  const [orderIdInput, setOrderIdInput] = useState(urlOrderId || '');
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Auto-fetch if orderId is in URL
  useEffect(() => {
    if (urlOrderId) {
      handleSearch(urlOrderId);
    }
  }, [urlOrderId]);

  const handleSearch = async (id?: string) => {
    const searchId = (id || orderIdInput).trim().toUpperCase();

    if (!searchId) {
      setError('Please enter your order ID');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const result = await getRegistrationByOrderId(searchId);

      if (result) {
        setRegistration(result);
        // Update URL without reloading
        if (!urlOrderId || urlOrderId !== searchId) {
          navigate(`/track/${searchId}`, { replace: true });
        }
      } else {
        setError('Registration not found. Please check your order ID and try again.');
        setRegistration(null);
      }
    } catch (err) {
      console.error('Error fetching registration:', err);
      setError('Unable to retrieve registration status. Please try again later.');
      setRegistration(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStageStatus = (stageKey: string): RegistrationStage | undefined => {
    return registration?.stages?.find(s => s.stageKey === stageKey);
  };

  const getStatusIcon = (status: RegistrationStageStatus) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'pending':
        return <Clock className="text-amber-400 animate-pulse" size={20} />;
      case 'blocked':
        return <AlertCircle className="text-red-400" size={20} />;
      default:
        return <Circle className="text-gray-600" size={20} />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Car className="text-tj-gold" size={32} />
            <h1 className="text-2xl md:text-3xl text-white font-display tracking-wider">
              Registration Status
            </h1>
          </div>
          <p className="text-gray-500 text-sm tracking-wide max-w-md mx-auto">
            Track your vehicle registration progress in real-time. Enter your order ID to view current status.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-tj-dark border border-gray-800 p-6 md:p-8 mb-8">
          <label className="block text-[10px] uppercase tracking-[0.3em] text-tj-gold mb-3">
            Order ID
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="TJ-2024-0001"
                className="w-full bg-black border border-gray-700 px-4 py-3 text-white font-mono tracking-wider focus:outline-none focus:border-tj-gold transition-colors placeholder-gray-700"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-3 bg-tj-gold text-black font-bold text-sm tracking-wider hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Search size={18} />
              )}
              <span className="hidden sm:inline">TRACK</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 border border-red-500/30 bg-red-900/20 text-red-400 text-sm flex items-start gap-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Registration Details */}
        {registration && (
          <div className="space-y-6 animate-fade-in">
            {/* Vehicle Info Card */}
            <div className="bg-tj-dark border border-gray-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Vehicle</p>
                  <h2 className="text-white text-xl font-display tracking-wide">
                    {registration.vehicleYear} {registration.vehicleMake} {registration.vehicleModel}
                  </h2>
                  <p className="text-gray-600 text-xs font-mono mt-1">
                    VIN: {registration.vin.slice(0, 11)}******
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Order</p>
                  <p className="text-tj-gold font-mono tracking-wider">{registration.orderId}</p>
                  <p className="text-gray-600 text-xs mt-1">
                    Purchased {formatDate(registration.purchaseDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Stage Pipeline */}
            <div className="bg-tj-dark border border-gray-800 p-6 md:p-8">
              <h3 className="text-white text-sm uppercase tracking-[0.2em] mb-8 pb-4 border-b border-gray-800">
                Registration Progress
              </h3>

              <div className="space-y-0">
                {REGISTRATION_STAGES.map((stageConfig, index) => {
                  const stage = getStageStatus(stageConfig.key);
                  const status = stage?.status || 'waiting';
                  const isLast = index === REGISTRATION_STAGES.length - 1;
                  const isCurrent = registration.currentStage === stageConfig.key;
                  const ownershipColors = OWNERSHIP_COLORS[stageConfig.ownership];

                  return (
                    <div key={stageConfig.key} className="relative">
                      {/* Connecting Line */}
                      {!isLast && (
                        <div
                          className={`absolute left-[19px] top-[48px] w-0.5 h-[calc(100%-24px)] ${
                            status === 'complete' ? 'bg-green-500/50' : 'bg-gray-800'
                          }`}
                        />
                      )}

                      {/* Stage Row */}
                      <div
                        className={`relative flex items-start gap-4 p-4 rounded transition-colors ${
                          isCurrent ? 'bg-white/5' : ''
                        } ${status === 'blocked' ? 'bg-red-900/10' : ''}`}
                      >
                        {/* Status Icon */}
                        <div
                          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${
                            status === 'complete'
                              ? 'bg-green-500/20 border-green-500/50'
                              : status === 'pending'
                              ? 'bg-amber-500/20 border-amber-500/50'
                              : status === 'blocked'
                              ? 'bg-red-500/20 border-red-500/50'
                              : 'bg-gray-900 border-gray-700'
                          }`}
                        >
                          {getStatusIcon(status)}
                        </div>

                        {/* Stage Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                            <h4 className="text-white font-medium tracking-wide">
                              {stageConfig.label}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider rounded ${ownershipColors.bg} ${ownershipColors.text} border ${ownershipColors.border}`}
                            >
                              {stageConfig.ownershipLabel}
                            </span>
                          </div>

                          {/* Status-specific messaging */}
                          {status === 'complete' && stage?.completedAt && (
                            <p className="text-green-400 text-xs">
                              Completed {formatDate(stage.completedAt)}
                            </p>
                          )}

                          {status === 'pending' && (
                            <p className="text-amber-400 text-xs">
                              {stageConfig.ownership === 'customer' && stageConfig.actionRequiredText
                                ? stageConfig.actionRequiredText
                                : stageConfig.description}
                            </p>
                          )}

                          {status === 'blocked' && (
                            <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded">
                              <p className="text-red-400 text-xs font-medium flex items-center gap-2">
                                <AlertCircle size={14} />
                                Attention Required
                              </p>
                              {stage?.blockedReason && (
                                <p className="text-red-300/80 text-xs mt-1">
                                  {stage.blockedReason}
                                </p>
                              )}
                            </div>
                          )}

                          {status === 'waiting' && (
                            <p className="text-gray-600 text-xs">{stageConfig.description}</p>
                          )}

                          {/* Expected Duration */}
                          {status === 'pending' && stageConfig.expectedDuration && (
                            <p className="text-gray-500 text-xs mt-1">
                              Expected: {stageConfig.expectedDuration}
                            </p>
                          )}
                        </div>

                        {/* Stage Icon */}
                        <div
                          className={`shrink-0 hidden md:flex items-center justify-center w-10 h-10 ${
                            status === 'complete'
                              ? 'text-green-500/50'
                              : status === 'pending'
                              ? 'text-amber-500/50'
                              : 'text-gray-700'
                          }`}
                        >
                          {STAGE_ICONS[stageConfig.key]}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-tj-dark border border-gray-800 p-6">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-4">
                Questions about your registration?
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="tel:+17135550192"
                  className="flex items-center gap-3 px-4 py-3 bg-black border border-gray-700 hover:border-tj-gold transition-colors group"
                >
                  <Phone size={16} className="text-tj-gold" />
                  <span className="text-white text-sm">(713) 555-0192</span>
                  <ChevronRight
                    size={14}
                    className="text-gray-600 group-hover:text-tj-gold ml-auto transition-colors"
                  />
                </a>
                <a
                  href="mailto:registration@triplejautoinvestment.com"
                  className="flex items-center gap-3 px-4 py-3 bg-black border border-gray-700 hover:border-tj-gold transition-colors group"
                >
                  <Mail size={16} className="text-tj-gold" />
                  <span className="text-white text-sm truncate">
                    registration@triplejautoinvestment.com
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-gray-600 group-hover:text-tj-gold ml-auto transition-colors"
                  />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Empty State (after search with no result) */}
        {searched && !registration && !loading && !error && (
          <div className="text-center py-16">
            <Car className="mx-auto text-gray-700 mb-4" size={48} />
            <p className="text-gray-500">No registration found for this order ID.</p>
          </div>
        )}

        {/* Initial State (before any search) */}
        {!searched && !urlOrderId && (
          <div className="text-center py-16 border border-gray-800/50 bg-white/[0.02]">
            <Shield className="mx-auto text-gray-700 mb-4" size={48} />
            <p className="text-gray-600 text-sm mb-2">Enter your order ID above to track your registration</p>
            <p className="text-gray-700 text-xs">
              Your order ID was provided in your purchase confirmation
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationTracker;
