import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Car, Calendar, DollarSign, User, Globe, Loader2, CheckCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, BillOfSaleData } from '../../types';
import { AddressInput } from '../AddressInput';
import { PdfPreviewModal } from './PdfPreviewModal';
import { useScrollLock } from '../../hooks/useScrollLock';
import {
  generateBillOfSalePDF,
  generateAsIsPDF,
  generateRegistrationGuidePDF,
  generateForm130U,
  createBillOfSaleFromVehicle
} from '../../services/pdfService';

interface BillOfSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  preSelectedVehicle?: Vehicle | null;
}

export const BillOfSaleModal: React.FC<BillOfSaleModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  preSelectedVehicle = null
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [language, setLanguage] = useState<'EN' | 'ES'>('EN');
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDocName, setPreviewDocName] = useState<string>('');
  const [currentDocType, setCurrentDocType] = useState<string | null>(null);

  // Available vehicles (not sold)
  const availableVehicles = vehicles.filter(v => v.status !== 'Sold');

  // Get selected vehicle
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  // Pre-select vehicle if provided
  useEffect(() => {
    if (preSelectedVehicle) {
      setSelectedVehicleId(preSelectedVehicle.id);
      setSaleAmount(preSelectedVehicle.price.toString());
    }
  }, [preSelectedVehicle]);

  // Update sale amount when vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      setSaleAmount(selectedVehicle.price.toString());
    }
  }, [selectedVehicle]);

  // Lock body scroll when modal is open
  useScrollLock(isOpen);

  const handleClose = () => {
    setLastGenerated(null);
    onClose();
  };

  const buildBillOfSaleData = (): BillOfSaleData | null => {
    if (!selectedVehicle) return null;

    const baseData = createBillOfSaleFromVehicle(selectedVehicle);

    return {
      ...baseData,
      buyerName,
      buyerAddress,
      amount: saleAmount,
      date: saleDate,
      printLanguage: language,
      bodyStyle: '',
      licensePlate: '',
      emptyWeight: '',
      exteriorColor: '',
      interiorColor: '',
      notes: ''
    } as BillOfSaleData;
  };

  // Close preview modal
  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewDocName('');
    setCurrentDocType(null);
  };

  // Download from preview - uses existing blob URL directly (no fetch needed)
  const handleDownloadFromPreview = () => {
    if (!previewUrl) return;

    // Determine filename based on document type
    const safeName = (buyerName || 'Client').replace(/[^a-z0-9]/gi, '_');
    const fileNames: Record<string, string> = {
      'bos': `Bill_of_Sale_${safeName}.pdf`,
      'asis': `As_Is_Acknowledgment_${safeName}.pdf`,
      'reg': `Registration_Guide_${safeName}.pdf`,
      '130u': `Form_130U_${safeName}.pdf`
    };
    const fileName = fileNames[currentDocType || 'bos'] || 'Document.pdf';

    // Use the existing blob URL directly - no need to fetch
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Update UI and close preview
    setLastGenerated(previewDocName);
    closePreview();
  };

  const handleGenerateBOS = async () => {
    const data = buildBillOfSaleData();
    if (!data) return;

    setGeneratingType('bos');
    try {
      const url = await generateBillOfSalePDF(data, true);
      if (url) {
        setPreviewUrl(url as string);
        setPreviewDocName('Bill of Sale');
        setCurrentDocType('bos');
      }
    } finally {
      setGeneratingType(null);
    }
  };

  const handleGenerateAsIs = async () => {
    const data = buildBillOfSaleData();
    if (!data) return;

    setGeneratingType('asis');
    try {
      const url = await generateAsIsPDF(data, true);
      if (url) {
        setPreviewUrl(url as string);
        setPreviewDocName('As-Is Acknowledgment');
        setCurrentDocType('asis');
      }
    } finally {
      setGeneratingType(null);
    }
  };

  const handleGenerateRegistration = async () => {
    const data = buildBillOfSaleData();
    if (!data) return;

    setGeneratingType('reg');
    try {
      const url = await generateRegistrationGuidePDF(data, true);
      if (url) {
        setPreviewUrl(url as string);
        setPreviewDocName('Registration Guide');
        setCurrentDocType('reg');
      }
    } finally {
      setGeneratingType(null);
    }
  };

  const handleGenerateForm130U = async () => {
    const data = buildBillOfSaleData();
    if (!data) return;

    setGeneratingType('130u');
    try {
      const url = await generateForm130U(data, true);
      if (url) {
        setPreviewUrl(url as string);
        setPreviewDocName('Form 130-U (Texas Title Application)');
        setCurrentDocType('130u');
      }
    } finally {
      setGeneratingType(null);
    }
  };

  const isFormValid = selectedVehicle && buyerName.trim() && buyerAddress.trim() && saleAmount;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl max-h-[90vh] bg-[#080808] border border-tj-gold/30 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tj-gold/10 border border-tj-gold/30 flex items-center justify-center">
                  <FileText className="text-tj-gold" size={20} />
                </div>
                <div>
                  <h2 className="font-display text-xl text-white tracking-wider">Document Generator</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Bill of Sale & Registration</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-white p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">

              {/* Vehicle Selection */}
              <div className="bg-black/50 border border-white/10 p-4">
                <label className="block text-[10px] uppercase tracking-widest text-tj-gold mb-3 flex items-center gap-2">
                  <Car size={12} /> Select Vehicle
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="">-- Select a Vehicle --</option>
                  {availableVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} - {v.vin} (${v.price.toLocaleString()})
                    </option>
                  ))}
                </select>

                {/* Selected Vehicle Summary */}
                {selectedVehicle && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white/5 p-3 border border-white/5">
                      <span className="text-gray-500 block mb-1">VIN</span>
                      <span className="text-white font-mono text-[10px]">{selectedVehicle.vin}</span>
                    </div>
                    <div className="bg-white/5 p-3 border border-white/5">
                      <span className="text-gray-500 block mb-1">Mileage</span>
                      <span className="text-white">{selectedVehicle.mileage.toLocaleString()} mi</span>
                    </div>
                    <div className="bg-white/5 p-3 border border-white/5">
                      <span className="text-gray-500 block mb-1">Status</span>
                      <span className={`${selectedVehicle.status === 'Available' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {selectedVehicle.status}
                      </span>
                    </div>
                    <div className="bg-white/5 p-3 border border-white/5">
                      <span className="text-gray-500 block mb-1">List Price</span>
                      <span className="text-tj-gold">${selectedVehicle.price.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Buyer Information */}
              <div className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <User size={12} /> Buyer Information
                </h3>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600"
                  />
                </div>

                <AddressInput
                  value={buyerAddress}
                  onChange={setBuyerAddress}
                  label="Buyer Address"
                  placeholder="Start typing address..."
                  required
                />
              </div>

              {/* Sale Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                    <DollarSign size={12} /> Sale Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                    placeholder="15000"
                    className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                    <Calendar size={12} /> Sale Date
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                    <Globe size={12} /> Language
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('EN')}
                      className={`flex-1 p-4 text-sm font-bold uppercase tracking-widest border transition-all ${
                        language === 'EN'
                          ? 'bg-tj-gold text-black border-tj-gold'
                          : 'bg-black text-gray-500 border-gray-700 hover:border-tj-gold hover:text-white'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('ES')}
                      className={`flex-1 p-4 text-sm font-bold uppercase tracking-widest border transition-all ${
                        language === 'ES'
                          ? 'bg-tj-gold text-black border-tj-gold'
                          : 'bg-black text-gray-500 border-gray-700 hover:border-tj-gold hover:text-white'
                      }`}
                    >
                      Español
                    </button>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {lastGenerated && (
                <div className="bg-green-900/20 border border-green-700/50 p-4 flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="text-green-400 text-sm">
                    <strong>{lastGenerated}</strong> generated successfully! Check your downloads.
                  </span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/10 bg-black/50 shrink-0">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGenerateBOS}
                  disabled={!isFormValid || generatingType !== null}
                  className="bg-tj-gold text-black font-bold py-4 text-xs uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generatingType === 'bos' ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                  Bill of Sale
                </button>

                <button
                  onClick={handleGenerateForm130U}
                  disabled={!isFormValid || generatingType !== null}
                  className="bg-blue-800 text-white font-bold py-4 text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generatingType === '130u' ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                  Form 130-U
                </button>

                <button
                  onClick={handleGenerateAsIs}
                  disabled={!isFormValid || generatingType !== null}
                  className="bg-white/10 text-white font-bold py-4 text-xs uppercase tracking-widest hover:bg-tj-gold hover:text-black border border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generatingType === 'asis' ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                  As-Is Form
                </button>

                <button
                  onClick={handleGenerateRegistration}
                  disabled={!isFormValid || generatingType !== null}
                  className="bg-white/10 text-white font-bold py-4 text-xs uppercase tracking-widest hover:bg-tj-gold hover:text-black border border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generatingType === 'reg' ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                  Reg Guide
                </button>
              </div>

              <p className="text-[9px] text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
                <Eye size={10} /> Click to preview • Download or print from preview
              </p>

              {!isFormValid && (
                <p className="text-[10px] text-gray-500 text-center mt-3">
                  Select a vehicle and fill in buyer information to generate documents
                </p>
              )}
            </div>
          </motion.div>

          {/* PDF Preview Modal */}
          <PdfPreviewModal
            isOpen={!!previewUrl}
            onClose={closePreview}
            pdfUrl={previewUrl}
            documentName={previewDocName}
            onDownload={handleDownloadFromPreview}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default BillOfSaleModal;
