import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useScrollLock } from '../hooks/useScrollLock';

interface ImageGalleryProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Lock scroll when gallery is open
  useScrollLock(isOpen);

  // Sync with initialIndex when it changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
    }
  }, [isOpen, initialIndex]);

  // Navigation functions
  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % images.length);
    setScale(1);
  }, [images.length]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    setScale(1);
  }, [images.length]);

  // Swipe handling
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    if (scale > 1) return; // Don't navigate when zoomed

    const threshold = 50;
    const velocity = 0.5;

    if (info.offset.x > threshold || info.velocity.x > velocity) {
      goPrev();
    } else if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      goNext();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          setScale(s => Math.min(s + 0.5, 3));
          break;
        case '-':
          setScale(s => Math.max(s - 0.5, 1));
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, goNext, goPrev, onClose]);

  // Toggle zoom on double tap/click
  const handleDoubleTap = () => {
    setScale(s => s === 1 ? 2 : 1);
  };

  // Slide variants for smooth transitions
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0.5
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0.5
    })
  };

  if (typeof window === 'undefined' || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] flex flex-col bg-black"
          style={{ touchAction: 'none' }}
        >
          {/* Header with controls */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
          >
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              {/* Counter */}
              <span className="text-white/80 text-sm font-mono tracking-wider">
                {currentIndex + 1} / {images.length}
              </span>

              {/* Controls */}
              <div className="flex items-center gap-1">
                {/* Zoom toggle */}
                <button
                  onClick={() => setScale(s => s === 1 ? 2 : 1)}
                  className="p-3 text-white/80 hover:text-tj-gold transition-colors"
                  aria-label={scale > 1 ? 'Zoom out' : 'Zoom in'}
                >
                  {scale > 1 ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
                </button>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-3 text-white/80 hover:text-tj-gold transition-colors"
                  aria-label="Close gallery"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Main Image Area with Swipe */}
          <div className="flex-grow relative overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                drag={scale === 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                className="absolute inset-0 flex items-center justify-center"
                style={{ cursor: scale === 1 ? 'grab' : 'zoom-out' }}
              >
                <motion.img
                  src={images[currentIndex]}
                  alt={`Image ${currentIndex + 1} of ${images.length}`}
                  className="max-w-full max-h-full object-contain select-none pointer-events-auto"
                  draggable={false}
                  animate={{ scale }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  onDoubleClick={handleDoubleTap}
                  style={{
                    cursor: isDragging ? 'grabbing' : scale === 1 ? 'grab' : 'zoom-out'
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons (desktop) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-12 h-12 text-white/70 hover:text-tj-gold bg-black/50 hover:bg-black/80 transition-all border border-white/10 hover:border-tj-gold/50"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={goNext}
                  className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-12 h-12 text-white/70 hover:text-tj-gold bg-black/50 hover:bg-black/80 transition-all border border-white/10 hover:border-tj-gold/50"
                  aria-label="Next image"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            {/* Swipe indicator overlay (visible during drag) */}
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none"
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tj-gold/50">
                    <ChevronLeft size={48} />
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-tj-gold/50">
                    <ChevronRight size={48} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            >
              <div className="flex justify-center gap-2 overflow-x-auto py-2 px-4 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDirection(idx > currentIndex ? 1 : -1);
                      setCurrentIndex(idx);
                      setScale(1);
                    }}
                    className={`flex-shrink-0 w-16 h-12 overflow-hidden transition-all duration-200 border-2 ${
                      idx === currentIndex
                        ? 'border-tj-gold opacity-100 shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                        : 'border-transparent opacity-40 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Mobile Swipe Hint (only on first open, single image galleries excluded) */}
          {images.length > 1 && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="md:hidden absolute bottom-28 left-1/2 -translate-x-1/2 text-white/40 text-xs uppercase tracking-[0.2em] pointer-events-none"
            >
              Swipe to navigate
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ImageGallery;
