/**
 * Insurance Verification Panel
 * Phase 08-02: Insurance Verification UI
 *
 * Renders INLINE inside BookingDetail (same pattern as RegistrationChecker
 * rendering inside Registrations.tsx expanded row). NOT a modal.
 *
 * Sections:
 * 1. Insurance Info Display / Edit Form (customer_provided or dealer_coverage)
 * 2. System Verification Flags (5 checks via validateInsuranceCoverage)
 * 3. Admin Verification Actions (verify, reject, override with notes)
 * 4. Insurance Card Upload (image/pdf with preview)
 *
 * Pre-fills from customer's last insurance via getCustomerLastInsurance.
 * After create/update for customer_provided, calls updateCustomerInsuranceCache.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Upload,
  ExternalLink,
  Image,
  FileText,
} from 'lucide-react';
import {
  RentalBooking,
  RentalInsurance,
  InsuranceType,
  InsuranceVerificationStatus,
  InsuranceVerificationFlags,
  TEXAS_MINIMUM_COVERAGE,
  TEXAS_MINIMUM_LABEL,
  INSURANCE_STATUS_LABELS,
} from '../../types';
import {
  getInsuranceForBooking,
  createInsurance,
  updateInsurance,
  verifyInsurance,
  failInsurance,
  overrideInsurance,
  uploadInsuranceCard,
  validateInsuranceCoverage,
  updateCustomerInsuranceCache,
  getCustomerLastInsurance,
} from '../../services/insuranceService';

// ================================================================
// TYPES
// ================================================================

interface InsuranceVerificationProps {
  booking: RentalBooking;
  onRefresh: () => Promise<void>;
}

// ================================================================
// STATUS BADGE COLORS
// ================================================================

const STATUS_COLORS: Record<InsuranceVerificationStatus, string> = {
  pending: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  verified: 'bg-green-500/20 text-green-400 border-green-500/50',
  failed: 'bg-red-500/20 text-red-400 border-red-500/50',
  overridden: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
};

// ================================================================
// VERIFICATION FLAG LABELS
// ================================================================

const FLAG_LABELS: { key: keyof InsuranceVerificationFlags; label: string }[] = [
  { key: 'hasRequiredFields', label: 'Required fields complete' },
  { key: 'coverageMeetsMinimum', label: `Coverage meets Texas ${TEXAS_MINIMUM_LABEL} minimum` },
  { key: 'policyNotExpired', label: 'Policy not expired' },
  { key: 'noExpiryDuringRental', label: 'No expiry during rental period' },
  { key: 'cardImageUploaded', label: 'Insurance card uploaded' },
];

// ================================================================
// COMPONENT
// ================================================================

const InsuranceVerification: React.FC<InsuranceVerificationProps> = ({
  booking,
  onRefresh,
}) => {
  // Section collapsed/expanded
  const [isExpanded, setIsExpanded] = useState(true);

  // Insurance record state
  const [insurance, setInsurance] = useState<RentalInsurance | null>(null);
  const [loadingInsurance, setLoadingInsurance] = useState(true);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [preFilled, setPreFilled] = useState(false);

  // Form state
  const [insType, setInsType] = useState<InsuranceType>('customer_provided');
  const [company, setCompany] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [biPerPerson, setBiPerPerson] = useState('');
  const [biPerAccident, setBiPerAccident] = useState('');
  const [propertyDamage, setPropertyDamage] = useState('');
  const [dealerDailyRate, setDealerDailyRate] = useState('');

  // Action state
  const [saving, setSaving] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);

  // ================================================================
  // LOAD INSURANCE DATA
  // ================================================================

  useEffect(() => {
    let cancelled = false;
    setLoadingInsurance(true);

    getInsuranceForBooking(booking.id).then(result => {
      if (cancelled) return;
      if (result) {
        setInsurance(result);
        populateFormFromInsurance(result);
      } else {
        // No insurance record yet -- try to pre-fill from customer last insurance
        if (booking.customerId) {
          getCustomerLastInsurance(booking.customerId).then(cached => {
            if (cancelled) return;
            if (cached) {
              if (cached.company) setCompany(cached.company);
              if (cached.policyNumber) setPolicyNumber(cached.policyNumber);
              if (cached.expiry) setExpirationDate(cached.expiry);
              setPreFilled(true);
            }
          });
        }
      }
      setLoadingInsurance(false);
    });

    return () => { cancelled = true; };
  }, [booking.id, booking.customerId]);

  // ================================================================
  // FORM HELPERS
  // ================================================================

  const populateFormFromInsurance = (ins: RentalInsurance) => {
    setInsType(ins.insuranceType);
    setCompany(ins.insuranceCompany || '');
    setPolicyNumber(ins.policyNumber || '');
    setEffectiveDate(ins.effectiveDate || '');
    setExpirationDate(ins.expirationDate || '');
    setBiPerPerson(ins.bodilyInjuryPerPerson != null ? String(ins.bodilyInjuryPerPerson) : '');
    setBiPerAccident(ins.bodilyInjuryPerAccident != null ? String(ins.bodilyInjuryPerAccident) : '');
    setPropertyDamage(ins.propertyDamage != null ? String(ins.propertyDamage) : '');
    setDealerDailyRate(ins.dealerCoverageDailyRate != null ? String(ins.dealerCoverageDailyRate) : '');
  };

  // Compute rental days for dealer coverage total
  const rentalDays = useMemo(() => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }, [booking.startDate, booking.endDate]);

  const dealerTotal = useMemo(() => {
    const rate = parseFloat(dealerDailyRate);
    if (isNaN(rate) || rate <= 0) return 0;
    return rate * rentalDays;
  }, [dealerDailyRate, rentalDays]);

  // Compute verification flags
  const verificationFlags = useMemo((): InsuranceVerificationFlags | null => {
    if (!insurance && !isEditing) return null;

    // Use form values when editing, insurance record otherwise
    const data = isEditing || !insurance ? {
      insuranceCompany: company || undefined,
      policyNumber: policyNumber || undefined,
      effectiveDate: effectiveDate || undefined,
      expirationDate: expirationDate || undefined,
      bodilyInjuryPerPerson: biPerPerson ? parseInt(biPerPerson, 10) : undefined,
      bodilyInjuryPerAccident: biPerAccident ? parseInt(biPerAccident, 10) : undefined,
      propertyDamage: propertyDamage ? parseInt(propertyDamage, 10) : undefined,
      cardImageUrl: insurance?.cardImageUrl,
    } : {
      insuranceCompany: insurance.insuranceCompany,
      policyNumber: insurance.policyNumber,
      effectiveDate: insurance.effectiveDate,
      expirationDate: insurance.expirationDate,
      bodilyInjuryPerPerson: insurance.bodilyInjuryPerPerson,
      bodilyInjuryPerAccident: insurance.bodilyInjuryPerAccident,
      propertyDamage: insurance.propertyDamage,
      cardImageUrl: insurance.cardImageUrl,
    };

    return validateInsuranceCoverage(data as Partial<RentalInsurance>, booking.endDate);
  }, [insurance, isEditing, company, policyNumber, effectiveDate, expirationDate,
      biPerPerson, biPerAccident, propertyDamage, booking.endDate]);

  const allFlagsPassed = verificationFlags
    ? Object.values(verificationFlags).every(Boolean)
    : false;

  const failedFlagCount = verificationFlags
    ? Object.values(verificationFlags).filter(v => !v).length
    : 0;

  // ================================================================
  // HANDLERS
  // ================================================================

  const handleSave = async () => {
    setSaving(true);
    try {
      if (insurance) {
        // Update existing
        const result = await updateInsurance(insurance.id, {
          insuranceType: insType,
          insuranceCompany: company || undefined,
          policyNumber: policyNumber || undefined,
          effectiveDate: effectiveDate || undefined,
          expirationDate: expirationDate || undefined,
          bodilyInjuryPerPerson: biPerPerson ? parseInt(biPerPerson, 10) : undefined,
          bodilyInjuryPerAccident: biPerAccident ? parseInt(biPerAccident, 10) : undefined,
          propertyDamage: propertyDamage ? parseInt(propertyDamage, 10) : undefined,
          dealerCoverageDailyRate: insType === 'dealer_coverage' && dealerDailyRate ? parseFloat(dealerDailyRate) : undefined,
          dealerCoverageTotal: insType === 'dealer_coverage' ? dealerTotal : undefined,
          bookingEndDate: booking.endDate,
        });
        if (result) {
          setInsurance(result);
          setIsEditing(false);
          // Cache customer insurance for future pre-fill
          if (insType === 'customer_provided' && booking.customerId) {
            await updateCustomerInsuranceCache(booking.customerId, {
              insuranceCompany: company,
              policyNumber: policyNumber,
              expirationDate: expirationDate,
            });
          }
          await onRefresh();
        }
      } else {
        // Create new
        const result = await createInsurance({
          bookingId: booking.id,
          insuranceType: insType,
          insuranceCompany: company || undefined,
          policyNumber: policyNumber || undefined,
          effectiveDate: effectiveDate || undefined,
          expirationDate: expirationDate || undefined,
          bodilyInjuryPerPerson: biPerPerson ? parseInt(biPerPerson, 10) : undefined,
          bodilyInjuryPerAccident: biPerAccident ? parseInt(biPerAccident, 10) : undefined,
          propertyDamage: propertyDamage ? parseInt(propertyDamage, 10) : undefined,
          dealerCoverageDailyRate: insType === 'dealer_coverage' && dealerDailyRate ? parseFloat(dealerDailyRate) : undefined,
          dealerCoverageTotal: insType === 'dealer_coverage' ? dealerTotal : undefined,
          bookingEndDate: booking.endDate,
        });
        if (result) {
          setInsurance(result);
          setIsEditing(false);
          setPreFilled(false);
          // Cache customer insurance for future pre-fill
          if (insType === 'customer_provided' && booking.customerId) {
            await updateCustomerInsuranceCache(booking.customerId, {
              insuranceCompany: company,
              policyNumber: policyNumber,
              expirationDate: expirationDate,
            });
          }
          await onRefresh();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    if (!insurance) return;
    setSaving(true);
    try {
      const success = await verifyInsurance(insurance.id, 'admin', actionNotes.trim() || undefined);
      if (success) {
        setActionNotes('');
        const updated = await getInsuranceForBooking(booking.id);
        if (updated) {
          setInsurance(updated);
          populateFormFromInsurance(updated);
        }
        await onRefresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!insurance || !actionNotes.trim()) return;
    setSaving(true);
    try {
      const success = await failInsurance(insurance.id, 'admin', actionNotes.trim());
      if (success) {
        setActionNotes('');
        setShowRejectConfirm(false);
        const updated = await getInsuranceForBooking(booking.id);
        if (updated) {
          setInsurance(updated);
          populateFormFromInsurance(updated);
        }
        await onRefresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleOverride = async () => {
    if (!insurance || !actionNotes.trim()) return;
    setSaving(true);
    try {
      const success = await overrideInsurance(insurance.id, 'admin', actionNotes.trim());
      if (success) {
        setActionNotes('');
        setShowOverrideConfirm(false);
        const updated = await getInsuranceForBooking(booking.id);
        if (updated) {
          setInsurance(updated);
          populateFormFromInsurance(updated);
        }
        await onRefresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeVerification = async () => {
    if (!insurance) return;
    setSaving(true);
    try {
      // Revoke by setting back to pending
      const result = await updateInsurance(insurance.id, {
        verificationNotes: 'Verification revoked by admin',
      });
      if (result) {
        // Also need to directly reset the status
        const { supabase } = await import('../../supabase/config');
        await supabase
          .from('rental_insurance')
          .update({
            verification_status: 'pending',
            verified_by: null,
            verified_at: null,
            verification_notes: 'Verification revoked by admin',
          })
          .eq('id', insurance.id);

        const updated = await getInsuranceForBooking(booking.id);
        if (updated) {
          setInsurance(updated);
          populateFormFromInsurance(updated);
        }
        await onRefresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !insurance) return;

    setUploading(true);
    try {
      const url = await uploadInsuranceCard(booking.id, file);
      if (url) {
        const updated = await getInsuranceForBooking(booking.id);
        if (updated) {
          setInsurance(updated);
          populateFormFromInsurance(updated);
        }
        await onRefresh();
      }
    } finally {
      setUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  // ================================================================
  // BADGE
  // ================================================================

  const getBadge = () => {
    if (!insurance) {
      return { label: 'NO INSURANCE', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' };
    }
    const status = insurance.verificationStatus;
    return {
      label: INSURANCE_STATUS_LABELS[status].toUpperCase(),
      color: STATUS_COLORS[status],
    };
  };

  const badge = getBadge();

  // ================================================================
  // RENDER
  // ================================================================

  if (loadingInsurance) {
    return (
      <div className="mb-6 pb-6 border-b border-gray-800">
        <div className="flex items-center gap-3 py-4">
          <Loader2 size={16} className="text-tj-gold animate-spin" />
          <span className="text-gray-500 text-sm">Loading insurance data...</span>
        </div>
      </div>
    );
  }

  const showForm = !insurance || isEditing;
  const isCustomerProvided = insType === 'customer_provided';

  return (
    <div className="mb-6 pb-6 border-b border-gray-800">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown size={16} className="text-gray-500" />
          ) : (
            <ChevronRight size={16} className="text-gray-500" />
          )}
          <Shield size={16} className="text-tj-gold" />
          <h4 className="text-white text-sm uppercase tracking-widest">
            Insurance Verification
          </h4>
        </div>
        <span
          className={`px-3 py-1 text-[10px] uppercase tracking-wider border ${badge.color}`}
        >
          {badge.label}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-5 pl-2">

          {/* ============================================================ */}
          {/* Section 1: Insurance Info Display / Edit Form */}
          {/* ============================================================ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest">
                Insurance Information
              </p>
              {insurance && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-2 py-1 text-[10px] uppercase tracking-wider border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                >
                  Edit
                </button>
              )}
              {isEditing && insurance && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    populateFormFromInsurance(insurance);
                  }}
                  className="px-2 py-1 text-[10px] uppercase tracking-wider border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {showForm ? (
              <div className="space-y-4">
                {/* Pre-fill notice */}
                {preFilled && !insurance && (
                  <p className="text-gray-500 text-xs italic">
                    Pre-filled from previous rental. Please verify details.
                  </p>
                )}

                {/* Insurance type toggle */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                    Insurance Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInsType('customer_provided')}
                      className={`flex-1 px-3 py-2.5 text-xs uppercase tracking-wider border transition-colors ${
                        insType === 'customer_provided'
                          ? 'bg-tj-gold text-black border-tj-gold font-bold'
                          : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      Customer Insurance
                    </button>
                    <button
                      type="button"
                      onClick={() => setInsType('dealer_coverage')}
                      className={`flex-1 px-3 py-2.5 text-xs uppercase tracking-wider border transition-colors ${
                        insType === 'dealer_coverage'
                          ? 'bg-tj-gold text-black border-tj-gold font-bold'
                          : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      Dealer Coverage
                    </button>
                  </div>
                </div>

                {isCustomerProvided ? (
                  <>
                    {/* Company + Policy */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                          Insurance Company
                        </label>
                        <input
                          type="text"
                          value={company}
                          onChange={e => setCompany(e.target.value)}
                          placeholder="e.g., State Farm, GEICO"
                          className="w-full bg-black border border-gray-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold transition-colors placeholder-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                          Policy Number
                        </label>
                        <input
                          type="text"
                          value={policyNumber}
                          onChange={e => setPolicyNumber(e.target.value)}
                          placeholder="Policy #"
                          className="w-full bg-black border border-gray-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold transition-colors placeholder-gray-600 font-mono"
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                          Effective Date
                        </label>
                        <input
                          type="date"
                          value={effectiveDate}
                          onChange={e => setEffectiveDate(e.target.value)}
                          className="w-full bg-black border border-gray-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                          Expiration Date
                        </label>
                        <input
                          type="date"
                          value={expirationDate}
                          onChange={e => setExpirationDate(e.target.value)}
                          className="w-full bg-black border border-gray-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold transition-colors"
                        />
                      </div>
                    </div>

                    {/* Coverage amounts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                          Bodily Injury / Person
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">$</span>
                          <input
                            type="number"
                            value={biPerPerson}
                            onChange={e => setBiPerPerson(e.target.value)}
                            placeholder={`Min: $${TEXAS_MINIMUM_COVERAGE.bodilyInjuryPerPerson.toLocaleString()}`}
                            className="w-full bg-black border border-gray-700 pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold transition-colors placeholder-gray-600 font-mono"
                            min="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                          Bodily Injury / Accident
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">$</span>
                          <input
                            type="number"
                            value={biPerAccident}
                            onChange={e => setBiPerAccident(e.target.value)}
                            placeholder={`Min: $${TEXAS_MINIMUM_COVERAGE.bodilyInjuryPerAccident.toLocaleString()}`}
                            className="w-full bg-black border border-gray-700 pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold transition-colors placeholder-gray-600 font-mono"
                            min="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                          Property Damage
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">$</span>
                          <input
                            type="number"
                            value={propertyDamage}
                            onChange={e => setPropertyDamage(e.target.value)}
                            placeholder={`Min: $${TEXAS_MINIMUM_COVERAGE.propertyDamage.toLocaleString()}`}
                            className="w-full bg-black border border-gray-700 pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold transition-colors placeholder-gray-600 font-mono"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 text-[11px]">
                      Texas requires minimum {TEXAS_MINIMUM_LABEL} liability coverage
                      ($30,000/$60,000/$25,000).
                    </p>
                  </>
                ) : (
                  /* Dealer coverage fields */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                        Dealer Coverage Daily Rate
                      </label>
                      <div className="relative w-40">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">$</span>
                        <input
                          type="number"
                          value={dealerDailyRate}
                          onChange={e => setDealerDailyRate(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-black border border-gray-700 pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold transition-colors placeholder-gray-600 font-mono"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    {dealerTotal > 0 && (
                      <p className="text-gray-300 text-sm">
                        Dealer provides coverage at <span className="text-tj-gold font-mono">${parseFloat(dealerDailyRate).toFixed(2)}/day</span>.
                        Total: <span className="text-tj-gold font-mono font-bold">${dealerTotal.toFixed(2)}</span> for {rentalDays} day{rentalDays !== 1 ? 's' : ''}.
                      </p>
                    )}
                  </div>
                )}

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 bg-tj-gold text-black text-xs font-bold tracking-wider hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Check size={14} />
                  )}
                  {insurance ? 'Update Insurance' : 'Save Insurance'}
                </button>
              </div>
            ) : (
              /* Read-only display */
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Type:</span>{' '}
                    <span className="text-white">
                      {insurance.insuranceType === 'customer_provided' ? 'Customer Provided' : 'Dealer Coverage'}
                    </span>
                  </div>
                  {insurance.insuranceType === 'customer_provided' ? (
                    <>
                      <div>
                        <span className="text-gray-500">Company:</span>{' '}
                        <span className="text-white">{insurance.insuranceCompany || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Policy #:</span>{' '}
                        <span className="text-white font-mono">{insurance.policyNumber || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Effective:</span>{' '}
                        <span className="text-white">{insurance.effectiveDate || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Expires:</span>{' '}
                        <span className={`${
                          insurance.expiresDuringRental ? 'text-red-400 font-bold' : 'text-white'
                        }`}>
                          {insurance.expirationDate || '-'}
                          {insurance.expiresDuringRental && ' (during rental!)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">BI/Person:</span>{' '}
                        <span className="text-white font-mono">
                          {insurance.bodilyInjuryPerPerson != null
                            ? `$${insurance.bodilyInjuryPerPerson.toLocaleString()}`
                            : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">BI/Accident:</span>{' '}
                        <span className="text-white font-mono">
                          {insurance.bodilyInjuryPerAccident != null
                            ? `$${insurance.bodilyInjuryPerAccident.toLocaleString()}`
                            : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Property Dmg:</span>{' '}
                        <span className="text-white font-mono">
                          {insurance.propertyDamage != null
                            ? `$${insurance.propertyDamage.toLocaleString()}`
                            : '-'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-gray-500">Daily Rate:</span>{' '}
                        <span className="text-white font-mono">
                          {insurance.dealerCoverageDailyRate != null
                            ? `$${insurance.dealerCoverageDailyRate.toFixed(2)}/day`
                            : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>{' '}
                        <span className="text-tj-gold font-mono font-bold">
                          {insurance.dealerCoverageTotal != null
                            ? `$${insurance.dealerCoverageTotal.toFixed(2)}`
                            : '-'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* Section 2: System Verification Flags */}
          {/* ============================================================ */}
          {insurance && insType === 'customer_provided' && verificationFlags && (
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                System Checks
              </p>
              <div className="space-y-1.5">
                {FLAG_LABELS.map(flag => {
                  const passed = verificationFlags[flag.key];
                  return (
                    <div
                      key={flag.key}
                      className={`flex items-center gap-2.5 px-3 py-2 border transition-colors ${
                        passed
                          ? 'border-green-500/30 bg-green-500/10'
                          : 'border-red-500/30 bg-red-500/10'
                      }`}
                    >
                      {passed ? (
                        <CheckCircle size={14} className="text-green-400 shrink-0" />
                      ) : (
                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                      )}
                      <span className={`text-xs ${passed ? 'text-green-400' : 'text-red-400'}`}>
                        {flag.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* Section 3: Admin Verification Actions */}
          {/* ============================================================ */}
          {insurance && (
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                Verification Status
              </p>

              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border font-bold ${
                    STATUS_COLORS[insurance.verificationStatus]
                  }`}
                >
                  {INSURANCE_STATUS_LABELS[insurance.verificationStatus]}
                </span>

                {insurance.verifiedBy && insurance.verifiedAt && (
                  <span className="text-gray-500 text-xs">
                    by {insurance.verifiedBy} on{' '}
                    {new Date(insurance.verifiedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Verification notes display */}
              {insurance.verificationNotes && (
                <p className="text-gray-400 text-xs mb-3 italic">
                  Notes: {insurance.verificationNotes}
                </p>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                {/* Notes input for actions */}
                {(insurance.verificationStatus === 'pending' || insurance.verificationStatus === 'failed') && (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                        Verification Notes
                      </label>
                      <input
                        type="text"
                        value={actionNotes}
                        onChange={e => setActionNotes(e.target.value)}
                        className="w-full bg-black border border-gray-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold transition-colors"
                        placeholder="Optional notes (required for reject/override)"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* Verify button */}
                      <button
                        onClick={handleVerify}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                        Verify
                      </button>

                      {/* Reject button */}
                      <button
                        onClick={() => setShowRejectConfirm(true)}
                        disabled={saving || !actionNotes.trim()}
                        className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <X size={14} />
                        Reject
                      </button>

                      {/* Override button (when flags are failing) */}
                      {failedFlagCount > 0 && (
                        <button
                          onClick={() => setShowOverrideConfirm(true)}
                          disabled={saving || !actionNotes.trim()}
                          className="px-4 py-2 border border-amber-500/50 text-amber-400 text-xs font-bold uppercase tracking-wider hover:bg-amber-900/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <AlertCircle size={14} />
                          Override and Verify
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* Revoke button for verified status */}
                {insurance.verificationStatus === 'verified' && (
                  <button
                    onClick={handleRevokeVerification}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-700 text-gray-400 text-xs font-bold uppercase tracking-wider hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
                    Revoke Verification
                  </button>
                )}

                {/* Overridden info */}
                {insurance.verificationStatus === 'overridden' && (
                  <div className="bg-amber-900/10 border border-amber-800/30 p-3 text-xs text-amber-400">
                    <p className="font-bold mb-1">
                      Overridden by {insurance.verifiedBy || 'admin'} on{' '}
                      {insurance.verifiedAt
                        ? new Date(insurance.verifiedAt).toLocaleDateString()
                        : 'unknown date'}
                    </p>
                    {insurance.verificationNotes && (
                      <p className="text-amber-400/80">Notes: {insurance.verificationNotes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* Section 4: Insurance Card Upload */}
          {/* ============================================================ */}
          {insurance && (
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                Insurance Card
              </p>

              {insurance.cardImageUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-16 border border-gray-700 overflow-hidden bg-black flex items-center justify-center">
                      <img
                        src={insurance.cardImageUrl}
                        alt="Insurance card"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // If image fails to load (e.g., PDF), show icon instead
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML =
                            '<div class="flex items-center justify-center w-full h-full"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>';
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <a
                        href={insurance.cardImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-tj-gold text-xs flex items-center gap-1 hover:text-white transition-colors"
                      >
                        <ExternalLink size={12} /> View Full
                      </a>
                      <label className="text-gray-400 text-xs flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                        <Upload size={12} /> Replace
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <label className={`flex items-center gap-3 px-4 py-3 border border-dashed border-gray-700 cursor-pointer hover:border-tj-gold/50 transition-colors ${
                  uploading ? 'opacity-50 pointer-events-none' : ''
                }`}>
                  {uploading ? (
                    <Loader2 size={16} className="text-tj-gold animate-spin" />
                  ) : (
                    <Upload size={16} className="text-gray-500" />
                  )}
                  <span className="text-gray-400 text-xs">
                    {uploading ? 'Uploading...' : 'Upload insurance card (image or PDF)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* Override Confirmation Dialog */}
      {/* ============================================================ */}
      {showOverrideConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-tj-dark border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-white font-display text-lg tracking-wide">
                Override Insurance Verification?
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-gray-400 text-sm">
                  {failedFlagCount} system check{failedFlagCount !== 1 ? 's have' : ' has'} not
                  passed. Override marks insurance as verified despite these issues.
                  This action will be logged.
                </p>
              </div>
              <p className="text-gray-500 text-xs">
                Notes: <span className="text-white">{actionNotes}</span>
              </p>
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
              <button
                onClick={() => setShowOverrideConfirm(false)}
                className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={saving}
                className="px-6 py-3 bg-amber-500 text-black font-bold text-sm tracking-wider hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Check size={16} />
                )}
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Reject Confirmation Dialog */}
      {/* ============================================================ */}
      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-tj-dark border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-white font-display text-lg tracking-wide">
                Reject Insurance?
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-gray-400 text-sm">
                  This will mark the insurance as failed. The customer will need to provide
                  updated insurance information.
                </p>
              </div>
              <p className="text-gray-500 text-xs">
                Notes: <span className="text-white">{actionNotes}</span>
              </p>
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
              <button
                onClick={() => setShowRejectConfirm(false)}
                className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={saving}
                className="px-6 py-3 bg-red-600 text-white font-bold text-sm tracking-wider hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <X size={16} />
                )}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceVerification;
