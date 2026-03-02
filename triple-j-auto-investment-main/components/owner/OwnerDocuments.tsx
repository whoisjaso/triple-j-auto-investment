/**
 * OwnerDocuments - Digital document links for the Owner Portal.
 * Shows Bill of Sale (if available) and As-Is Disclosure entry.
 *
 * Phase 19-02: Owner Portal UI
 */

import React from 'react';
import { FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { Registration } from '../../types';

interface OwnerDocumentsProps {
  registration: Registration;
}

const OwnerDocuments: React.FC<OwnerDocumentsProps> = ({ registration }) => {
  const { t } = useLanguage();
  const tp = t.ownerPortal;

  const hasBillOfSale = Boolean(registration.billOfSaleId);

  return (
    <div className="p-6 md:p-8 bg-black/40 border border-tj-gold/10 rounded-lg">
      <p className="text-[10px] uppercase tracking-[0.3em] text-tj-gold mb-4">{tp.documents}</p>

      {hasBillOfSale || true /* always show as-is */ ? (
        <ul className="space-y-2">
          {hasBillOfSale && (
            <li>
              <div className="flex items-center justify-between min-h-[44px] py-2">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-tj-gold flex-shrink-0" />
                  <span className="text-white text-sm">{tp.billOfSale}</span>
                </div>
                <a
                  href={`#doc-${registration.billOfSaleId}`}
                  className="text-tj-gold text-xs uppercase tracking-[0.2em] hover:text-white transition-colors min-h-[44px] flex items-center px-2"
                  onClick={(e) => {
                    e.preventDefault();
                    // Document viewing via Supabase storage or admin-provided link
                    // Placeholder: contact dealership for digital copy
                    alert('Contact Triple J Auto at (832) 400-9760 for your digital document.');
                  }}
                >
                  {tp.viewDocument}
                </a>
              </div>
              <div className="h-px bg-tj-gold/5" />
            </li>
          )}

          {/* As-Is Disclosure -- always present for BHPH sales */}
          <li>
            <div className="flex items-center justify-between min-h-[44px] py-2">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-white text-sm">{tp.asIsDisclosure}</span>
              </div>
              <span className="text-gray-400 text-xs italic">Available at dealership</span>
            </div>
          </li>
        </ul>
      ) : (
        <p className="text-gray-400 text-sm">{tp.noDocuments}</p>
      )}
    </div>
  );
};

export default OwnerDocuments;
