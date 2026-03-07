/**
 * OwnerServiceReminders - Time-based maintenance schedule at 3/6/12 months.
 * Computes service due dates from purchaseDate.
 * Expandable checklist of generic maintenance items.
 *
 * Phase 19-02: Owner Portal UI
 */

import React, { useState } from 'react';
import { CheckCircle, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SERVICE_REMINDER_INTERVALS } from '../../types';
import type { Registration } from '../../types';

interface OwnerServiceRemindersProps {
  registration: Registration;
}

function addMonths(dateStr: string, months: number): Date {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

type ServiceStatus = 'upcoming' | 'due' | 'overdue';

function getServiceStatus(dueDate: Date): ServiceStatus {
  const now = new Date();
  const msUntilDue = dueDate.getTime() - now.getTime();
  const daysUntilDue = Math.floor(msUntilDue / 86400000);

  if (daysUntilDue > 14) return 'upcoming';
  if (daysUntilDue >= -30) return 'due';
  return 'overdue';
}

const StatusIcon: React.FC<{ status: ServiceStatus }> = ({ status }) => {
  if (status === 'upcoming') return <Calendar size={16} className="text-gray-400 flex-shrink-0" />;
  if (status === 'due') return <Clock size={16} className="text-amber-400 flex-shrink-0" />;
  return <CheckCircle size={16} className="text-green-400 flex-shrink-0" />;
};

const statusLabel: Record<ServiceStatus, string> = {
  upcoming: 'Upcoming',
  due: 'Due',
  overdue: 'Overdue',
};

const statusTextClass: Record<ServiceStatus, string> = {
  upcoming: 'text-gray-400',
  due: 'text-amber-400',
  overdue: 'text-green-400',
};

const intervalLabel: Record<number, 'month3' | 'month6' | 'month12'> = {
  3: 'month3',
  6: 'month6',
  12: 'month12',
};

const OwnerServiceReminders: React.FC<OwnerServiceRemindersProps> = ({ registration }) => {
  const { t } = useLanguage();
  const tp = t.ownerPortal;
  const [checklistOpen, setChecklistOpen] = useState(false);

  const purchaseDate = registration.purchaseDate;

  return (
    <div className="p-6 md:p-8 bg-black/40 border border-tj-gold/10 rounded-lg">
      <p className="text-[10px] uppercase tracking-[0.3em] text-tj-gold mb-4">{tp.serviceReminders}</p>

      {/* Service intervals */}
      <ul className="space-y-3 mb-5">
        {SERVICE_REMINDER_INTERVALS.map(({ months }) => {
          const dueDate = addMonths(purchaseDate, months);
          const status = getServiceStatus(dueDate);
          const labelKey = intervalLabel[months];

          return (
            <li key={months} className="flex items-center justify-between gap-4 py-2 border-b border-tj-gold/5 last:border-0">
              <div className="flex items-center gap-3">
                <StatusIcon status={status} />
                <div>
                  <p className="text-white text-sm">{tp[labelKey]}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(dueDate)}</p>
                </div>
              </div>
              <span className={`text-[10px] uppercase tracking-[0.2em] font-medium ${statusTextClass[status]}`}>
                {statusLabel[status]}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Expandable maintenance checklist */}
      <button
        onClick={() => setChecklistOpen((o) => !o)}
        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors min-h-[44px]"
        aria-expanded={checklistOpen}
      >
        {checklistOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Maintenance Checklist
      </button>

      {checklistOpen && (
        <ul className="mt-3 space-y-0">
          {tp.maintenanceChecklist.map(({ item }, idx) => (
            <li
              key={idx}
              className="flex items-center gap-3 py-3 border-b border-tj-gold/5 last:border-0"
            >
              <div className="w-4 h-4 rounded border border-tj-gold/30 flex-shrink-0" />
              <span className="text-sm text-gray-300">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OwnerServiceReminders;
