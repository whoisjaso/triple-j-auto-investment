/**
 * Pre-Submission Registration Checker
 * Phase 05: Registration Checker (05-02)
 *
 * Self-contained checker panel that validates documents, VIN, mileage,
 * and SURRENDERED stamp status before webDEALER submission.
 *
 * Renders as a collapsible section within the expanded registration row.
 * Manages its own state and calls service functions for persistence.
 *
 * Sections:
 * 1. Mileage Entry (pre-fill + confirm)
 * 2. Document Completeness (read from registration doc booleans)
 * 3. VIN Validation (format + check digit + cross-document confirmation)
 * 4. Mileage Cross-Document Confirmation
 * 5. SURRENDERED Stamp Verification (front + back)
 * 6. Document Ordering Guide (webDEALER submission order)
 * 7. Summary + Actions (save, override, webDEALER link)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  Circle,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FileText,
  Shield,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Pencil,
  Loader2,
  X
} from 'lucide-react';
import { Registration, CheckerResult } from '../../types';
import { validateVinFormat, validateVinCheckDigit } from '../../utils/vinValidator';
import {
  saveCheckerResults,
  saveCheckerOverride,
  updateRegistrationMileage
} from '../../services/registrationService';

// ================================================================
// TYPES & CONSTANTS
// ================================================================

interface RegistrationCheckerProps {
  registration: Registration;
  onRefresh: () => void;
}

/** Document keys for VIN cross-document confirmation */
const VIN_DOC_KEYS = [
  { key: 'title_front', label: 'VIN matches Title (Front)' },
  { key: 'title_back', label: 'VIN matches Title (Back)' },
  { key: 'form_130u', label: 'VIN matches Form 130-U' },
  { key: 'inspection', label: 'VIN matches Inspection (VIR)' },
  { key: 'insurance', label: 'VIN matches Insurance Proof' },
] as const;

/** Document keys for mileage cross-document confirmation */
const MILEAGE_DOC_KEYS = [
  { key: 'form_130u', label: 'Mileage matches Form 130-U (Box 9)' },
  { key: 'inspection', label: 'Mileage matches Inspection (VIR)' },
] as const;

/** webDEALER document submission order with tips */
const WEBDEALER_DOCUMENT_ORDER = [
  { order: 1, name: 'Title (Front)', tip: 'Verify SURRENDERED stamp is clearly visible. Must be original, not a copy.' },
  { order: 2, name: 'Title (Back)', tip: 'Verify SURRENDERED stamp on back. Check all assignment fields are properly signed.' },
  { order: 3, name: 'Form 130-U', tip: 'Verify VIN in Box 1 and Odometer in Box 9. Confirm applicant info matches buyer.' },
  { order: 4, name: 'Vehicle Inspection Report (VIR)', tip: 'Inspection must be current on submission date. Verify VIN matches.' },
  { order: 5, name: 'Proof of Insurance', tip: 'Verify policy is active and VIN matches. Must show liability coverage.' },
];

const WEBDEALER_LOGIN_URL = 'https://webdealer.txdmv.gov/title/login.do';

// ================================================================
// DEFAULT CHECKER STATE
// ================================================================

function defaultCheckerState(): CheckerResult {
  return {
    docComplete: false,
    vinFormatValid: false,
    vinConfirmedOnDocs: {},
    mileageConfirmedOnDocs: {},
    surrenderedFront: false,
    surrenderedBack: false,
  };
}

// ================================================================
// COMPONENT
// ================================================================

