import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Printer, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  documentName: string;
  onDownload: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  documentName,
  onDownload
}) => {
  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && pdfUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-2 md:p-4"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/98 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-5xl h-[95vh] bg-[#0a0a0a] border border-tj-gold/40 shadow-[0_0_150px_rgba(212,175,55,0.1)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/10 shrink-0 bg-gradient-to-r from-black to-[#0a0a0a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tj-gold/10 border border-tj-gold/30 flex items-center justify-center">
                  <Eye className="text-tj-gold" size={18} />
                </div>
                <div>
                  <h2 className="font-display text-lg text-white tracking-wider">{documentName}</h2>
                  <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em]">Document Preview</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Print Button */}
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 text-xs uppercase tracking-widest font-bold transition-colors border border-white/10"
                >
                  <Printer size={14} />
                  <span className="hidden sm:inline">Print</span>
                </button>

                {/* Download Button */}
                <button
                  onClick={onDownload}
                  className="flex items-center gap-2 bg-tj-gold hover:bg-white text-black px-4 py-2.5 text-xs uppercase tracking-widest font-bold transition-colors"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white p-2 transition-colors ml-2"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-grow relative bg-gray-900 overflow-hidden">
              <iframe
                src={pdfUrl}
                className="absolute inset-0 w-full h-full border-0"
                title={`Preview: ${documentName}`}
              />

              {/* Loading Overlay (shown briefly) */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center pointer-events-none"
              >
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-tj-gold/30 border-t-tj-gold rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400 text-xs uppercase tracking-widest">Loading Preview...</p>
                </div>
              </motion.div>
            </div>

            {/* Footer Info */}
            <div className="p-3 border-t border-white/10 bg-black/50 shrink-0 flex items-center justify-between">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">
                Triple J Auto Investment LLC • Official Document
              </p>
              <p className="text-[9px] text-gray-600">
                Generated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PdfPreviewModal;
