/**
 * NotificationPreferences - Reusable notification preference toggle
 * Supports compact mode (gear icon dropdown) and full mode (toggle buttons).
 *
 * Phase 04-04: Customer Portal - Notifications & Login
 */

import React, { useState, useRef, useEffect } from 'react';
import { Settings, Check } from 'lucide-react';
import { updateNotificationPreference } from '../services/notificationService';
import { NotificationPreference } from '../types';

interface NotificationPreferencesProps {
  registrationId: string;
  currentPreference: NotificationPreference;
  onUpdate?: (newPref: NotificationPreference) => void;
  compact?: boolean;
}

const PREF_OPTIONS: { value: NotificationPreference; label: string; description: string }[] = [
  { value: 'sms', label: 'SMS', description: 'Text messages only' },
  { value: 'email', label: 'Email', description: 'Email only' },
  { value: 'both', label: 'Both', description: 'SMS and email' },
  { value: 'none', label: 'None', description: 'No notifications' },
];

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  registrationId,
  currentPreference,
  onUpdate,
  compact = false,
}) => {
  const [pref, setPref] = useState<NotificationPreference>(currentPreference);
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with prop changes
  useEffect(() => {
    setPref(currentPreference);
  }, [currentPreference]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleSelect = async (newPref: NotificationPreference) => {
    if (newPref === pref) return;

    // Optimistic update
    const oldPref = pref;
    setPref(newPref);
    if (compact) setIsOpen(false);

    const success = await updateNotificationPreference(registrationId, newPref);
    if (success) {
      setFeedback('Preferences updated');
      setTimeout(() => setFeedback(null), 2000);
      onUpdate?.(newPref);
    } else {
      // Revert on failure
      setPref(oldPref);
      setFeedback('Update failed');
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  // Compact mode: gear icon with dropdown
  if (compact) {
    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full text-gray-400 hover:text-tj-gold hover:bg-white/5 transition-colors"
          aria-label="Notification preferences"
          title="Notification preferences"
        >
          <Settings size={16} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">
                Notifications
              </p>
            </div>
            {PREF_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                  pref === option.value
                    ? 'text-tj-gold bg-tj-gold/10'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span>{option.label}</span>
                {pref === option.value && <Check size={14} className="text-tj-gold" />}
              </button>
            ))}
            <div className="px-3 py-2 border-t border-white/10">
              <p className="text-[9px] text-gray-600">
                Login verification codes are always sent regardless of this setting.
              </p>
            </div>
          </div>
        )}

        {/* Feedback toast */}
        {feedback && (
          <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-white/10 rounded px-3 py-1.5 text-xs text-gray-300 whitespace-nowrap z-50">
            {feedback}
          </div>
        )}
      </div>
    );
  }

  // Full mode: toggle buttons in a row
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
        Notification Preferences
      </h3>
      <div className="flex flex-wrap gap-2">
        {PREF_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${
              pref === option.value
                ? 'bg-tj-gold text-black'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:border-tj-gold/30 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-gray-600">
        Login verification codes are always sent regardless of this setting.
      </p>

      {/* Feedback */}
      {feedback && (
        <p className={`text-xs ${feedback.includes('failed') ? 'text-red-400' : 'text-green-400'}`}>
          {feedback}
        </p>
      )}
    </div>
  );
};

export default NotificationPreferences;