const RegistrationChecker: React.FC<RegistrationCheckerProps> = ({
  registration,
  onRefresh,
}) => {
  // Internal state
  const [checkerState, setCheckerState] = useState<CheckerResult>(() =>
    registration.checkerResults
      ? { ...defaultCheckerState(), ...registration.checkerResults }
      : defaultCheckerState()
  );
  const [saving, setSaving] = useState(false);
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!registration.checkerResults);
  const [editingMileage, setEditingMileage] = useState(false);
  const [mileageInput, setMileageInput] = useState<string>(
    registration.mileage != null ? String(registration.mileage) : ''
  );
  const [mileageSaving, setMileageSaving] = useState(false);

  // Sync checkerState from registration when it changes (e.g. after refresh)
  useEffect(() => {
    if (registration.checkerResults) {
      setCheckerState({ ...defaultCheckerState(), ...registration.checkerResults });
    } else {
      setCheckerState(defaultCheckerState());
    }
  }, [registration.checkerResults]);

  // Sync mileage input when registration changes
  useEffect(() => {
    setMileageInput(registration.mileage != null ? String(registration.mileage) : '');
    setEditingMileage(false);
  }, [registration.mileage]);

  // ================================================================
  // VIN VALIDATION (automatic)
  // ================================================================

  const vinFormatResult = useMemo(
    () => validateVinFormat(registration.vin),
    [registration.vin]
  );
  const vinCheckDigitResult = useMemo(
    () => (vinFormatResult.valid ? validateVinCheckDigit(registration.vin) : false),
    [registration.vin, vinFormatResult.valid]
  );
  const vinFullyValid = vinFormatResult.valid && vinCheckDigitResult;

  // Auto-update vinFormatValid and docComplete in checker state
  useEffect(() => {
    setCheckerState(prev => {
      const docComplete =
        registration.docTitleFront &&
        registration.docTitleBack &&
        registration.doc130u &&
        registration.docInsurance &&
        registration.docInspection;

      if (prev.vinFormatValid === vinFullyValid && prev.docComplete === docComplete) {
        return prev;
      }
      return { ...prev, vinFormatValid: vinFullyValid, docComplete };
    });
  }, [
    vinFullyValid,
    registration.docTitleFront,
    registration.docTitleBack,
    registration.doc130u,
    registration.docInsurance,
    registration.docInspection,
  ]);

  // ================================================================
  // COMPUTED VALUES
  // ================================================================

  const allVinDocsConfirmed = VIN_DOC_KEYS.every(
    d => checkerState.vinConfirmedOnDocs[d.key] === true
  );

  const allMileageDocsConfirmed =
    registration.mileage != null
      ? MILEAGE_DOC_KEYS.every(
          d => checkerState.mileageConfirmedOnDocs[d.key] === true
        )
      : true; // If no mileage set, skip this check for allChecksPassed

  const allChecksPassed =
    checkerState.docComplete &&
    checkerState.vinFormatValid &&
    allVinDocsConfirmed &&
    (registration.mileage != null ? allMileageDocsConfirmed : false) &&
    checkerState.surrenderedFront &&
    checkerState.surrenderedBack;

  // Count failed checks for badge
  const failedChecks = [
    !checkerState.docComplete,
    !checkerState.vinFormatValid,
    !allVinDocsConfirmed,
    registration.mileage != null ? !allMileageDocsConfirmed : true,
    !checkerState.surrenderedFront,
    !checkerState.surrenderedBack,
  ].filter(Boolean).length;

  // Determine badge state
  const getBadge = () => {
    if (!registration.checkerResults && !hasLocalChanges) {
      return { label: 'NOT CHECKED', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' };
    }
    if (registration.checkerOverride) {
      return { label: 'OVERRIDDEN', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50' };
    }
    if (allChecksPassed) {
      return { label: 'ALL CLEAR', color: 'bg-green-500/20 text-green-400 border-green-500/50' };
    }
    return {
      label: `${failedChecks} ISSUE${failedChecks !== 1 ? 'S' : ''}`,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    };
  };

  // Check if local state differs from persisted
  const hasLocalChanges = useMemo(() => {
    const persisted = registration.checkerResults;
    if (!persisted) {
      // Has changes if any boolean is true or any doc confirmed
      return (
        checkerState.surrenderedFront ||
        checkerState.surrenderedBack ||
        Object.values(checkerState.vinConfirmedOnDocs).some(Boolean) ||
        Object.values(checkerState.mileageConfirmedOnDocs).some(Boolean)
      );
    }
    return JSON.stringify(checkerState) !== JSON.stringify({ ...defaultCheckerState(), ...persisted });
  }, [checkerState, registration.checkerResults]);

  // ================================================================
  // HANDLERS
  // ================================================================

  const handleSaveMileage = async () => {
    const value = parseInt(mileageInput, 10);
    if (isNaN(value) || value < 0) return;

    setMileageSaving(true);
    try {
      await updateRegistrationMileage(registration.id, value);
      onRefresh();
    } finally {
      setMileageSaving(false);
      setEditingMileage(false);
    }
  };

  const handleSaveResults = async () => {
    setSaving(true);
    try {
      await saveCheckerResults(registration.id, checkerState, allChecksPassed);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleOverrideConfirm = async () => {
    setSaving(true);
    try {
      // Save current results first, then override
      await saveCheckerResults(registration.id, checkerState, false);
      await saveCheckerOverride(registration.id);
      onRefresh();
    } finally {
      setSaving(false);
      setShowOverrideConfirm(false);
    }
  };

  const handleVinDocToggle = (docKey: string) => {
    setCheckerState(prev => ({
      ...prev,
      vinConfirmedOnDocs: {
        ...prev.vinConfirmedOnDocs,
        [docKey]: !prev.vinConfirmedOnDocs[docKey],
      },
    }));
  };

  const handleConfirmAllVin = () => {
    setCheckerState(prev => ({
      ...prev,
      vinConfirmedOnDocs: Object.fromEntries(VIN_DOC_KEYS.map(d => [d.key, true])),
    }));
  };

  const handleMileageDocToggle = (docKey: string) => {
    setCheckerState(prev => ({
      ...prev,
      mileageConfirmedOnDocs: {
        ...prev.mileageConfirmedOnDocs,
        [docKey]: !prev.mileageConfirmedOnDocs[docKey],
      },
    }));
  };

  const badge = getBadge();

  // ================================================================
  // RENDER
  // ================================================================

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
          <ClipboardCheck size={16} className="text-tj-gold" />
          <h4 className="text-white text-sm uppercase tracking-widest">
            Pre-Submission Checker
          </h4>
        </div>
        <span
          className={`px-3 py-1 text-[10px] uppercase tracking-wider border ${badge.color}`}
        >
          {badge.label}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-6 pl-2">
          {/* ============================================================ */}
          {/* Section 1: Mileage Entry */}
          {/* ============================================================ */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">
              Odometer Reading
            </p>
            {registration.mileage == null || editingMileage ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={mileageInput}
                    onChange={e => setMileageInput(e.target.value)}
                    placeholder="Enter mileage from documents"
                    className="flex-1 bg-black border border-gray-700 px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-tj-gold"
                  />
                  <button
                    onClick={handleSaveMileage}
                    disabled={mileageSaving || !mileageInput || parseInt(mileageInput, 10) < 0}
                    className="px-4 py-2 bg-tj-gold text-black text-xs font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {mileageSaving ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Check size={14} />
                    )}
                    Save
                  </button>
                  {editingMileage && (
                    <button
                      onClick={() => {
                        setEditingMileage(false);
                        setMileageInput(
                          registration.mileage != null ? String(registration.mileage) : ''
                        );
                      }}
                      className="p-2 text-gray-500 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <p className="text-gray-600 text-xs">
                  Enter the odometer reading from the documents. This will be used for
                  cross-document consistency checks.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-mono">
                  {registration.mileage!.toLocaleString()} mi
                </span>
                <button
                  onClick={() => setEditingMileage(true)}
                  className="p-1 text-gray-500 hover:text-tj-gold transition-colors"
                  title="Edit mileage"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* Section 2: Document Completeness (REGC-01) */}
          {/* ============================================================ */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">
              Document Completeness
            </p>
            <div className="flex items-start gap-3 p-3 border border-gray-800">
              {checkerState.docComplete ? (
                <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                {checkerState.docComplete ? (
                  <span className="text-green-400 text-sm">All documents received</span>
                ) : (
                  <div>
                    <span className="text-amber-400 text-sm">Missing: </span>
                    <span className="text-amber-300 text-sm">
                      {[
                        !registration.docTitleFront && 'Title (Front)',
                        !registration.docTitleBack && 'Title (Back)',
                        !registration.doc130u && '130-U',
                        !registration.docInsurance && 'Insurance',
                        !registration.docInspection && 'Inspection',
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Section 3: VIN Validation (REGC-02) */}
          {/* ============================================================ */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">
              VIN Validation
            </p>

            {/* VIN display */}
            <div className="bg-black border border-gray-800 px-4 py-3 mb-3">
              <span className="text-white text-sm font-mono tracking-wider">
                {registration.vin}
              </span>
            </div>

            {/* Format check */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                {vinFormatResult.valid ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <AlertCircle size={14} className="text-amber-400" />
                )}
                <span
                  className={`text-sm ${
                    vinFormatResult.valid ? 'text-green-400' : 'text-amber-400'
                  }`}
                >
                  {vinFormatResult.valid
                    ? 'Format valid (17 characters, no I/O/Q)'
                    : vinFormatResult.error || 'Format invalid'}
                </span>
              </div>

              {/* Check digit */}
              <div className="flex items-center gap-2">
                {vinFormatResult.valid ? (
                  vinCheckDigitResult ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <AlertCircle size={14} className="text-amber-400" />
                  )
                ) : (
                  <Circle size={14} className="text-gray-600" />
                )}
                <span
                  className={`text-sm ${
                    !vinFormatResult.valid
                      ? 'text-gray-600'
                      : vinCheckDigitResult
                      ? 'text-green-400'
                      : 'text-amber-400'
                  }`}
                >
                  {!vinFormatResult.valid
                    ? 'Check digit (requires valid format)'
                    : vinCheckDigitResult
                    ? 'Check digit valid'
                    : 'Check digit mismatch - verify VIN is correct'}
                </span>
              </div>
            </div>

            {/* VIN Cross-Document Confirmation */}
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">
              VIN Cross-Document Confirmation
            </p>
            <div className="space-y-2 mb-2">
              {VIN_DOC_KEYS.map(doc => (
                <button
                  key={doc.key}
                  onClick={() => handleVinDocToggle(doc.key)}
                  className={`w-full p-2.5 border flex items-center gap-3 transition-colors text-left ${
                    checkerState.vinConfirmedOnDocs[doc.key]
                      ? 'border-green-500/50 bg-green-900/20 text-green-400'
                      : 'border-gray-700 text-gray-500 hover:border-gray-600'
                  }`}
                >
                  {checkerState.vinConfirmedOnDocs[doc.key] ? (
                    <Check size={14} />
                  ) : (
                    <Circle size={14} />
                  )}
                  <span className="text-xs">{doc.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleConfirmAllVin}
              disabled={allVinDocsConfirmed}
              className="px-3 py-1.5 text-xs text-gray-400 border border-gray-700 hover:border-tj-gold hover:text-tj-gold transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              Confirm All Match
            </button>
          </div>

          {/* ============================================================ */}
          {/* Section 4: Mileage Cross-Document Confirmation (REGC-03) */}
          {/* ============================================================ */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">
              Mileage Consistency
            </p>
            {registration.mileage != null ? (
              <>
                <div className="bg-black border border-gray-800 px-4 py-2 mb-3">
                  <span className="text-white text-sm font-mono">
                    {registration.mileage.toLocaleString()} mi
                  </span>
                </div>
                <div className="space-y-2">
                  {MILEAGE_DOC_KEYS.map(doc => (
                    <button
                      key={doc.key}
                      onClick={() => handleMileageDocToggle(doc.key)}
                      className={`w-full p-2.5 border flex items-center gap-3 transition-colors text-left ${
                        checkerState.mileageConfirmedOnDocs[doc.key]
                          ? 'border-green-500/50 bg-green-900/20 text-green-400'
                          : 'border-gray-700 text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      {checkerState.mileageConfirmedOnDocs[doc.key] ? (
                        <Check size={14} />
                      ) : (
                        <Circle size={14} />
                      )}
                      <span className="text-xs">{doc.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-600 text-xs italic">
                Set odometer reading above to enable mileage consistency checks.
              </p>
            )}
          </div>

          {/* ============================================================ */}
          {/* Section 5: SURRENDERED Stamp Verification (REGC-04) */}
          {/* ============================================================ */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">
              SURRENDERED Stamp Verification
            </p>
            <div className="space-y-2 mb-2">
              <button
                onClick={() =>
                  setCheckerState(prev => ({
                    ...prev,
                    surrenderedFront: !prev.surrenderedFront,
                  }))
                }
                className={`w-full p-2.5 border flex items-center gap-3 transition-colors text-left ${
                  checkerState.surrenderedFront
                    ? 'border-green-500/50 bg-green-900/20 text-green-400'
                    : 'border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
              >
                {checkerState.surrenderedFront ? (
                  <Check size={14} />
                ) : (
                  <Circle size={14} />
                )}
                <span className="text-xs">SURRENDERED stamp verified on Title FRONT</span>
              </button>
              <button
                onClick={() =>
                  setCheckerState(prev => ({
                    ...prev,
                    surrenderedBack: !prev.surrenderedBack,
                  }))
                }
                className={`w-full p-2.5 border flex items-center gap-3 transition-colors text-left ${
                  checkerState.surrenderedBack
                    ? 'border-green-500/50 bg-green-900/20 text-green-400'
                    : 'border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
              >
                {checkerState.surrenderedBack ? (
                  <Check size={14} />
                ) : (
                  <Circle size={14} />
                )}
                <span className="text-xs">SURRENDERED stamp verified on Title BACK</span>
              </button>
            </div>
            <p className="text-gray-600 text-xs">
              Both sides of the title must be stamped SURRENDERED before submission.
              Verify against the original document, not a copy.
            </p>
          </div>

          {/* ============================================================ */}
          {/* Section 6: Document Ordering Guide (REGC-05) */}
          {/* ============================================================ */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">
              webDEALER Document Order
            </p>
            <div className="space-y-2">
              {WEBDEALER_DOCUMENT_ORDER.map(doc => (
                <div
                  key={doc.order}
                  className="flex items-start gap-3 p-2.5 border border-gray-800"
                >
                  <span className="text-tj-gold font-mono text-xs w-5 shrink-0 mt-0.5">
                    {doc.order}.
                  </span>
                  <FileText size={14} className="text-gray-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white text-xs font-medium">{doc.name}</span>
                    <p className="text-gray-500 text-[11px] mt-0.5">{doc.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* Section 7: Summary + Actions */}
          {/* ============================================================ */}
          <div className="border-t border-gray-800 pt-4">
            {/* Save button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveResults}
                disabled={saving || !hasLocalChanges}
                className="px-5 py-2.5 bg-tj-gold text-black text-xs font-bold tracking-wider hover:bg-white transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Shield size={14} />
                )}
                Save Check Results
              </button>

              {/* Override button (only when not all passed) */}
              {!allChecksPassed && (
                <button
                  onClick={() => setShowOverrideConfirm(true)}
                  className="px-5 py-2.5 border border-amber-500/50 text-amber-400 text-xs font-bold tracking-wider hover:bg-amber-900/20 transition-colors flex items-center gap-2"
                >
                  <AlertCircle size={14} />
                  Override and Proceed
                </button>
              )}
            </div>

            {/* webDEALER Link */}
            {(allChecksPassed || registration.checkerOverride) && (
              <a
                href={WEBDEALER_LOGIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-tj-gold text-black font-bold text-sm tracking-wider hover:bg-white transition-colors mt-4 w-fit"
              >
                <ExternalLink size={16} />
                Open webDEALER
              </a>
            )}
          </div>
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
                Override Pre-Submission Checks?
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-gray-400 text-sm">
                  Are you sure? {failedChecks} check{failedChecks !== 1 ? 's have' : ' has'} not
                  passed. Override allows submission but issues may cause DMV rejection.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
              <button
                onClick={() => setShowOverrideConfirm(false)}
                className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideConfirm}
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
    </div>
  );
};

export default RegistrationChecker;
