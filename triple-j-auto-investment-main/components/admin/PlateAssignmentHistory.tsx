/**
 * Plate Assignment History Timeline
 *
 * Phase 07-02: Reusable component showing the assignment log for a single plate.
 * Renders as a vertical timeline consistent with audit history patterns.
 *
 * Props:
 * - plateId: string - The plate to show history for
 * - isOpen: boolean - Whether the history panel is expanded
 */

import React, { useState, useEffect } from 'react';
import {
  Key,
  ShoppingCart,
  Car,
  CheckCircle,
  AlertTriangle,
  Clock,
  Phone,
  Loader2,
} from 'lucide-react';
import { PlateAssignment } from '../../types';
import { getPlateHistory } from '../../services/plateService';

// ================================================================
// TYPES
// ================================================================

interface PlateAssignmentHistoryProps {
  plateId: string;
  isOpen: boolean;
}

// ================================================================
// CONSTANTS
// ================================================================

const ASSIGNMENT_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  rental: { label: 'Rental', icon: <Key size={12} />, color: 'text-blue-400 bg-blue-500/20 border-blue-500/50' },
  sale: { label: 'Sale', icon: <ShoppingCart size={12} />, color: 'text-amber-400 bg-amber-500/20 border-amber-500/50' },
  inventory: { label: 'Inventory', icon: <Car size={12} />, color: 'text-gray-400 bg-gray-500/20 border-gray-500/50' },
};

// ================================================================
// FORMAT HELPERS
// ================================================================

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// ================================================================
// COMPONENT
// ================================================================

export const PlateAssignmentHistory: React.FC<PlateAssignmentHistoryProps> = ({ plateId, isOpen }) => {
  const [history, setHistory] = useState<PlateAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen || loaded) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await getPlateHistory(plateId);
        setHistory(data);
        setLoaded(true);
      } catch (error) {
        console.error('Error loading plate history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [plateId, isOpen, loaded]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="py-6 flex items-center justify-center text-gray-500">
        <Loader2 size={16} className="animate-spin mr-2" />
        <span className="text-xs uppercase tracking-widest">Loading history...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-6 text-center text-gray-600 text-xs uppercase tracking-widest">
        No assignment history
      </div>
    );
  }

  return (
    <div className="py-4 space-y-0">
      {history.map((assignment, index) => {
        const config = ASSIGNMENT_TYPE_CONFIG[assignment.assignmentType] || ASSIGNMENT_TYPE_CONFIG.inventory;
        const isActive = !assignment.returnedAt;
        const isLast = index === history.length - 1;

        return (
          <div key={assignment.id} className="relative flex gap-3">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px bg-tj-gold/20" />
            )}

            {/* Timeline dot */}
            <div className={`relative z-10 mt-1 w-[23px] h-[23px] flex items-center justify-center rounded-full border ${
              isActive
                ? 'bg-tj-gold/20 border-tj-gold text-tj-gold'
                : 'bg-gray-800 border-gray-600 text-gray-500'
            }`}>
              {config.icon}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-4 ${isLast ? '' : 'border-b-0'}`}>
              {/* Header row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold border ${config.color}`}>
                  {config.label}
                </span>
                {isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/50">
                    <Clock size={10} />
                    Currently Out
                  </span>
                )}
                {!isActive && assignment.returnConfirmed && (
                  <span className="inline-flex items-center gap-1 text-[9px] text-green-500">
                    <CheckCircle size={10} />
                    Confirmed
                  </span>
                )}
                {!isActive && !assignment.returnConfirmed && (
                  <span className="inline-flex items-center gap-1 text-[9px] text-red-400">
                    <AlertTriangle size={10} />
                    Not confirmed
                  </span>
                )}
              </div>

              {/* Customer info */}
              {assignment.customerName && (
                <div className="mt-1.5 text-sm text-white font-medium">
                  {assignment.customerName}
                  {assignment.customerPhone && (
                    <a
                      href={`tel:${assignment.customerPhone}`}
                      className="inline-flex items-center gap-1 ml-2 text-xs text-gray-400 hover:text-tj-gold transition-colors"
                    >
                      <Phone size={10} />
                      {assignment.customerPhone}
                    </a>
                  )}
                </div>
              )}

              {/* Vehicle info */}
              {assignment.vehicle && (
                <div className="mt-1 text-xs text-gray-400">
                  {assignment.vehicle.year} {assignment.vehicle.make} {assignment.vehicle.model}
                </div>
              )}

              {/* Dates */}
              <div className="mt-1.5 text-[10px] text-gray-500 font-mono">
                {formatDate(assignment.assignedAt)}
                <span className="mx-1.5 text-gray-700">-{'>'}</span>
                {assignment.returnedAt ? formatDate(assignment.returnedAt) : 'Present'}
              </div>

              {/* Notes */}
              {assignment.notes && (
                <div className="mt-1.5 text-[10px] text-gray-500 italic">
                  {assignment.notes}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlateAssignmentHistory;
