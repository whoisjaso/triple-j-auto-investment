"use client";

import { useState, useRef, useCallback } from 'react';
import { FileText, Edit3, Download, Send, Copy, Check, Printer } from 'lucide-react';
import { ContractData } from '@/lib/documents/finance';
import { RentalData } from '@/lib/documents/rental';
import { BillOfSaleData } from '@/lib/documents/billOfSale';
import { Form130UData, prefillFromBillOfSale } from '@/lib/documents/form130U';
import { SignatureData, emptySignatures } from '@/lib/documents/shared';
import { encodeCustomerLink, saveAgreement, type CustomerSection } from '@/lib/documents/customerPortal';
import ContractForm from './ContractForm';
import ContractPreview from './ContractPreview';
import RentalForm from './RentalForm';
import RentalPreview from './RentalPreview';
import BillOfSaleForm from './BillOfSaleForm';
import BillOfSalePreview from './BillOfSalePreview';
import Form130UForm from './Form130UForm';
import Form130UPreview from './Form130UPreview';
import SignatureBlock from './SignatureBlock';

type Section = 'financing' | 'rental' | 'billOfSale' | 'form130U';

const initialContractData: ContractData = {
  buyerName: '', buyerAddress: '', buyerPhone: '', buyerEmail: '',
  coBuyerName: '', coBuyerAddress: '', coBuyerPhone: '', coBuyerEmail: '',
  vehicleYear: '', vehicleMake: '', vehicleModel: '', vehicleVin: '', vehiclePlate: '', vehicleMileage: '',
  cashPrice: 0, downPayment: 0, tax: 0, titleFee: 0, docFee: 0,
  apr: 0, numberOfPayments: 36, paymentFrequency: 'Monthly',
  firstPaymentDate: new Date().toISOString().split('T')[0], dueAtSigning: 0,
};

const initialRentalData: RentalData = {
  renterName: '', renterAddress: '', renterPhone: '', renterEmail: '', renterLicense: '',
  coRenterName: '', coRenterAddress: '', coRenterPhone: '', coRenterEmail: '', coRenterLicense: '',
  vehicleYear: '', vehicleMake: '', vehicleModel: '', vehicleVin: '', vehiclePlate: '',
  mileageOut: '', mileageIn: '', fuelLevelOut: 'Full', fuelLevelIn: 'Full',
  rentalRate: 0, rentalPeriod: 'Daily',
  rentalStartDate: new Date().toISOString().split('T')[0], rentalEndDate: '',
  securityDeposit: 0, mileageAllowance: 0, excessMileageCharge: 0,
  insuranceFee: 0, additionalDriverFee: 0, tax: 0, dueAtSigning: 0,
};

const initialBillOfSaleData: BillOfSaleData = {
  saleDate: new Date().toISOString().split('T')[0], stockNumber: '',
  buyerName: '', buyerAddress: '', buyerCity: '', buyerState: '', buyerZip: '',
  buyerPhone: '', buyerEmail: '', buyerLicense: '', buyerLicenseState: '',
  coBuyerName: '', coBuyerAddress: '', coBuyerCity: '', coBuyerState: '', coBuyerZip: '',
  coBuyerPhone: '', coBuyerEmail: '', coBuyerLicense: '', coBuyerLicenseState: '',
  vehicleYear: '', vehicleMake: '', vehicleModel: '', vehicleTrim: '',
  vehicleVin: '', vehiclePlate: '', vehicleColor: '', vehicleBodyStyle: '', vehicleMileage: '',
  odometerReading: '', odometerStatus: 'actual',
  salePrice: 0, tradeInAllowance: 0, tradeInDescription: '', tradeInVin: '', tradeInPayoff: 0,
  tax: 0, titleFee: 0, docFee: 0, registrationFee: 0, otherFees: 0, otherFeesDescription: '',
  paymentMethod: 'Cash', paymentMethodOther: '',
  conditionType: 'as_is', warrantyDuration: '', warrantyDescription: '',
};

