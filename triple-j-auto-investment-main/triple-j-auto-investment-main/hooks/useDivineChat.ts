// Phase 17: Divine Response - Chat State Management Hook
//
// Manages chat messages, streaming responses, profile identification,
// localStorage persistence, and error handling for the divine chat widget.

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  sendChatMessage,
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
} from '../services/divineChatService';
import type { ChatMessage, VehicleContext } from '../services/divineChatService';
import { identifyProfile } from '../utils/chatProfiles';
import type { ProfileType } from '../utils/chatProfiles';
import { getSessionId, trackEvent } from '../services/trackingService';
import type { TrackingEventType } from '../types';

export function useDivineChat(
  vehicleContext: VehicleContext,
  vehicleId: string,
  language: 'en' | 'es'
) {
  // ================================================================
  // STATE
  // ================================================================

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadChatHistory(vehicleId)
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [profile, setProfile] = useState<ProfileType>('unidentified');
  const [error, setError] = useState<string | null>(null);

  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ================================================================
  // AUTO-SCROLL on new messages
  // ================================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ================================================================
  // AUTO-SAVE to localStorage on message changes
  // ================================================================

  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(vehicleId, messages);
    }
  }, [vehicleId, messages]);

  // ================================================================
  // SEND MESSAGE
  // ================================================================

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Clear previous error
      setError(null);

      // Create user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text: text.trim(),
        timestamp: Date.now(),
      };

      // Add user message to state
      setMessages((prev) => [...prev, userMessage]);

      // Run profile identification on all user messages so far
      const allUserTexts = [
        ...messages.filter((m) => m.role === 'user').map((m) => m.text),
        text.trim(),
      ];
      const identified = identifyProfile(allUserTexts);
      setProfile(identified);

      // Track chat_message event
      trackEvent({
        event_type: 'chat_message' as TrackingEventType,
        vehicle_id: vehicleId,
        page_path: window.location.pathname,
        metadata: { messageCount: allUserTexts.length, profile: identified },
      });

      // Create placeholder model message for streaming
      const placeholderId = crypto.randomUUID();
      const placeholderMessage: ChatMessage = {
        id: placeholderId,
        role: 'model',
        text: '',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, placeholderMessage]);

      // Start streaming
      setIsStreaming(true);

      try {
        // Create abort controller for this request
        const controller = new AbortController();
        abortRef.current = controller;

        // Build history for API (exclude the placeholder)
        const history = [
          ...messages.map((m) => ({ role: m.role, text: m.text })),
          { role: 'user' as const, text: text.trim() },
        ];

        const response = await sendChatMessage({
          message: text.trim(),
          history,
          vehicleContext,
          sessionId: getSessionId(),
          language,
          identifiedProfile: identified,
        });

        if (!response.ok) {
          throw new Error('Service unavailable');
        }

        // Stream the response body
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Service unavailable');
        }

        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Check abort
          if (controller.signal.aborted) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          // Update placeholder message text
          const currentText = accumulated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === placeholderId ? { ...m, text: currentText } : m
            )
          );
        }
      } catch (err: unknown) {
        // Ignore abort errors (user cancelled)
        if (err instanceof Error && err.name === 'AbortError') return;

        // Set bilingual error message
        const errorMsg =
          language === 'es'
            ? 'El chat no esta disponible temporalmente. Llamenos al (832) 400-9760.'
            : 'Chat is temporarily unavailable. Call us at (832) 400-9760.';
        setError(errorMsg);

        // Remove the placeholder model message
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, vehicleContext, language]
  );

  // ================================================================
  // CLEAR CHAT
  // ================================================================

  const clearChat = useCallback(() => {
    setMessages([]);
    clearChatHistory(vehicleId);
    setProfile('unidentified');
    setError(null);
  }, [vehicleId]);

  // ================================================================
  // RETURN
  // ================================================================

  return {
    messages,
    sendMessage,
    clearChat,
    isStreaming,
    profile,
    error,
    messagesEndRef,
  };
}
