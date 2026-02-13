import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileText,
  Printer,
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle,
  PenTool,
  Car,
  User,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  FileX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RentalBooking, RentalCustomer, Vehicle } from '../../types';
import { useScrollLock } from '../../hooks/useScrollLock';
import { SignatureCapture } from './SignatureCapture';
import {
  generateRentalAgreementPDF,
  RentalAgreementData,
} from '../../services/pdfService';
import { supabase } from '../../supabase/config';

interface RentalAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: RentalBooking;
  customer: RentalCustomer;
  vehicle: Vehicle;
  onAgreementSigned: (signatureData: string) => void;
}

export const RentalAgreementModal: React.FC<RentalAgreementModalProps> = ({
  isOpen,
  onClose,
  booking,
  customer,
  vehicle,
  onAgreementSigned,
}) => {
  const [signatureData, setSignatureData] = useState<string | null>(
    booking.signatureData || null
  );
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const [manualSigned, setManualSigned] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useScrollLock(isOpen);

  // Build agreement data from props
  const buildAgreementData = useCallback(
    (sigDataUrl?: string): RentalAgreementData => ({
      bookingId: booking.bookingId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      dailyRate: booking.dailyRate,
      weeklyRate: booking.weeklyRate,
      totalCost: booking.totalCost,
      mileageOut: booking.mileageOut,
      mileageLimit: booking.mileageLimit,
      vehicleYear: vehicle.year,
      vehicleMake: vehicle.make,
      vehicleModel: vehicle.model,
      vehicleVin: vehicle.vin,
      vehicleMileage: vehicle.mileage,
      vehicleColor: undefined,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      customerAddress: customer.address,
      customerDl: customer.driversLicenseNumber,
      authorizedDrivers: booking.authorizedDrivers || [],
      outOfStatePermitted: booking.outOfStatePermitted || false,
      permittedStates: booking.permittedStates || [],
      signatureDataUrl: sigDataUrl || undefined,
      signatureDate: new Date().toISOString().split('T')[0],
    }),
    [booking, customer, vehicle]
  );

  // Generate PDF preview on mount and when signature changes
  const generatePreview = useCallback(async () => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      const agreementData = buildAgreementData(signatureData || undefined);
      const doc = await generateRentalAgreementPDF(agreementData);
      const url = doc.output('bloburl').toString();
      // Revoke old URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(url);
    } catch (err) {
      console.error('Failed to generate PDF preview:', err);
      setErrorMessage(
        `PDF generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setIsGenerating(false);
    }
  }, [buildAgreementData, signatureData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, signatureData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureData(dataUrl);
  };

  const handleSignatureClear = () => {
    setSignatureData(null);
  };

  // Print for manual signature (no digital sig embedded)
  const handlePrintForManual = async () => {
    try {
      setIsGenerating(true);
      const agreementData = buildAgreementData(); // No signature
      const doc = await generateRentalAgreementPDF(agreementData);
      const url = doc.output('bloburl').toString();
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to generate print PDF:', err);
      setErrorMessage('Failed to generate PDF for printing.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download current preview
  const handleDownload = () => {
    if (!previewUrl) return;
    const safeName = customer.fullName.replace(/[^a-z0-9]/gi, '_');
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `Rental_Agreement_${booking.bookingId}_${safeName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sign & Complete: save signature and upload PDF
  const handleSignAndComplete = async () => {
    const effectiveSignature = signatureData;
    const isDigital = !!effectiveSignature;

    if (!isDigital && !manualSigned) {
      setErrorMessage(
        'Please either capture a digital signature or check "Signed manually" after printing.'
      );
      return;
    }

    if (!termsConfirmed) {
      setErrorMessage('Please confirm the customer has reviewed all terms.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setWarningMessage(null);

      // Generate final PDF with signature embedded
      const agreementData = buildAgreementData(effectiveSignature || undefined);
      const doc = await generateRentalAgreementPDF(agreementData);
      const pdfBlob = doc.output('blob');

      // Try to upload to Supabase Storage
      let pdfUrl: string | null = null;
      try {
        const filePath = `${booking.bookingId}/agreement.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('rental-agreements')
          .upload(filePath, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('rental-agreements')
          .getPublicUrl(uploadData.path);

        pdfUrl = urlData.publicUrl;
      } catch (storageErr) {
        console.warn('Supabase storage upload failed:', storageErr);
        setWarningMessage(
          'PDF storage upload failed. Signature data has been saved to the booking record.'
        );
        // Continue - signature_data still gets saved
      }

      // Update booking record
      const updatePayload: Record<string, unknown> = {
        agreement_signed: true,
      };

      if (effectiveSignature) {
        updatePayload.signature_data = effectiveSignature;
      }
      if (pdfUrl) {
        updatePayload.agreement_pdf_url = pdfUrl;
      }

      const { error: updateError } = await supabase
        .from('rental_bookings')
        .update(updatePayload)
        .eq('id', booking.id);

      if (updateError) {
        throw new Error(`Failed to update booking: ${updateError.message}`);
      }

      setSaveSuccess(true);
      onAgreementSigned(effectiveSignature || 'manual');

      // Close after brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to save agreement:', err);
      setErrorMessage(
        `Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSignatureData(booking.signatureData || null);
    setTermsConfirmed(false);
    setManualSigned(false);
    setSaveSuccess(false);
    setErrorMessage(null);
    setWarningMessage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onClose();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [yr, mo, da] = parts;
    return `${mo}/${da}/${yr}`;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

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
            className="relative w-full max-w-7xl max-h-[90vh] bg-[#080808] border border-tj-gold/30 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tj-gold/10 border border-tj-gold/30 flex items-center justify-center">
                  <PenTool className="text-tj-gold" size={20} />
                </div>
                <div>
                  <h2 className="font-display text-xl text-white tracking-wider">
                    Rental Agreement
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                    {booking.bookingId} &mdash;{' '}
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-white p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-hidden flex flex-col md:flex-row">
              {/* LEFT PANEL - Agreement Summary & Signature */}
              <div className="w-full md:w-1/2 overflow-y-auto p-4 md:p-6 space-y-5 border-r border-tj-gold/10">
                {/* Agreement Summary (read-only) */}
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="bg-black/50 border border-tj-gold/10 p-4">
                    <h3 className="text-[10px] uppercase tracking-widest text-tj-gold mb-3 flex items-center gap-2">
                      <User size={12} /> Customer
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 block">Name</span>
                        <span className="text-white">{customer.fullName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Phone</span>
                        <span className="text-white">{customer.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">DL#</span>
                        <span className="text-white font-mono text-[10px]">
                          {customer.driversLicenseNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Email</span>
                        <span className="text-white">
                          {customer.email || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="text-gray-500 block">Address</span>
                      <span className="text-white">{customer.address}</span>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="bg-black/50 border border-tj-gold/10 p-4">
                    <h3 className="text-[10px] uppercase tracking-widest text-tj-gold mb-3 flex items-center gap-2">
                      <Car size={12} /> Vehicle
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 block">Vehicle</span>
                        <span className="text-white">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">VIN</span>
                        <span className="text-white font-mono text-[10px]">
                          {vehicle.vin}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Mileage</span>
                        <span className="text-white">
                          {vehicle.mileage.toLocaleString()} mi
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">
                          Mileage Limit
                        </span>
                        <span className="text-white">
                          {booking.mileageLimit
                            ? `${booking.mileageLimit.toLocaleString()} mi`
                            : 'Unlimited'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rental Terms */}
                  <div className="bg-black/50 border border-tj-gold/10 p-4">
                    <h3 className="text-[10px] uppercase tracking-widest text-tj-gold mb-3 flex items-center gap-2">
                      <Calendar size={12} /> Rental Terms
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 block">Start Date</span>
                        <span className="text-white">
                          {formatDate(booking.startDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">End Date</span>
                        <span className="text-white">
                          {formatDate(booking.endDate)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs mt-2">
                      <div>
                        <span className="text-gray-500 block flex items-center gap-1">
                          <DollarSign size={10} /> Daily Rate
                        </span>
                        <span className="text-white">
                          {formatCurrency(booking.dailyRate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Weekly Rate</span>
                        <span className="text-white">
                          {booking.weeklyRate
                            ? formatCurrency(booking.weeklyRate)
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Total Cost</span>
                        <span className="text-tj-gold font-bold">
                          {formatCurrency(booking.totalCost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Authorized Drivers & Geographic */}
                  <div className="bg-black/50 border border-tj-gold/10 p-4">
                    <h3 className="text-[10px] uppercase tracking-widest text-tj-gold mb-3 flex items-center gap-2">
                      <Users size={12} /> Additional Terms
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-gray-500 block">
                          Authorized Drivers
                        </span>
                        <span className="text-white">
                          {booking.authorizedDrivers?.length > 0
                            ? booking.authorizedDrivers.join(', ')
                            : 'None (Lessee only)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block flex items-center gap-1">
                          <MapPin size={10} /> Geographic Restrictions
                        </span>
                        <span className="text-white">
                          {booking.outOfStatePermitted &&
                          booking.permittedStates?.length > 0
                            ? `Out-of-state permitted: ${booking.permittedStates.join(', ')}`
                            : 'Texas only - no out-of-state travel'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="border-t border-white/10 pt-5 space-y-4">
                  <h3 className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <PenTool size={12} /> Signature
                  </h3>

                  {/* Digital signature capture */}
                  <SignatureCapture
                    onSave={handleSignatureSave}
                    onClear={handleSignatureClear}
                    savedSignature={signatureData || undefined}
                    disabled={saveSuccess}
                  />

                  {/* OR separator */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-white/10" />
                    <span className="text-gray-600 text-xs uppercase tracking-widest">
                      or
                    </span>
                    <div className="flex-1 border-t border-white/10" />
                  </div>

                  {/* Print for manual signature */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handlePrintForManual}
                      disabled={isGenerating || isSaving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-xs uppercase tracking-widest border border-white/20 transition-colors disabled:opacity-30"
                    >
                      {isGenerating ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Printer size={14} />
                      )}
                      Print for Manual Signature
                    </button>
                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={manualSigned}
                        onChange={(e) => setManualSigned(e.target.checked)}
                        className="rounded border-gray-600 bg-black text-tj-gold focus:ring-tj-gold/50"
                      />
                      Customer has signed the printed agreement
                    </label>
                  </div>

                  {/* Terms confirmation */}
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer border-t border-white/10 pt-4">
                    <input
                      type="checkbox"
                      checked={termsConfirmed}
                      onChange={(e) => setTermsConfirmed(e.target.checked)}
                      className="rounded border-gray-600 bg-black text-tj-gold focus:ring-tj-gold/50"
                    />
                    I confirm the customer has reviewed all terms and conditions
                  </label>

                  {/* Error / Warning / Success messages */}
                  {errorMessage && (
                    <div className="bg-red-900/20 border border-red-700/50 p-3 flex items-center gap-2">
                      <AlertTriangle className="text-red-500 shrink-0" size={16} />
                      <span className="text-red-400 text-xs">{errorMessage}</span>
                      <button
                        onClick={() => setErrorMessage(null)}
                        className="ml-auto text-red-400 hover:text-red-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {warningMessage && (
                    <div className="bg-amber-900/20 border border-amber-700/50 p-3 flex items-center gap-2">
                      <AlertTriangle
                        className="text-amber-500 shrink-0"
                        size={16}
                      />
                      <span className="text-amber-400 text-xs">
                        {warningMessage}
                      </span>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="bg-green-900/20 border border-green-700/50 p-3 flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={16} />
                      <span className="text-green-400 text-xs">
                        Agreement saved successfully!
                      </span>
                    </div>
                  )}

                  {/* Sign & Complete button */}
                  <button
                    type="button"
                    onClick={handleSignAndComplete}
                    disabled={
                      isSaving ||
                      saveSuccess ||
                      !termsConfirmed ||
                      (!signatureData && !manualSigned)
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-tj-gold hover:bg-white text-black text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : saveSuccess ? (
                      <CheckCircle size={16} />
                    ) : (
                      <PenTool size={16} />
                    )}
                    {isSaving
                      ? 'Saving...'
                      : saveSuccess
                        ? 'Saved'
                        : 'Sign & Complete Agreement'}
                  </button>
                </div>
              </div>

              {/* RIGHT PANEL - PDF Preview */}
              <div className="w-full md:w-1/2 flex flex-col bg-black/30">
                {previewUrl ? (
                  <>
                    {/* Preview Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                      <div className="flex items-center gap-3">
                        <FileText className="text-tj-gold" size={18} />
                        <span className="text-white font-medium text-sm">
                          Agreement Preview
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (previewUrl) {
                              window.open(previewUrl, '_blank');
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs uppercase tracking-widest transition-colors border border-white/10"
                        >
                          <Printer size={14} />
                          Print
                        </button>
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-2 px-3 py-2 bg-tj-gold hover:bg-white text-black text-xs uppercase tracking-widest font-bold transition-colors"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    </div>

                    {/* PDF Viewer */}
                    <div className="flex-grow relative min-h-[400px]">
                      {isGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                          <Loader2
                            className="text-tj-gold animate-spin"
                            size={32}
                          />
                        </div>
                      )}
                      <iframe
                        src={previewUrl}
                        className="absolute inset-0 w-full h-full border-0 bg-white"
                        title="Rental Agreement Preview"
                      />
                    </div>
                  </>
                ) : (
                  /* Empty / Loading State */
                  <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                    {isGenerating ? (
                      <>
                        <Loader2
                          className="text-tj-gold animate-spin mb-4"
                          size={32}
                        />
                        <p className="text-gray-500 text-sm">
                          Generating agreement...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                          <FileX className="text-gray-600" size={32} />
                        </div>
                        <h3 className="text-white font-medium mb-2">
                          Preview Unavailable
                        </h3>
                        <p className="text-gray-500 text-sm max-w-xs">
                          Unable to generate agreement preview. Please try
                          again.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default RentalAgreementModal;