const initialForm130UData: Form130UData = {
  applicationType: 'titleAndRegistration',
  vin: '', year: '', make: '', bodyStyle: '', model: '',
  majorColor: '', minorColor: '', licensePlateNo: '', odometerReading: '', odometerBrand: 'A',
  emptyWeight: '', carryingCapacity: '',
  applicantType: 'Individual', applicantIdNumber: '', applicantIdType: 'DL', applicantIdState: 'TX',
  applicantFirstName: '', applicantMiddleName: '', applicantLastName: '', applicantSuffix: '',
  applicantEntityName: '', coApplicantName: '',
  mailingAddress: '', mailingCity: '', mailingState: '', mailingZip: '',
  countyOfResidence: '', applicantDob: '', applicantPhone: '', applicantEmail: '',
  previousOwnerName: 'Triple J Auto Investment LLC', previousOwnerCity: 'Houston', previousOwnerState: 'TX',
  vehicleLocationAddress: '', vehicleLocationCity: '', vehicleLocationState: '',
  vehicleLocationZip: '', vehicleLocationCounty: '', vehicleLocationSameAsMailing: true,
  lienholderName: '', lienholderAddress: '', lienholderCity: '', lienholderState: '', lienholderZip: '',
  hasLien: false, salesPrice: 0, tradeInAllowance: 0, taxRate: 6.25, rebateOrIncentive: 0,
  tradeInDescription: '', tradeInVin: '',
  saleDate: new Date().toISOString().split('T')[0], remarks: '',
};

const sectionLabels: Record<Section, string> = {
  financing: 'Contract', rental: 'Rental', billOfSale: 'Bill_of_Sale', form130U: '130-U',
};

interface Props {
  initialSection?: Section;
  vehiclePrefill?: {
    vin?: string; year?: string; make?: string; model?: string; trim?: string;
    mileage?: string; color?: string; bodyStyle?: string; plate?: string;
    price?: number; stockNumber?: string;
  };
  buyerPrefill?: { name?: string; phone?: string; email?: string; };
}

