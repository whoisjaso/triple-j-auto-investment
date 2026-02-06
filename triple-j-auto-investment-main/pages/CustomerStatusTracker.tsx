/**
 * CustomerStatusTracker - Customer-facing registration status page
 * Accessible via unique link: /track/{orderId}-{token}
 *
 * Features:
 * - Animated progress arc and road visualization
 * - Token-based secure access
 * - Mobile-responsive layout (vertical road on mobile)
 * - Share button on mobile
 * - Haptic feedback on interactions
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Share2, Car } from 'lucide-react';
import {
  ProgressArc,
  ProgressRoad,
  StageInfo,
  LoadingCrest,
  ErrorState
} from '../components/tracking';
import {
  parseAccessKey,
  getRegistrationByAccessKey
} from '../services/registrationService';
import { Registration, RegistrationStageKey } from '../types';

const CustomerStatusTracker: React.FC = () => {
  const { accessKey } = useParams<{ accessKey: string }>();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'expired' | 'invalid' | 'not-found' | null>(null);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  useEffect(() => {
    const fetchRegistration = async () => {
      if (!accessKey) {
        setErrorType('invalid');
        setLoading(false);
        return;
      }

      const parsed = parseAccessKey(accessKey);
      if (!parsed) {
        setErrorType('invalid');
        setLoading(false);
        return;
      }

      const result = await getRegistrationByAccessKey(parsed.orderId, parsed.token);

      if (!result) {
        // Could be expired or not found - check which
        // For now, treat as invalid (service returns null for both)
        setErrorType('not-found');
        setLoading(false);
        return;
      }

      setRegistration(result);
      setLoading(false);
    };

    fetchRegistration();
  }, [accessKey]);

  // Calculate progress (1-6 stages, rejected = stage before rejection)
  const getProgress = (): { stageNumber: number; progress: number } => {
    if (!registration) return { stageNumber: 1, progress: 0 };

    const stage = registration.currentStage;
    if (stage === 'rejected') {
      // Show progress at dmv_processing level (stage 4)
      return { stageNumber: 4, progress: 4 / 6 };
    }

    const stageOrder: Record<RegistrationStageKey, number> = {
      sale_complete: 1,
      documents_collected: 2,
      submitted_to_dmv: 3,
      dmv_processing: 4,
      sticker_ready: 5,
      sticker_delivered: 6,
      rejected: 4 // Maps to dmv_processing visually
    };

    const num = stageOrder[stage] || 1;
    return { stageNumber: num, progress: num / 6 };
  };

  // Share button handler
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Registration Status - Triple J Auto Investment',
          url: window.location.href
        });
        // Haptic feedback on mobile
        if (navigator.vibrate) navigator.vibrate(50);
      } catch {
        // User cancelled or error - silently ignore
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        // Haptic feedback on mobile
        if (navigator.vibrate) navigator.vibrate(50);
      } catch {
        // Clipboard not available - silently ignore
      }
    }
  };

  // Handle stage tap on mobile (for arc)
  const handleStageClick = (stage: number) => {
    setSelectedStage(stage === selectedStage ? null : stage);
    if (navigator.vibrate) navigator.vibrate(25);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30">
        <LoadingCrest />
      </div>
    );
  }

  if (errorType) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 pt-24 px-4">
        <ErrorState type={errorType} />
      </div>
    );
  }

  const { stageNumber, progress } = getProgress();
  const isRejected = registration?.currentStage === 'rejected';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30">
      {/* Header */}
      <header className="pt-8 pb-4 text-center">
        <h1 className="text-gray-800 text-xl font-display tracking-wide">
          Triple J Auto Investment
        </h1>
        <p className="text-gray-500 text-sm mt-1">Registration Status</p>
      </header>

      {/* Vehicle info */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 text-gray-600 text-sm">
          <Car size={16} />
          <span>
            {registration?.vehicleYear} {registration?.vehicleMake} {registration?.vehicleModel}
          </span>
        </div>
        <p className="text-gray-400 text-xs mt-1">
          Order: {registration?.orderId}
        </p>
      </div>

      {/* Progress Arc */}
      <ProgressArc
        progress={progress}
        stageNumber={stageNumber}
        totalStages={6}
        onStageClick={handleStageClick}
      />

      {/* Progress Road (dominant element per CONTEXT.md) */}
      <div className="px-4 mt-4">
        <ProgressRoad
          progress={progress}
          vehicleType={registration?.vehicleBodyType}
        />
      </div>

      {/* Stage Info */}
      <div className="px-4">
        <StageInfo
          currentStage={registration?.currentStage || 'sale_complete'}
          isRejected={isRejected}
          milestones={{
            saleDate: registration?.saleDate,
            submissionDate: registration?.submissionDate,
            approvalDate: registration?.approvalDate,
            deliveryDate: registration?.deliveryDate
          }}
          rejectionNotes={registration?.rejectionNotes}
        />
      </div>

      {/* Share button (mobile only) */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button
          onClick={handleShare}
          className="w-12 h-12 bg-tj-gold rounded-full flex items-center justify-center shadow-lg hover:bg-amber-500 transition-colors"
          aria-label="Share tracking link"
        >
          <Share2 size={20} className="text-white" />
        </button>
      </div>

      {/* Footer with contact */}
      <footer className="mt-12 pb-8 text-center">
        <p className="text-gray-400 text-xs">
          Questions? Call{' '}
          <a href="tel:+17135550192" className="text-tj-gold hover:underline">
            (713) 555-0192
          </a>
        </p>
      </footer>
    </div>
  );
};

export default CustomerStatusTracker;
