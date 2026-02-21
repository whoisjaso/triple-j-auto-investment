// Phase 17: Divine Response - Individual Chat Message Bubble
//
// Renders a single message with role-based styling (user right-aligned,
// model left-aligned). Model messages use react-markdown for rich text.

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  role: 'user' | 'model';
  text: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, text }) => {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-tj-gold/20 text-white rounded-2xl rounded-br-sm'
            : 'bg-white/5 text-gray-200 rounded-2xl rounded-bl-sm'
        }`}
      >
        {/* Empty text = streaming placeholder: show pulsing dots */}
        {!text ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        ) : isUser ? (
          // User messages: plain text
          <span>{text}</span>
        ) : (
          // Model messages: markdown rendering
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-a:text-tj-gold prose-strong:text-white">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
};