export default function DocumentEditor({ initialSection = 'billOfSale', vehiclePrefill, buyerPrefill }: Props) {
  const [section, setSection] = useState<Section>(initialSection);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Apply prefills to initial data
  const applyVehiclePrefill = useCallback(<T extends Record<string, unknown>>(data: T, fieldMap: Record<string, string>): T => {
    if (!vehiclePrefill) return data;
    const updated = { ...data };
    for (const [prefillKey, dataKey] of Object.entries(fieldMap)) {
      const val = vehiclePrefill[prefillKey as keyof typeof vehiclePrefill];
      if (val !== undefined && val !== null && val !== '') {
        (updated as Record<string, unknown>)[dataKey] = val;
      }
    }
    return updated;
  }, [vehiclePrefill]);

  const applyBuyerPrefill = useCallback(<T extends Record<string, unknown>>(data: T, nameField: string, phoneField: string, emailField: string): T => {
    if (!buyerPrefill) return data;
    const updated = { ...data };
    if (buyerPrefill.name) (updated as Record<string, unknown>)[nameField] = buyerPrefill.name;
    if (buyerPrefill.phone) (updated as Record<string, unknown>)[phoneField] = buyerPrefill.phone;
    if (buyerPrefill.email) (updated as Record<string, unknown>)[emailField] = buyerPrefill.email;
    return updated;
  }, [buyerPrefill]);

  const [contractData, setContractData] = useState<ContractData>(() => {
    let d = { ...initialContractData };
    d = applyVehiclePrefill(d, { vin: 'vehicleVin', year: 'vehicleYear', make: 'vehicleMake', model: 'vehicleModel', mileage: 'vehicleMileage', plate: 'vehiclePlate', price: 'cashPrice' });
    d = applyBuyerPrefill(d, 'buyerName', 'buyerPhone', 'buyerEmail');
    return d;
  });
  const [rentalData, setRentalData] = useState<RentalData>(() => {
    let d = { ...initialRentalData };
    d = applyVehiclePrefill(d, { vin: 'vehicleVin', year: 'vehicleYear', make: 'vehicleMake', model: 'vehicleModel', plate: 'vehiclePlate', mileage: 'mileageOut' });
    d = applyBuyerPrefill(d, 'renterName', 'renterPhone', 'renterEmail');
    return d;
  });
  const [billOfSaleData, setBillOfSaleData] = useState<BillOfSaleData>(() => {
    let d = { ...initialBillOfSaleData };
    d = applyVehiclePrefill(d, { vin: 'vehicleVin', year: 'vehicleYear', make: 'vehicleMake', model: 'vehicleModel', trim: 'vehicleTrim', mileage: 'vehicleMileage', color: 'vehicleColor', bodyStyle: 'vehicleBodyStyle', plate: 'vehiclePlate', price: 'salePrice', stockNumber: 'stockNumber' });
    if (vehiclePrefill?.mileage) d.odometerReading = vehiclePrefill.mileage;
    d = applyBuyerPrefill(d, 'buyerName', 'buyerPhone', 'buyerEmail');
    return d;
  });
  const [form130UData, setForm130UData] = useState<Form130UData>(() => {
    let d = { ...initialForm130UData };
    d = applyVehiclePrefill(d, { vin: 'vin', year: 'year', make: 'make', model: 'model', bodyStyle: 'bodyStyle', color: 'majorColor', mileage: 'odometerReading', plate: 'licensePlateNo', price: 'salesPrice' });
    if (buyerPrefill?.name) {
      const parts = buyerPrefill.name.trim().split(/\s+/);
      if (parts.length >= 2) { d.applicantFirstName = parts[0]; d.applicantLastName = parts[parts.length - 1]; if (parts.length > 2) d.applicantMiddleName = parts.slice(1, -1).join(' '); }
      else if (parts.length === 1) d.applicantFirstName = parts[0];
    }
    if (buyerPrefill?.phone) d.applicantPhone = buyerPrefill.phone;
    if (buyerPrefill?.email) d.applicantEmail = buyerPrefill.email;
    return d;
  });
  const [signatures, setSignatures] = useState<SignatureData>(emptySignatures);

  const handlePrint = useCallback(() => {
    const prevView = view;
    setView('preview');

    setTimeout(() => {
      // Neutralize ALL fixed-position elements (defeats Chrome's fixed-on-every-page print bug)
      const fixedEls = document.querySelectorAll('aside, nav, [class*="fixed"], [data-print-hide], .print-toolbar-hide');
      const saved: { el: HTMLElement; pos: string; display: string }[] = [];
      fixedEls.forEach(el => {
        const htmlEl = el as HTMLElement;
        saved.push({ el: htmlEl, pos: htmlEl.style.position, display: htmlEl.style.display });
        htmlEl.style.setProperty('position', 'static', 'important');
        htmlEl.style.setProperty('display', 'none', 'important');
      });

      window.print();

      // Restore after print dialog closes (window.print() is blocking)
      saved.forEach(({ el, pos, display }) => {
        el.style.position = pos;
        el.style.display = display;
      });
      setView(prevView);
    }, 400);
  }, [view]);

  const handlePrefill130U = () => {
    const prefilled = prefillFromBillOfSale(billOfSaleData);
    setForm130UData((prev) => ({ ...prev, ...prefilled }));
  };

  const switchSection = (s: Section) => { setSection(s); setView('edit'); };

  const getCurrentData = () => {
    if (section === 'financing') return contractData;
    if (section === 'rental') return rentalData;
    if (section === 'billOfSale') return billOfSaleData;
    return form130UData;
  };

  const handleSendToCustomer = async () => {
    const data = getCurrentData();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = encodeCustomerLink(section as CustomerSection, data, baseUrl, signatures.dealerSignature, signatures.dealerSignatureDate);
    setShareLink(link);
    setShowShareModal(true);
    setCopied(false);

    await saveAgreement({
      documentType: section as CustomerSection,
      data: data as unknown as Record<string, unknown>,
      status: 'pending',
      dealerSignature: !!signatures.dealerSignature,
    });
  };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(shareLink); }
    catch { const ta = document.createElement('textarea'); ta.value = shareLink; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const sectionButtons: { key: Section; label: string }[] = [
    { key: 'billOfSale', label: 'Bill of Sale' },
    { key: 'financing', label: 'Financing' },
    { key: 'rental', label: 'Rental' },
    { key: 'form130U', label: '130-U' },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-6 print-toolbar-hide">
        {/* Section Tabs */}
        <div className="bg-white/[0.03] p-1 rounded-full border border-white/[0.06] flex flex-wrap gap-1">
          {sectionButtons.map((btn) => (
            <button key={btn.key} onClick={() => switchSection(btn.key)} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all ${section === btn.key ? 'bg-tj-gold text-white shadow-md' : 'text-white/40 hover:text-white/70'}`}>
              {btn.label}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="bg-white/[0.03] p-1 rounded-full border border-white/[0.06] flex gap-1">
          <button onClick={() => setView('edit')} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all flex items-center space-x-1 ${view === 'edit' ? 'bg-white/10 text-tj-gold shadow-md' : 'text-white/40 hover:text-white/70'}`}>
            <Edit3 size={12} /><span>Edit</span>
          </button>
          <button onClick={() => setView('preview')} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all flex items-center space-x-1 ${view === 'preview' ? 'bg-white/10 text-tj-gold shadow-md' : 'text-white/40 hover:text-white/70'}`}>
            <FileText size={12} /><span>Preview</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-auto">
          <button onClick={handleSendToCustomer} className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-[10px] font-semibold tracking-wider uppercase hover:bg-emerald-700 transition-all flex items-center space-x-1">
            <Send size={12} /><span className="hidden sm:inline">Send to Customer</span><span className="sm:hidden">Send</span>
          </button>
          <button onClick={handlePrint} className="px-3 py-1.5 bg-white/10 text-tj-gold rounded-full text-[10px] font-semibold tracking-wider uppercase hover:bg-white/15 transition-all flex items-center space-x-1 border border-tj-gold/20">
            <Download size={12} /><span>PDF</span>
          </button>
          <button onClick={handlePrint} className="px-3 py-1.5 bg-tj-gold text-white rounded-full text-[10px] font-semibold tracking-wider uppercase hover:bg-tj-gold/90 transition-all flex items-center space-x-1">
            <Printer size={12} /><span>Print</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'edit' ? (
        <div className="print-form-hide">
          {section === 'financing' && <ContractForm data={contractData} onChange={setContractData} />}
          {section === 'rental' && <RentalForm data={rentalData} onChange={setRentalData} />}
          {section === 'billOfSale' && <BillOfSaleForm data={billOfSaleData} onChange={setBillOfSaleData} />}
          {section === 'form130U' && <Form130UForm data={form130UData} onChange={setForm130UData} onPrefill={handlePrefill130U} />}
          <SignatureBlock signatures={signatures} onChange={setSignatures} mode="dealer" />
        </div>
      ) : (
        <div ref={previewRef} className="bg-white shadow-2xl border border-white/10 rounded-2xl overflow-hidden print-doc">
          {section === 'financing' && <ContractPreview data={contractData} signatures={signatures} />}
          {section === 'rental' && <RentalPreview data={rentalData} signatures={signatures} />}
          {section === 'billOfSale' && <BillOfSalePreview data={billOfSaleData} signatures={signatures} />}
          {section === 'form130U' && <Form130UPreview data={form130UData} signatures={signatures} />}
        </div>
      )}

      {/* Share Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-2xl font-serif text-tj-cream">Send to Customer</h3>
              <p className="text-sm text-white/50 mt-2">Share this link with your customer. They&apos;ll fill in their info, upload ID, sign, and can print their copy.</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
              <label className="text-[10px] font-semibold tracking-widest uppercase text-white/40">Customer Link</label>
              <div className="flex items-center space-x-2">
                <input type="text" readOnly value={shareLink} className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs font-mono text-white/60 truncate" />
                <button onClick={handleCopyLink} className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase flex items-center space-x-1 transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-white/10 text-tj-gold hover:bg-white/15 border border-tj-gold/20'}`}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-white/40">What the customer will do:</p>
              <ul className="text-xs text-white/60 space-y-1.5">
                {['View vehicle details and terms', 'Fill in their personal information', 'Take a photo of their ID', 'Sign the document digitally', 'Print or download their copy'].map((step, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="w-4 h-4 bg-tj-gold/20 text-tj-gold rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5 shrink-0">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full py-3 bg-white/10 text-tj-gold rounded-full text-sm font-bold tracking-widest uppercase hover:bg-white/15 transition-all border border-tj-gold/20">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
