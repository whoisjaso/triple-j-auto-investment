import React from 'react';
import { Phone, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingCallButtonProps {
  phoneNumber?: string;
  show?: boolean;
}

export const FloatingCallButton: React.FC<FloatingCallButtonProps> = ({
  phoneNumber = '+18324009760',
  show = true
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href={`tel:${phoneNumber}`}
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="fixed bottom-8 left-8 z-40 bg-tj-gold text-black p-5 rounded-full shadow-[0_0_30px_rgba(212,175,55,0.6)] flex items-center justify-center group cursor-pointer"
          title="Speak with AI Agent"
        >
          {/* Phone Icon (default) */}
          <Phone size={28} className="group-hover:hidden transition-opacity" />

          {/* Mic Icon (on hover) */}
          <Mic size={28} className="hidden group-hover:block animate-pulse" />

          {/* Pulsing Ring */}
          <span className="absolute inset-0 rounded-full bg-tj-gold animate-ping opacity-30 pointer-events-none" />

          {/* Tooltip */}
          <span className="absolute left-full ml-4 bg-black text-tj-gold text-[10px] font-bold px-4 py-2 border border-tj-gold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none uppercase tracking-widest">
            Speak to AI Agent
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
};

export default FloatingCallButton;
