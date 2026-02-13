import React from 'react';
import { RegistrationStageKey, REGISTRATION_STAGES, getStageConfig } from '../../types';

interface StageInfoProps {
  currentStage: RegistrationStageKey;
  isRejected: boolean;
  milestones: {
    saleDate?: string;
    submissionDate?: string;
    approvalDate?: string;
    deliveryDate?: string;
  };
  rejectionNotes?: string;
}

// Customer-facing stage descriptions with more detail
const STAGE_DESCRIPTIONS: Record<RegistrationStageKey, string> = {
  sale_complete: 'Your vehicle purchase is complete! We\'re preparing the paperwork for your registration. You\'ll receive temporary plates to use until your permanent registration arrives.',
  documents_collected: 'We\'ve gathered all required documents including your title, insurance verification, and inspection certificate. Your registration packet is being prepared for DMV submission.',
  submitted_to_dmv: 'Your registration has been submitted to the Texas DMV through webDEALER. The state will review your application and process your permanent registration.',
  dmv_processing: 'The Texas DMV is currently reviewing your registration application. This typically takes 5-10 business days. We\'ll notify you as soon as it\'s approved.',
  sticker_ready: 'Great news! Your registration has been approved and your sticker is ready. Contact us to arrange pickup or delivery of your new registration sticker.',
  sticker_delivered: 'Your registration is complete! Your sticker has been delivered. Thank you for choosing Triple J Auto Investment.',
  rejected: 'Unfortunately, the DMV has flagged an issue with your registration. Our team is reviewing the notes and will contact you if any action is needed on your part.',
};

// Format date for display
const formatDate = (dateString?: string): string | null => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const StageInfo: React.FC<StageInfoProps> = ({
  currentStage,
  isRejected,
  milestones,
  rejectionNotes
}) => {
  const stageConfig = getStageConfig(currentStage);
  const description = STAGE_DESCRIPTIONS[currentStage];

  return (
    <div className="mt-8 text-center max-w-lg mx-auto px-4">
      {/* Rejected warning banner */}
      {isRejected && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50">
          <p className="text-red-400 font-medium">Registration Requires Attention</p>
          {rejectionNotes && (
            <p className="text-red-300/80 text-sm mt-1">{rejectionNotes}</p>
          )}
        </div>
      )}

      {/* Current stage heading */}
      <h2 className="text-white text-xl md:text-2xl font-display tracking-wide mb-3">
        {stageConfig?.label}
      </h2>

      {/* Description paragraph */}
      <p className="text-gray-400 text-sm md:text-base leading-relaxed">
        {description}
      </p>

      {/* Expected duration for predictable stages */}
      {stageConfig?.expectedDuration && currentStage !== 'sticker_delivered' && (
        <p className="text-gray-500 text-xs mt-3">
          Expected timeline: {stageConfig.expectedDuration}
        </p>
      )}

      {/* Completed stage dates */}
      <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
        {milestones.saleDate && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tj-gold/60" />
            Sale: {formatDate(milestones.saleDate)}
          </span>
        )}
        {milestones.submissionDate && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tj-gold/60" />
            Submitted: {formatDate(milestones.submissionDate)}
          </span>
        )}
        {milestones.approvalDate && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tj-gold/60" />
            Approved: {formatDate(milestones.approvalDate)}
          </span>
        )}
        {milestones.deliveryDate && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tj-gold/60" />
            Delivered: {formatDate(milestones.deliveryDate)}
          </span>
        )}
      </div>
    </div>
  );
};

export default StageInfo;
