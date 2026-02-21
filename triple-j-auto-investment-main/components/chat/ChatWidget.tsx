// Phase 17: Divine Response - Chat Widget
//
// Floating gold chat button (bottom-right) that expands into a chat panel.
// Mobile: fullscreen (100dvh). Desktop: 400x600 windowed with rounded corners.
// Uses useDivineChat hook for streaming, profile tracking, error handling.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useDivineChat } from '../../hooks/useDivineChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatFallback } from './ChatFallback';
import type { Vehicle, TrackingEventType } from '../../types';
import type { VehicleContext } from '../../services/divineChatService';
import { trackEvent, getSessionId } from '../../services/trackingService';

interface ChatWidgetProps {
  vehicle: Vehicle;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ vehicle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { lang, t } = useLanguage();
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const inputFocusRef = useRef<HTMLInputElement>(null);

  // Build vehicle context from vehicle prop
  const vehicleContext: VehicleContext = {
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    price: vehicle.price,
    mileage: vehicle.mileage,
    status: vehicle.status,
    diagnostics: vehicle.diagnostics || [],
    description: vehicle.description,
    listingType: vehicle.listingType,
    dailyRate: vehicle.dailyRate,
    weeklyRate: vehicle.weeklyRate,
  };

  const {
    messages,
    sendMessage,
    clearChat,
    isStreaming,
    error,
    messagesEndRef,
  } = useDivineChat(vehicleContext, vehicle.id, lang);

  // ================================================================
  // KEYBOARD: Escape closes panel
  // ================================================================

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ================================================================
  // FOCUS MANAGEMENT: focus input on open, return to button on close
  // ================================================================

  useEffect(() => {
    if (isOpen) {
      // Small delay so the panel animation renders first
      const timer = setTimeout(() => {
        inputFocusRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      chatButtonRef.current?.focus();
    }
  }, [isOpen]);

  // ================================================================
  // TRACKING: fire chat_open when panel opens
  // ================================================================

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      trackEvent({
        event_type: 'chat_open' as TrackingEventType,
        vehicle_id: vehicle.id,
        page_path: window.location.pathname,
        metadata: {},
      });
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, vehicle.id]);

  // ================================================================
  // CHAT TRANSLATIONS
  // ================================================================

  const ct = t.chat || {
    title: 'Triple J Assistant',
    subtitle: 'Ask about this vehicle',
    openChat: 'Chat with us',
    closeChat: 'Close chat',
    placeholder: 'Ask about this vehicle...',
    welcome: 'Hi! I can help you learn about this vehicle. What would you like to know?',
    thinking: 'Thinking...',
    errorMessage: 'Chat is temporarily unavailable. Call us at (832) 400-9760.',
    callUs: 'Call (832) 400-9760',
    clearChat: 'Clear conversation',
    poweredBy: 'AI Assistant',
    maxReached: 'For a longer conversation, call us at (832) 400-9760.',
  };

  const vehicleSubtitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <>
      {/* ============================================================ */}
      {/* FLOATING CHAT BUTTON */}
      {/* ============================================================ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            ref={chatButtonRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-tj-gold text-black shadow-lg flex items-center justify-center cursor-pointer"
            aria-label={ct.openChat}
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* CHAT PANEL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-label="Chat"
            className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-[9998] w-full h-[100dvh] md:w-[400px] md:h-[600px] md:rounded-2xl bg-black border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* ======================================================== */}
            {/* HEADER */}
            {/* ======================================================== */}
            <div className="px-4 py-3 border-b border-white/10 bg-black/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/GoldTripleJLogo.png"
                  alt="Triple J"
                  className="w-8 h-8 object-contain shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-white text-sm font-semibold truncate">{ct.title}</h3>
                  <p className="text-gray-400 text-[10px] uppercase tracking-widest truncate">
                    {vehicleSubtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-2 text-gray-500 hover:text-gray-300 transition-colors rounded"
                    aria-label={ct.clearChat}
                    title={ct.clearChat}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded"
                  aria-label={ct.closeChat}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* MESSAGES AREA */}
            {/* ======================================================== */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Welcome message when no messages exist */}
              {messages.length === 0 && !error && (
                <ChatMessage role="model" text={ct.welcome} />
              )}

              {/* Chat messages */}
              {messages.map((msg) => (
                <ChatMessage key={msg.id} role={msg.role} text={msg.text} />
              ))}

              {/* Error fallback */}
              {error && <ChatFallback message={error} />}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* ======================================================== */}
            {/* FOOTER / INPUT */}
            {/* ======================================================== */}
            <ChatInput
              onSend={sendMessage}
              disabled={isStreaming}
              placeholder={ct.placeholder}
            />

            {/* Powered by label */}
            <div className="px-4 pb-2 text-center">
              <span className="text-[9px] text-gray-600 uppercase tracking-widest">
                {ct.poweredBy}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
