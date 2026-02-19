import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Vehicle } from '../types';

interface VehicleStorySectionProps {
  vehicle: Vehicle;
}

export const VehicleStorySection: React.FC<VehicleStorySectionProps> = ({ vehicle }) => {
  const { lang, t } = useLanguage();

  const story =
    lang === 'es'
      ? vehicle.vehicleStoryEs || vehicle.vehicleStory || t.vehicleDetail.fallbackStory
      : vehicle.vehicleStory || t.vehicleDetail.fallbackStory;

  const hasDiagnostics = vehicle.diagnostics && vehicle.diagnostics.length > 0;

  return (
    <motion.section
      className="py-8 border-t border-white/[0.04]"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Story heading */}
      <h3 className="font-display text-lg tracking-[0.2em] uppercase text-white mb-4">
        {t.vehicleDetail.vehicleStoryHeading}
      </h3>

      {/* Story text */}
      <p className="text-gray-400 leading-relaxed whitespace-pre-line">
        {story}
      </p>

      {/* Condition notes (honest disclosure) */}
      {hasDiagnostics && (
        <div className="mt-6">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">
            {t.vehicleDetail.conditionHeading}
          </h4>
          <ul className="space-y-2">
            {vehicle.diagnostics!.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-tj-gold flex-shrink-0" />
                <span className="text-gray-400 text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  );
};
