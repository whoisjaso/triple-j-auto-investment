"use client";

import { useState, useMemo, Component, type ReactNode } from 'react';
import { ChevronRight, ChevronLeft, Check, Share2, Copy, Send, AlertCircle } from 'lucide-react';
import {
  encodeCompletedLink, saveAgreement, compressIdPhoto, compressIdPhotoForUrl,
  generateCompletedPortalLink,
  type CustomerLinkData, type CustomerSection,
} from '@/lib/documents/customerPortal';
import { ContractData } from '@/lib/documents/finance';
import { RentalData } from '@/lib/documents/rental';
import { BillOfSaleData } from '@/lib/documents/billOfSale';
import { Form130UData } from '@/lib/documents/form130U';
import { SignatureData, emptySignatures, DEALER_NAME, DEALER_ADDRESS, DEALER_PHONE } from '@/lib/documents/shared';
import { type BuyerAcknowledgments, emptyAcknowledgments } from '@/components/documents/BillOfSalePreview';
import ContractPreview from '@/components/documents/ContractPreview';
import RentalPreview from '@/components/documents/RentalPreview';
import BillOfSalePreview from '@/components/documents/BillOfSalePreview';
import Form130UPreview from '@/components/documents/Form130UPreview';
import AddressAutocomplete, { type ParsedAddress } from '@/components/documents/AddressAutocomplete';
import SignaturePad from '@/components/documents/SignaturePad';
import IdUpload from '@/components/documents/IdUpload';
import PaymentMethodSection from '@/components/documents/PaymentMethodSection';
import PrintButton from '@/components/documents/PrintButton';

// ============================================================
// Error Boundary
// ============================================================
interface ErrorBoundaryState { error: Error | null }

export class WizardErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <h1 className="text-2xl font-serif font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-[#1a1a1a]/60 mb-4">Please try refreshing the page or contact the dealer.</p>
            <p className="text-xs text-[#1a1a1a]/40">{DEALER_PHONE} | {DEALER_ADDRESS}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// Types & Config
// ============================================================
const sectionTitles: Record<CustomerSection, string> = {
  financing: 'Financing Contract',
  rental: 'Rental Agreement',
  billOfSale: 'Bill of Sale',
  form130U: 'Form 130-U',
};

interface FieldGroup {
  label: string;
  fields: string[];
  optional?: boolean;
}

const fieldGroups: Record<CustomerSection, FieldGroup[]> = {
  financing: [
    { label: 'Your Information', fields: ['buyerName', 'buyerAddress', 'buyerPhone', 'buyerEmail'] },
    { label: 'Co-Buyer / Co-Signer', fields: ['coBuyerName', 'coBuyerAddress', 'coBuyerPhone', 'coBuyerEmail'], optional: true },
  ],
  rental: [
    { label: 'Your Information', fields: ['renterName', 'renterAddress', 'renterPhone', 'renterEmail', 'renterLicense'] },
    { label: 'Co-Renter', fields: ['coRenterName', 'coRenterAddress', 'coRenterPhone', 'coRenterEmail', 'coRenterLicense'], optional: true },
    { label: 'Vehicle Return', fields: ['mileageIn', 'fuelLevelIn'] },
  ],
  billOfSale: [
    { label: 'Your Information', fields: ['buyerName', 'buyerAddress', 'buyerCity', 'buyerState', 'buyerZip', 'buyerPhone', 'buyerEmail', 'buyerLicense', 'buyerLicenseState'] },
    { label: 'Co-Buyer', fields: ['coBuyerName', 'coBuyerAddress', 'coBuyerCity', 'coBuyerState', 'coBuyerZip', 'coBuyerPhone', 'coBuyerEmail', 'coBuyerLicense', 'coBuyerLicenseState'], optional: true },
  ],
  form130U: [
    { label: 'Personal Information', fields: ['applicantType', 'applicantFirstName', 'applicantMiddleName', 'applicantLastName', 'applicantSuffix', 'applicantEntityName', 'coApplicantName', 'applicantIdNumber', 'applicantIdType', 'applicantIdState', 'applicantDob', 'applicantPhone'] },
    { label: 'Address', fields: ['applicantEmail', 'mailingAddress', 'mailingCity', 'mailingState', 'mailingZip', 'countyOfResidence', 'vehicleLocationSameAsMailing', 'vehicleLocationAddress', 'vehicleLocationCity', 'vehicleLocationState', 'vehicleLocationZip', 'vehicleLocationCounty'] },
    { label: 'Lienholder', fields: ['hasLien', 'lienholderName', 'lienholderAddress', 'lienholderCity', 'lienholderState', 'lienholderZip'], optional: true },
  ],
};

