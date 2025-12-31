import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  // Update index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Navigate to next image
  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Navigate to previous image
  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          nextImage();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextImage, prevImage, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex flex-col bg-black"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black via-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <ZoomIn className="text-tj-gold" size={20} />
              <span className="text-white text-sm font-mono">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-tj-gold p-3 transition-colors bg-black/50 backdrop-blur-sm border border-white/10 hover:border-tj-gold"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Image Area */}
          <div className="flex-grow flex items-center justify-center relative px-4 md:px-20 py-20">
            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 text-white hover:text-tj-gold p-4 md:p-6 transition-all bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-tj-gold group"
                >
                  <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 text-white hover:text-tj-gold p-4 md:p-6 transition-all bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-tj-gold group"
                >
                  <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.img
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
              <div className="flex justify-center gap-2 overflow-x-auto py-2 max-w-4xl mx-auto scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative flex-shrink-0 w-16 h-12 md:w-20 md:h-14 overflow-hidden transition-all ${
                      idx === currentIndex
                        ? 'ring-2 ring-tj-gold opacity-100 scale-105'
                        : 'opacity-40 hover:opacity-80 grayscale hover:grayscale-0'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard Hints */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-4 text-gray-600 text-[10px] uppercase tracking-widest">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 font-mono">←</kbd>
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 font-mono">→</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 font-mono">ESC</kbd>
              Close
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ImageLightbox;
