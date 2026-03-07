import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Check, X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase/config';
import { getRegistrationDocuments, uploadDocument } from '../services/registrationService';
import type { RegistrationDocument } from '../types';

// ================================================================
// TYPES
// ================================================================
interface Props {
  registrationId: string;
  currentStage: string;
}

interface DocSlot {
  type: string;
  label: string;
  required: boolean;
}

const DOCUMENT_SLOTS: DocSlot[] = [
  { type: 'title_front', label: 'Title (Front)', required: true },
  { type: 'title_back', label: 'Title (Back)', required: true },
  { type: 'form_130u', label: 'Form 130-U', required: true },
  { type: 'insurance_proof', label: 'Proof of Insurance', required: true },
  { type: 'inspection_report', label: 'Inspection Report', required: true },
];

// ================================================================
// COMPONENT
// ================================================================
const CustomerDocumentUpload = ({ registrationId, currentStage }: Props) => {
  const [documents, setDocuments] = useState<RegistrationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Only show for stages where documents are needed
  const showUpload = ['sale_complete', 'documents_collected'].includes(currentStage);

  useEffect(() => {
    loadDocuments();
  }, [registrationId]);

  const loadDocuments = async () => {
    setLoading(true);
    const docs = await getRegistrationDocuments(registrationId);
    setDocuments(docs);
    setLoading(false);
  };

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType);
    setError('');

    // Upload file to Supabase Storage
    const fileName = `${registrationId}/${docType}-${Date.now()}.${file.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('registration-documents')
      .upload(fileName, file);

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('registration-documents')
      .getPublicUrl(uploadData.path);

    // Create document record
    const result = await uploadDocument({
      registrationId,
      stageKey: currentStage as any,
      documentType: docType,
      documentName: file.name,
      fileUrl: urlData.publicUrl,
      uploadedBy: 'customer',
    });

    if (!result) {
      setError('Failed to save document record');
    }

    setUploading(null);
    await loadDocuments();
  };

  if (!showUpload && documents.length === 0) return null;

  const getDocStatus = (docType: string) => {
    const doc = documents.find(d => d.documentType === docType);
    if (!doc) return 'missing';
    if (doc.rejectionReason) return 'rejected';
    if (doc.verified) return 'verified';
    return 'uploaded';
  };

  const completedCount = DOCUMENT_SLOTS.filter(s => {
    const status = getDocStatus(s.type);
    return status === 'uploaded' || status === 'verified';
  }).length;

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 size={20} className="animate-spin text-tj-gold" />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white text-sm font-bold uppercase tracking-widest">
          Required Documents
        </h3>
        <span className="text-gray-500 text-xs">
          {completedCount}/{DOCUMENT_SLOTS.length} uploaded
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 border border-red-500/20">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="space-y-2">
        {DOCUMENT_SLOTS.map((slot, i) => {
          const status = getDocStatus(slot.type);
          const doc = documents.find(d => d.documentType === slot.type);

          return (
            <motion.div
              key={slot.type}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center justify-between p-3 border transition-all ${
                status === 'verified' ? 'border-green-500/30 bg-green-500/5' :
                status === 'uploaded' ? 'border-tj-gold/30 bg-tj-gold/5' :
                status === 'rejected' ? 'border-red-500/30 bg-red-500/5' :
                'border-white/[0.08] bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 flex items-center justify-center ${
                  status === 'verified' ? 'text-green-400' :
                  status === 'uploaded' ? 'text-tj-gold' :
                  status === 'rejected' ? 'text-red-400' :
                  'text-gray-600'
                }`}>
                  {status === 'verified' ? <Check size={16} /> :
                   status === 'uploaded' ? <FileText size={16} /> :
                   status === 'rejected' ? <X size={16} /> :
                   <Upload size={16} />}
                </div>
                <div>
                  <p className={`text-sm ${status === 'missing' ? 'text-gray-400' : 'text-white'}`}>
                    {slot.label}
                  </p>
                  {status === 'rejected' && doc?.rejectionReason && (
                    <p className="text-red-400 text-[10px]">{doc.rejectionReason}</p>
                  )}
                  {status === 'verified' && (
                    <p className="text-green-400 text-[10px] uppercase tracking-widest">Verified</p>
                  )}
                  {status === 'uploaded' && (
                    <p className="text-tj-gold text-[10px] uppercase tracking-widest">Pending Review</p>
                  )}
                </div>
              </div>

              {(status === 'missing' || status === 'rejected') && showUpload && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(slot.type, file);
                    }}
                  />
                  {uploading === slot.type ? (
                    <Loader2 size={16} className="animate-spin text-tj-gold" />
                  ) : (
                    <span className="text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors">
                      Upload
                    </span>
                  )}
                </label>
              )}
            </motion.div>
          );
        })}
      </div>

      {completedCount === DOCUMENT_SLOTS.length && (
        <p className="text-green-400 text-xs text-center mt-4">
          All documents uploaded — we'll review and process your registration shortly.
        </p>
      )}
    </div>
  );
};

export default CustomerDocumentUpload;
