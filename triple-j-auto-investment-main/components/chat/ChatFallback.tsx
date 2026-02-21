// Phase 17: Divine Response - Chat Error/Fallback UI
//
// Shows error message with phone number CTA when chat service is down.
// Bilingual via useLanguage().

import React from 'react';
import { AlertCircle, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ChatFallbackProps {
  message?: string;
}

export const ChatFallback: React.FC<ChatFallbackProps> = ({ message }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mx-4 my-2">
      <div className="flex flex-col items-center text-center gap-3">
        <AlertCircle size={20} className="text-red-400" />
        <p className="text-sm text-gray-300">
          {message || t.chat?.errorMessage || 'Chat is temporarily unavailable. Call us at (832) 400-9760.'}
        </p>
        <a
          href="tel:+18324009760"
          className="inline-flex items-center gap-2 bg-tj-gold text-black px-4 py-2 rounded font-bold text-sm hover:bg-tj-gold/90 transition-colors"
        >
          <Phone size={14} />
          {t.chat?.callUs || 'Call (832) 400-9760'}
        </a>
      </div>
    </div>
  );
};