interface WizardStep {
  id: string;
  label: string;
  type: 'welcome' | 'fields' | 'id-upload' | 'review' | 'sign' | 'acknowledgments' | 'complete';
  group?: FieldGroup;
}

function buildSteps(section: CustomerSection): WizardStep[] {
  const steps: WizardStep[] = [{ id: 'welcome', label: 'Welcome', type: 'welcome' }];
  for (const group of fieldGroups[section]) {
    steps.push({ id: `fields-${group.label}`, label: group.label, type: 'fields', group });
  }
  steps.push({ id: 'id-upload', label: 'Photo ID', type: 'id-upload' });
  steps.push({ id: 'review', label: 'Review', type: 'review' });
  steps.push({ id: 'sign', label: 'Sign', type: 'sign' });
  if (section === 'billOfSale') {
    steps.push({ id: 'acknowledgments', label: 'Acknowledgments', type: 'acknowledgments' });
  }
  steps.push({ id: 'complete', label: 'Complete', type: 'complete' });
  return steps;
}

// ============================================================
// Helpers
// ============================================================
function fieldLabel(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .replace(/co /i, 'Co-')
    .trim();
}

// ============================================================
// Confetti CSS Animation
// ============================================================
const CONFETTI_COLORS = ['#b89b5e', '#4ade80', '#3b82f6', '#f43f5e', '#a855f7', '#f59e0b'];

function ConfettiEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: `${(i * 2.5) % 100}%`,
            top: '-10px',
            width: `${6 + (i % 3) * 3}px`,
            height: `${4 + (i % 4) * 2}px`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animation: `wizard-confetti ${2 + (i % 4)}s ease-in ${(i % 8) * 0.2}s forwards`,
            transform: `rotate(${(i * 37) % 360}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes wizard-confetti {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Progress Dots
// ============================================================
function ProgressDots({ current, total }: { current: number; total: number }) {
  const progress = (current + 1) / total;
  const showEncouragement = progress >= 0.8 && current < total - 1;

  return (
    <div className="flex flex-col items-center space-y-2 mb-8">
      <div className="flex items-center space-x-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-8 h-2 bg-[#b89b5e]'
                : i < current
                  ? 'w-2 h-2 bg-[#b89b5e]/60'
                  : 'w-2 h-2 bg-[#1a1a1a]/10'
            }`}
          />
        ))}
      </div>
      {showEncouragement && (
        <p className="text-xs text-[#b89b5e] font-medium animate-pulse">
          Almost done! Just a few more steps.
        </p>
      )}
    </div>
  );
}

