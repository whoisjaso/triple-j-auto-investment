
import React, { useState, useRef } from 'react';
import { decodeVin } from '../services/nhtsaService';
import { VinResult } from '../types';
import { Fingerprint, Activity, ShieldAlert, Check, Cpu, Globe, AlertTriangle, Zap, Gauge, Layers, Search, Car, Fuel, Settings, Factory, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const VinLookup = () => {
  const { t } = useLanguage();
  const [vin, setVin] = useState('');
  const [result, setResult] = useState<VinResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  const validateInput = (value: string): string | null => {
    if (/[^A-Z0-9]/.test(value)) {
      return t.vinLookup.errors.lettersOnly;
    }
    const forbiddenMatch = value.match(/[IOQ]/);
    if (forbiddenMatch) {
      return `"${forbiddenMatch[0]}" ${t.vinLookup.errors.forbiddenChar}`;
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/\s/g, '');
    setVin(val);
    if (val.length > 0) {
      const validationError = validateInput(val);
      setError(validationError || '');
    } else {
      setError('');
    }
  };

  const handleDecode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const inputError = validateInput(vin);
    if (inputError) { setError(inputError); return; }
    if (vin.length !== 17) {
      setError(`${t.vinLookup.errors.exactLength} (${t.vinLookup.errors.currently} ${vin.length})`);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const data = await decodeVin(vin);

    if (data) {
      const errorCodes = (data.ErrorCode || '0').split(',').map((c: string) => c.trim());
      const fatalCodes = ['5', '6', '7', '8'];
      const hasFatalError = errorCodes.some((code: string) => fatalCodes.includes(code));
      const hasData = !!(data.Make && data.Model && data.ModelYear);

      if (hasFatalError && !hasData) {
        setError(t.vinLookup.logs.dataError || 'Unable to decode this VIN. Please verify and try again.');
      } else if (hasData) {
        setResult(data);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else {
        setError(t.vinLookup.errors.noData);
      }
    } else {
      setError(t.vinLookup.logs.connectionFailed || 'Connection failed. Please check your internet and try again.');
    }
    setLoading(false);
  };

  // Helper: spec row item
  const SpecItem = ({ icon: Icon, label, value, gold }: { icon: React.ElementType; label: string; value: string; gold?: boolean }) => (
    <div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/[0.06] group/spec hover:border-tj-gold/20 transition-colors">
      <div className="w-8 h-8 flex items-center justify-center bg-tj-gold/5 border border-tj-gold/20 flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-tj-gold" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">{label}</p>
        <p className={`text-sm font-mono tracking-wide ${gold ? 'text-tj-gold' : 'text-white'}`}>{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black px-4 md:px-6 pb-20 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Hero Header */}
        <div className="pt-28 pb-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-2 h-2 bg-tj-gold animate-pulse" />
            <p className="text-tj-gold uppercase tracking-[0.4em] text-[10px]">{t.vinLookup.badge}</p>
            <div className="w-2 h-2 bg-tj-gold animate-pulse" />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-5xl md:text-7xl text-white tracking-tight leading-none mb-4"
          >
            {t.vinLookup.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-sm max-w-lg mx-auto"
          >
            {t.vinLookup.subtitle}
          </motion.p>
        </div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <form onSubmit={handleDecode} className="relative">
            {/* VIN Input */}
            <div className={`bg-[#080808] border ${error ? 'border-red-500/40' : result ? 'border-tj-gold/40' : 'border-white/10'} p-6 md:p-8 transition-colors`}>
              <div className="flex items-center justify-between mb-4">
                <label className={`text-[10px] uppercase tracking-[0.3em] font-bold ${error ? 'text-red-400' : 'text-tj-gold'}`}>
                  {t.vinLookup.vinLabel}
                </label>
                {vin.length > 0 && (
                  <span className={`text-[10px] font-mono ${vin.length === 17 ? 'text-green-500' : 'text-gray-400'}`}>
                    {vin.length}/17
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Fingerprint size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={vin}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleDecode()}
                    placeholder={t.vinLookup.placeholder}
                    maxLength={17}
                    className={`w-full bg-black border ${error ? 'border-red-500/50 text-red-400' : 'border-white/10 text-white focus:border-tj-gold'} pl-12 pr-4 py-4 text-base md:text-lg font-mono focus:outline-none focus:ring-1 focus:ring-tj-gold/30 tracking-[0.15em] placeholder-gray-700 transition-all`}
                    spellCheck="false"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !!error || vin.length !== 17}
                  className="px-6 md:px-8 bg-tj-gold text-black font-bold text-xs uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 min-h-[56px] active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Search size={16} />
                      <span className="hidden md:inline">{t.vinLookup.decode}</span>
                    </>
                  )}
                </button>
              </div>

              {/* VIN Progress Bar */}
              <div className="mt-4 h-[2px] bg-white/5 overflow-hidden">
                <motion.div
                  className={`h-full ${error ? 'bg-red-500' : 'bg-tj-gold'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(vin.length / 17) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mt-4 px-3 py-2.5 bg-red-950/30 border border-red-500/20 text-red-400 text-xs">
                      <AlertTriangle size={14} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="space-y-1"
            >
              {/* Vehicle Identity — Hero Card */}
              <div className="bg-[#080808] border border-tj-gold/30 p-8 md:p-10 relative overflow-hidden">
                {/* Decorative watermark */}
                <Fingerprint className="absolute right-6 top-6 text-tj-gold/[0.04] w-32 h-32 -rotate-12 pointer-events-none" />

                <div className="flex items-center gap-2 mb-8">
                  <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full" />
                  <span className="text-[9px] text-green-500 uppercase tracking-[0.3em] font-bold">{t.vinLookup.resultLabels.verified}</span>
                </div>

                {/* Year / Make / Model — Large Display */}
                <div className="relative z-10 mb-8">
                  <p className="text-tj-gold text-[10px] uppercase tracking-[0.3em] mb-3">{t.vinLookup.resultLabels.year}</p>
                  <h2 className="font-display text-5xl md:text-7xl text-white leading-none tracking-tight mb-2">
                    {result.ModelYear}
                  </h2>
                  <h3 className="font-display text-3xl md:text-4xl text-tj-gold leading-none tracking-wider">
                    {result.Make} {result.Model}
                  </h3>
                </div>

                {/* Quick Stats Row */}
                <div className="flex flex-wrap gap-4 pt-6 border-t border-white/[0.06]">
                  {result.BodyClass && (
                    <div className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-[10px] text-gray-400 uppercase tracking-widest">
                      {result.BodyClass}
                    </div>
                  )}
                  {result.VehicleType && (
                    <div className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-[10px] text-gray-400 uppercase tracking-widest">
                      {result.VehicleType}
                    </div>
                  )}
                  {result.DriveType && (
                    <div className="px-3 py-1.5 bg-tj-gold/5 border border-tj-gold/20 text-[10px] text-tj-gold uppercase tracking-widest">
                      {result.DriveType}
                    </div>
                  )}
                  {result.FuelType && (
                    <div className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-[10px] text-gray-400 uppercase tracking-widest">
                      {result.FuelType}
                    </div>
                  )}
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {/* Engine & Performance */}
                <div className="bg-[#080808] border border-white/[0.06] p-6">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-tj-gold font-bold mb-5 flex items-center gap-2">
                    <Cpu size={12} /> {t.vinLookup.resultLabels.engineSpecs}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                      <span className="text-gray-400 text-xs flex items-center gap-2"><Activity size={12} /> {t.vinLookup.resultLabels.cylinders}</span>
                      <span className="text-white text-sm font-mono">{result.EngineCylinders || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                      <span className="text-gray-400 text-xs flex items-center gap-2"><Gauge size={12} /> {t.vinLookup.resultLabels.horsepower}</span>
                      <span className="text-white text-sm font-mono">{result.EngineHP ? `${result.EngineHP} HP` : '—'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                      <span className="text-gray-400 text-xs flex items-center gap-2"><Zap size={12} /> {t.vinLookup.resultLabels.drivetrain}</span>
                      <span className="text-tj-gold text-sm font-mono">{result.DriveType || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400 text-xs flex items-center gap-2"><Fuel size={12} /> {t.vinLookup.resultLabels.fuelSystem}</span>
                      <span className="text-white text-sm font-mono">{result.FuelType || t.vinLookup.resultLabels.standardCombustion}</span>
                    </div>
                  </div>
                </div>

                {/* Configuration */}
                <div className="bg-[#080808] border border-white/[0.06] p-6">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-tj-gold font-bold mb-5 flex items-center gap-2">
                    <Settings size={12} /> {t.vinLookup.resultLabels.detailedConfig}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                      <span className="text-gray-400 text-xs">{t.vinLookup.resultLabels.trimLevel}</span>
                      <span className="text-white text-sm font-mono">{result.Trim || t.vinLookup.baseTrim}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                      <span className="text-gray-400 text-xs">{t.vinLookup.resultLabels.series}</span>
                      <span className="text-white text-sm font-mono">{result.Series || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                      <span className="text-gray-400 text-xs">{t.vinLookup.resultLabels.transmission}</span>
                      <span className="text-white text-sm font-mono">{result.TransmissionStyle || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400 text-xs">{t.vinLookup.resultLabels.doors}</span>
                      <span className="text-white text-sm font-mono">{result.Doors ? `${result.Doors} ${t.vinLookup.doorSuffix}` : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manufacturing Origin — Footer Strip */}
              <div className="bg-[#080808] border border-white/[0.06] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-tj-gold/5 border border-tj-gold/20">
                    <Globe size={18} className="text-tj-gold" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-0.5">{t.vinLookup.resultLabels.manufacturingOrigin}</p>
                    <p className="text-white text-sm tracking-wider uppercase font-mono">{result.PlantCountry || 'N/A'}</p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-0.5">{t.vinLookup.resultLabels.mfgEntity}</p>
                  <p className="text-gray-300 text-xs uppercase font-mono">{result.Manufacturer || 'UNKNOWN'}</p>
                </div>
              </div>

              {/* Decode Another CTA */}
              <div className="pt-8 text-center">
                <button
                  onClick={() => { setResult(null); setVin(''); setError(''); }}
                  className="text-[10px] uppercase tracking-[0.3em] text-gray-400 hover:text-tj-gold transition-colors py-3 px-6 border border-white/[0.06] hover:border-tj-gold/30"
                >
                  {t.vinLookup.decodeAnother}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State — When no result */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center py-16 max-w-lg mx-auto"
          >
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 border border-white/[0.06] bg-white/[0.01]">
                <Car size={20} className="mx-auto text-gray-700 mb-2" />
                <p className="text-[9px] text-gray-400 uppercase tracking-widest">{t.vinLookup.resultLabels.manufacturer}</p>
              </div>
              <div className="p-4 border border-white/[0.06] bg-white/[0.01]">
                <Cpu size={20} className="mx-auto text-gray-700 mb-2" />
                <p className="text-[9px] text-gray-400 uppercase tracking-widest">{t.vinLookup.resultLabels.engineSpecs}</p>
              </div>
              <div className="p-4 border border-white/[0.06] bg-white/[0.01]">
                <Globe size={20} className="mx-auto text-gray-700 mb-2" />
                <p className="text-[9px] text-gray-400 uppercase tracking-widest">{t.vinLookup.resultLabels.manufacturingOrigin}</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              {t.vinLookup.subtitle}
            </p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 mx-auto border-2 border-tj-gold/20 border-t-tj-gold rounded-full mb-6"
            />
            <p className="text-gray-400 text-xs uppercase tracking-[0.3em]">{t.vinLookup.searching}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VinLookup;
