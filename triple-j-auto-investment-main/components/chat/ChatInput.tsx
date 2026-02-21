// Phase 17: Divine Response - Chat Text Input
//
// Single-line text input with send button. Enter submits.
// Auto-focuses on mount. 48px min-height for mobile touch targets.

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, placeholder }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-white/10">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-white/5 border border-white/10 rounded-full text-white text-sm px-4 py-3 pr-12 min-h-[48px] placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-tj-gold/50 disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className={`absolute right-2 p-2 rounded-full transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
            disabled || !input.trim()
              ? 'opacity-30 text-gray-400 cursor-not-allowed'
              : 'text-tj-gold hover:text-white'
          }`}
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
};