// ============================================================
// Wizard Input (light theme)
// ============================================================
function WizardInput({ label, name, type = 'text', uppercase = false, value, onChange, disabled, placeholder }: {
  label: string; name: string; type?: string; uppercase?: boolean;
  value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold tracking-widest uppercase text-[#1a1a1a]/70 mb-2">{label}</label>
      <input
        type={type} name={name} value={value ?? ''} onChange={onChange}
        disabled={disabled} placeholder={placeholder}
        className={`w-full px-4 py-3 bg-white border border-[#1a1a1a]/10 rounded-lg focus:outline-none focus:border-[#b89b5e] focus:ring-1 focus:ring-[#b89b5e] transition-all text-base min-h-[48px] ${uppercase ? 'uppercase' : ''} ${disabled ? 'bg-[#f5f2ed]/50 text-[#1a1a1a]/50 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}

// ============================================================
// Main Wizard Component
// ============================================================
interface CustomerWizardProps {
  linkData: CustomerLinkData;
}

export default function CustomerWizard({ linkData }: CustomerWizardProps) {
  const steps = useMemo(() => buildSteps(linkData.s), [linkData.s]);
  const [currentStep, setCurrentStep] = useState(0);
  const adminBuyerName = linkData.abn || '';
  const nameField = linkData.s === 'rental' ? 'renterName' : 'buyerName';

  const [customerData, setCustomerData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (adminBuyerName) initial[nameField] = adminBuyerName;
    return initial;
  });
  const [signatures, setSignatures] = useState<SignatureData>(emptySignatures);
  const [acknowledgments, setAcknowledgments] = useState<BuyerAcknowledgments>(emptyAcknowledgments);
  const [ackError, setAckError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [returnLink, setReturnLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const step = steps[currentStep];
  const mergedData = { ...linkData.d, ...customerData };
  const dealerSig = linkData.ds || '';
  const dealerSigDate = linkData.dd || '';
  const fullSignatures: SignatureData = {
    ...signatures,
    dealerSignature: dealerSig,
    dealerSignatureDate: dealerSigDate,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCustomerData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Required fields per document type for the first (non-optional) fields step
  const requiredFields: Record<CustomerSection, string[]> = {
    financing: ['buyerName', 'buyerPhone'],
    rental: ['renterName', 'renterPhone'],
    billOfSale: ['buyerName', 'buyerPhone'],
    form130U: ['applicantFirstName', 'applicantLastName', 'applicantPhone'],
  };

  const handleNext = () => {
    // Validate required fields on non-optional field steps
    if (step.type === 'fields' && !step.group?.optional) {
      const required = requiredFields[linkData.s] || [];
      const missing = required.filter(f => !customerData[f]?.trim());
      if (missing.length > 0) {
        setFieldErrors(missing);
        return;
      }
    }
    setFieldErrors([]);
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrintDocument = () => {
    setShowDocPreview(true);
    setTimeout(() => window.print(), 400);
    setTimeout(() => setShowDocPreview(false), 1000);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (linkData.s === 'billOfSale') {
      const requiredAcks: (keyof BuyerAcknowledgments)[] = ['inspected', 'asIs', 'receivedCopy', 'allSalesFinal', 'odometerInformed', 'responsibility'];
      if (!requiredAcks.every(key => acknowledgments[key])) {
        setAckError(true);
        return;
      }
    }
    setAckError(false);
    setSubmitError('');
    setSubmitting(true);

    try {
      let compressedPhoto = '';
      if (signatures.buyerIdPhoto) {
        compressedPhoto = await compressIdPhoto(signatures.buyerIdPhoto);
      }
      let urlPhoto = '';
      if (signatures.buyerIdPhoto) {
        const compressed = await compressIdPhotoForUrl(signatures.buyerIdPhoto);
        if (compressed.length < 150000) urlPhoto = compressed;
      }

      const finalCustomerData = { ...customerData };
      if (adminBuyerName) finalCustomerData[nameField] = adminBuyerName;

      const baseUrl = window.location.origin;

      // Still generate hash-based completed_link for DB storage (used by admin renewal flow)
      const hashLink = encodeCompletedLink(
        linkData.s, linkData.d, finalCustomerData, baseUrl,
        dealerSig, dealerSigDate,
        signatures.buyerSignature, signatures.buyerSignatureDate,
        signatures.coBuyerSignature, signatures.coBuyerSignatureDate,
        urlPhoto || signatures.buyerIdPhoto,
        acknowledgments as unknown as Record<string, boolean>,
      );

      const result = await saveAgreement({
        documentType: linkData.s,
        data: { ...linkData.d, ...finalCustomerData },
        status: 'completed',
        acknowledgments: acknowledgments as unknown as Record<string, boolean>,
        buyerSignature: !!signatures.buyerSignature,
        coBuyerSignature: !!signatures.coBuyerSignature,
        dealerSignature: !!dealerSig,
        buyerIdPhoto: !!signatures.buyerIdPhoto,
        buyerIdPhotoData: compressedPhoto || undefined,
        completedLink: hashLink,
        agreementId: linkData.aid,
      });

      // Generate clean short link for customer to share back with dealer
      const returnId = result.id || linkData.aid;
      const shortLink = returnId
        ? generateCompletedPortalLink(baseUrl, returnId)
        : hashLink;
      setReturnLink(shortLink);

      if (!result.success) {
        setSubmitError(result.error || 'Failed to save. Your document link is still valid.');
      }

      setShowConfetti(true);
      setCurrentStep(steps.length - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(returnLink); } catch { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const whatsAppMessage = encodeURIComponent(
    `Hi, I've completed the ${sectionTitles[linkData.s].toLowerCase()}. Here's the signed document:\n${returnLink}`
  );
  const whatsAppUrl = `https://wa.me/12812533602?text=${whatsAppMessage}`;

  // Is this the last interactive step (triggers submission)?
  const isSubmitStep =
    (step.type === 'sign' && linkData.s !== 'billOfSale') ||
    step.type === 'acknowledgments';

  // ============================================================
  // Render current step
  // ============================================================
  const renderStep = () => {
    switch (step.type) {
      case 'welcome': {
        const d = linkData.d as Record<string, string>;
        return (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#1a1a1a]">{sectionTitles[linkData.s]}</h2>
              <p className="text-sm text-[#1a1a1a]/60 mt-2">
                {DEALER_NAME} has prepared this document for you.
              </p>
            </div>
            <div className="bg-[#b89b5e]/10 border border-[#b89b5e]/30 p-6 rounded-2xl text-left space-y-3">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-[#b89b5e]">Vehicle Details</h3>
              <div className="grid grid-cols-2 gap-3">
                {d.vehicleYear && (
                  <div>
                    <span className="text-[10px] text-[#1a1a1a]/50 uppercase tracking-wider">Vehicle</span>
                    <p className="text-sm font-medium">
                      {[d.vehicleYear, d.vehicleMake, d.vehicleModel].filter(Boolean).join(' ')}
                    </p>
                  </div>
                )}
                {(d.vehicleVin || d.vin) && (
                  <div>
                    <span className="text-[10px] text-[#1a1a1a]/50 uppercase tracking-wider">VIN</span>
                    <p className="text-sm font-mono font-medium">{d.vehicleVin || d.vin}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white/60 border border-[#1a1a1a]/5 p-4 rounded-xl">
              <p className="text-xs text-[#1a1a1a]/50">
                You&apos;ll fill in your information, upload your ID, review and sign the document.
                This takes about 3-5 minutes.
              </p>
            </div>
          </div>
        );
      }

      case 'fields':
        if (!step.group) return null;
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#1a1a1a]">{step.group.label}</h2>
              {step.group.optional && (
                <p className="text-sm text-[#1a1a1a]/60 mt-1">This section is optional. You can skip it if not applicable.</p>
              )}
              {fieldErrors.length > 0 && !step.group.optional && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mt-2">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">Please fill in the required fields before continuing.</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {step.group.fields.map(field => {
                const label = fieldLabel(field);

                // Address autocomplete
                if (field.includes('Address') && !field.includes('City') && !field.includes('State') && !field.includes('Zip') && !field.includes('County') && !field.includes('SameAs')) {
                  return (
                    <AddressAutocomplete
                      key={field} label={label} name={field}
                      value={customerData[field] || ''} onChange={handleChange}
                      onAddressSelect={(addr: ParsedAddress) => {
                        setCustomerData(prev => ({
                          ...prev, [field]: addr.street,
                          [field.replace('Address', 'City')]: addr.city,
                          [field.replace('Address', 'State')]: addr.state,
                          [field.replace('Address', 'Zip')]: addr.zip,
                        }));
                      }}
                      dark={false}
                    />
                  );
                }

                // Checkbox fields
                if (field.includes('SameAsMailing') || field === 'hasLien') {
                  return (
                    <label key={field} className="flex items-center space-x-2 md:col-span-2 min-h-[48px]">
                      <input
                        type="checkbox" name={field}
                        checked={customerData[field] === 'true'}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, [field]: String(e.target.checked) }))}
                        className="w-5 h-5 accent-[#b89b5e]"
                      />
                      <span className="text-sm">{field === 'hasLien' ? 'Vehicle has a lienholder' : 'Same as mailing address'}</span>
                    </label>
                  );
                }

                // Applicant type dropdown
                if (field === 'applicantType') {
                  return (
                    <div key={field}>
                      <label className="block text-[10px] font-semibold tracking-widest uppercase text-[#1a1a1a]/70 mb-2">{label}</label>
                      <select
                        name={field} value={customerData[field] || 'Individual'}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-[#1a1a1a]/10 rounded-lg focus:outline-none focus:border-[#b89b5e] text-base min-h-[48px]"
                      >
                        <option value="Individual">Individual</option>
                        <option value="Business">Business</option>
                        <option value="Government">Government</option>
                        <option value="Trust">Trust</option>
                        <option value="Non-Profit">Non-Profit</option>
                      </select>
                    </div>
                  );
                }

                // Regular input
                const isAdminNameField = adminBuyerName && (field === 'buyerName' || field === 'renterName');
                return (
                  <WizardInput
                    key={field}
                    label={isAdminNameField ? `${label} (set by dealer)` : label}
                    name={field}
                    value={customerData[field] || ''}
                    onChange={handleChange}
                    type={field.includes('Email') || field.includes('email') ? 'email' : field.includes('Dob') ? 'date' : 'text'}
                    uppercase={field.includes('License') || field.includes('State') || field.includes('Vin')}
                    disabled={!!isAdminNameField}
                  />
                );
              })}
            </div>
          </div>
        );

      case 'id-upload':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#1a1a1a]">Photo ID</h2>
              <p className="text-sm text-[#1a1a1a]/60 mt-1">Upload or capture a photo of your driver&apos;s license or state ID.</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl p-6">
              <IdUpload
                label="Driver's License / State ID"
                value={signatures.buyerIdPhoto}
                onChange={(v) => setSignatures(prev => ({ ...prev, buyerIdPhoto: v }))}
              />
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#1a1a1a]">Review Document</h2>
              <p className="text-sm text-[#1a1a1a]/60 mt-1">Please review your document before signing. You can go back to make changes.</p>
            </div>
            <div className="bg-white shadow-lg border border-[#1a1a1a]/10 rounded-2xl overflow-hidden">
              {linkData.s === 'financing' && <ContractPreview data={mergedData as unknown as ContractData} signatures={fullSignatures} />}
              {linkData.s === 'rental' && <RentalPreview data={mergedData as unknown as RentalData} signatures={fullSignatures} />}
              {linkData.s === 'billOfSale' && <BillOfSalePreview data={mergedData as unknown as BillOfSaleData} signatures={fullSignatures} acknowledgments={acknowledgments} />}
              {linkData.s === 'form130U' && <Form130UPreview data={mergedData as unknown as Form130UData} signatures={fullSignatures} />}
            </div>
          </div>
        );

      case 'sign':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#1a1a1a]">Sign Document</h2>
              <p className="text-sm text-[#1a1a1a]/60 mt-1">Sign below to complete your document.</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl p-6 space-y-6">
              <SignaturePad
                label="Your Signature"
                value={signatures.buyerSignature}
                dateValue={signatures.buyerSignatureDate}
                onChange={(v) => setSignatures(prev => ({ ...prev, buyerSignature: v }))}
                onDateChange={(v) => setSignatures(prev => ({ ...prev, buyerSignatureDate: v }))}
              />
              <SignaturePad
                label="Co-Buyer / Co-Signer (optional)"
                value={signatures.coBuyerSignature}
                dateValue={signatures.coBuyerSignatureDate}
                onChange={(v) => setSignatures(prev => ({ ...prev, coBuyerSignature: v }))}
                onDateChange={(v) => setSignatures(prev => ({ ...prev, coBuyerSignatureDate: v }))}
              />
            </div>
          </div>
        );

      case 'acknowledgments':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#1a1a1a]">Buyer Acknowledgment</h2>
              <p className="text-sm text-[#1a1a1a]/60 mt-1">Please read and check each acknowledgment.</p>
            </div>
            {ackError && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">You must check all acknowledgments before submitting.</span>
              </div>
            )}
            <div className="space-y-3">
              {[
                { key: 'inspected' as const, label: 'I have inspected the vehicle and accept it in its present condition.' },
                { key: 'asIs' as const, label: `I understand this vehicle is sold ${(linkData.d as Record<string, unknown>).conditionType === 'as_is' ? '"AS IS" with NO dealer warranty' : 'with a LIMITED WARRANTY as described'}.` },
                { key: 'receivedCopy' as const, label: 'I have received a copy of this Bill of Sale for my records.' },
                { key: 'allSalesFinal' as const, label: 'I understand ALL SALES ARE FINAL — no refunds, returns, or exchanges.' },
                { key: 'odometerInformed' as const, label: 'I have been informed of the odometer reading and its accuracy status.' },
                { key: 'responsibility' as const, label: 'I accept full responsibility for the vehicle upon delivery, including insurance and registration.' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-start space-x-3 cursor-pointer group min-h-[48px]">
                  <input
                    type="checkbox" checked={acknowledgments[key]}
                    onChange={() => { setAcknowledgments(prev => ({ ...prev, [key]: !prev[key] })); setAckError(false); }}
                    className="w-5 h-5 mt-0.5 accent-[#b89b5e] shrink-0"
                  />
                  <span className="text-sm text-[#1a1a1a]/80 group-hover:text-[#1a1a1a] transition-colors">{label}</span>
                </label>
              ))}
              {(linkData.d as Record<string, unknown>).paymentMethod === 'Financing' && (
                <label className="flex items-start space-x-3 cursor-pointer group min-h-[48px]">
                  <input
                    type="checkbox" checked={acknowledgments.financingSeparate}
                    onChange={() => setAcknowledgments(prev => ({ ...prev, financingSeparate: !prev.financingSeparate }))}
                    className="w-5 h-5 mt-0.5 accent-[#b89b5e] shrink-0"
                  />
                  <span className="text-sm text-[#1a1a1a]/80 group-hover:text-[#1a1a1a] transition-colors">
                    I understand this purchase is financed under a separate Retail Installment Contract.
                  </span>
                </label>
              )}
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            {showConfetti && <ConfettiEffect />}
            <div>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-700" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-green-900">Document Completed!</h2>
              <p className="text-sm text-[#1a1a1a]/60 mt-2">
                Send this link back to {DEALER_NAME} so they can view the completed document.
              </p>
            </div>

            {submitError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                <p className="text-sm text-amber-800">{submitError}</p>
              </div>
            )}

            {/* Return Link */}
            <div className="bg-[#f5f2ed] rounded-xl p-4 space-y-3 text-left">
              <label className="text-[10px] font-semibold tracking-widest uppercase text-[#1a1a1a]/50">Return Link for Dealer</label>
              <div className="flex items-center space-x-2">
                <input type="text" readOnly value={returnLink} className="flex-1 px-3 py-2 bg-white border border-[#1a1a1a]/10 rounded-lg text-xs font-mono text-[#1a1a1a]/70 truncate" />
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase flex items-center space-x-1 transition-all ${copied ? 'bg-green-600 text-white' : 'bg-[#1a1a1a] text-[#b89b5e] border border-[#b89b5e]/30'}`}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Share */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#25D366] text-white rounded-full text-sm font-bold tracking-widest uppercase flex items-center justify-center space-x-2 hover:bg-[#22c55e] transition-all"
            >
              <Share2 size={16} />
              <span>Send via WhatsApp</span>
            </a>

            {/* Payment */}
            <PaymentMethodSection />

            {/* Print/PDF — prints the actual document, not completion page */}
            <div className="flex gap-3">
              <button onClick={handlePrintDocument} className="flex-1 py-3 bg-[#1a1a1a] text-[#b89b5e] rounded-full text-[10px] font-semibold tracking-wider uppercase flex items-center justify-center space-x-1 border border-[#b89b5e]/30 hover:bg-[#1a1a1a]/90 transition-all">
                <span>Download Copy</span>
              </button>
              <button onClick={handlePrintDocument} className="flex-1 py-3 bg-[#b89b5e] text-white rounded-full text-[10px] font-semibold tracking-wider uppercase flex items-center justify-center space-x-1 hover:bg-[#b89b5e]/90 transition-all">
                <span>Print Copy</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header className="bg-[#f5f2ed]/80 backdrop-blur-md border-b border-[#1a1a1a]/10 sticky top-0 z-10 print:hidden">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-serif font-semibold">{DEALER_NAME}</h1>
            <p className="text-[10px] text-[#1a1a1a]/50">{sectionTitles[linkData.s]}</p>
          </div>
          {step.type === 'review' && <PrintButton variant="pdf" light />}
        </div>
      </header>

      {/* Document preview for printing (hidden on screen, visible in print) */}
      {showDocPreview && (
        <div className="hidden print:block print:p-0 print:m-0">
          {linkData.s === 'financing' && <ContractPreview data={mergedData as unknown as ContractData} signatures={fullSignatures} />}
          {linkData.s === 'rental' && <RentalPreview data={mergedData as unknown as RentalData} signatures={fullSignatures} />}
          {linkData.s === 'billOfSale' && <BillOfSalePreview data={mergedData as unknown as BillOfSaleData} signatures={fullSignatures} acknowledgments={acknowledgments} />}
          {linkData.s === 'form130U' && <Form130UPreview data={mergedData as unknown as Form130UData} signatures={fullSignatures} />}
        </div>
      )}

      {/* Content */}
      <main className={`max-w-2xl mx-auto px-4 py-8 print:p-0 ${showDocPreview ? 'print:hidden' : ''}`}>
        {step.type !== 'complete' && (
          <ProgressDots current={currentStep} total={steps.length} />
        )}

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-[#1a1a1a]/5 border border-[#1a1a1a]/5">
          {renderStep()}
        </div>

        {/* Navigation */}
        {step.type !== 'complete' && (
          <div className="flex items-center justify-between mt-6 print:hidden">
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                className="px-6 py-3 text-[#1a1a1a]/60 text-sm font-semibold flex items-center space-x-1 hover:text-[#1a1a1a] transition-colors min-h-[48px]"
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-3">
              {step.type === 'fields' && step.group?.optional && (
                <button
                  onClick={handleNext}
                  className="px-4 py-3 text-[#1a1a1a]/40 text-sm font-medium hover:text-[#1a1a1a]/60 transition-colors min-h-[48px]"
                >
                  Skip
                </button>
              )}

              {isSubmitStep ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 bg-green-700 text-white rounded-full text-sm font-bold tracking-widest uppercase hover:bg-green-800 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Submitting...</span></>
                  ) : (
                    <><Send size={16} /><span>Complete &amp; Send</span></>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-[#b89b5e] text-white rounded-full text-sm font-bold tracking-widest uppercase hover:bg-[#b89b5e]/90 transition-all flex items-center space-x-2 min-h-[48px]"
                >
                  <span>{step.type === 'welcome' ? "Let's Start" : 'Continue'}</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
