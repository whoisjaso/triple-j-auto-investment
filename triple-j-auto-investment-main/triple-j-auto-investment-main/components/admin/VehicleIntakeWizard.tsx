import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, ChevronRight, ChevronLeft, X, Check, DollarSign,
  Wrench, Truck, PaintBucket, AlertTriangle, Camera, Wand2, Eye,
  Sparkles, RefreshCw,
} from 'lucide-react';
import { decodeVin } from '../../services/nhtsaService';
import { generateVehicleDescription, generateIdentityHeadline, generateVehicleStory } from '../../services/geminiService';
import { useStore } from '../../context/Store';
import { Vehicle, VehicleStatus, IntakeConditionFlag, IntakeSource } from '../../types';
import VehiclePhotoUploader from './VehiclePhotoUploader';

// ================================================================
// TYPES & CONSTANTS
// ================================================================
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (vehicle: Vehicle) => void;
}

const CONDITION_FLAGS: { flag: IntakeConditionFlag['flag']; label: string; icon: typeof Wrench }[] = [
  { flag: 'check_engine', label: 'Check Engine', icon: AlertTriangle },
  { flag: 'dents', label: 'Dents', icon: Truck },
  { flag: 'scratches', label: 'Scratches', icon: PaintBucket },
  { flag: 'tire_wear', label: 'Tire Wear', icon: Wrench },
  { flag: 'interior_damage', label: 'Interior Damage', icon: Wrench },
  { flag: 'mechanical_issues', label: 'Mechanical Issues', icon: Wrench },
  { flag: 'other', label: 'Other', icon: AlertTriangle },
];

const INTAKE_SOURCES: { value: IntakeSource; label: string }[] = [
  { value: 'manheim', label: 'Manheim Auction' },
  { value: 'adesa', label: 'ADESA Auction' },
  { value: 'other_auction', label: 'Other Auction' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'private', label: 'Private Purchase' },
  { value: 'trade_in', label: 'Trade-In' },
];

const STEP_LABELS = ['VIN Decode', 'Costs & Pricing', 'Condition', 'Photos', 'AI Content', 'Review'];

// ================================================================
// WIZARD COMPONENT
// ================================================================
const VehicleIntakeWizard = ({ isOpen, onClose, onCreated }: Props) => {
  const { addVehicle } = useStore();
  const tempVehicleId = useRef(Math.random().toString(36).substr(2, 9));

  // Step state
  const [step, setStep] = useState(1);

  // Step 1: VIN
  const [vin, setVin] = useState('');
  const [decoding, setDecoding] = useState(false);
  const [vinError, setVinError] = useState('');
  const [decoded, setDecoded] = useState(false);

  // Vehicle data (accumulated across steps)
  const [data, setData] = useState<Partial<Vehicle>>({
    status: VehicleStatus.DRAFT,
  });
  const [decodedBodyType, setDecodedBodyType] = useState('');

  // Step 2: Costs
  const [costTowing, setCostTowing] = useState(0);
  const [costMechanical, setCostMechanical] = useState(0);
  const [costCosmetic, setCostCosmetic] = useState(0);
  const [costOther, setCostOther] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);

  // Step 3: Condition
  const [conditions, setConditions] = useState<IntakeConditionFlag[]>(
    CONDITION_FLAGS.map(f => ({ flag: f.flag, active: false }))
  );
  const [intakeSource, setIntakeSource] = useState<IntakeSource>('manheim');
  const [intakeSourceName, setIntakeSourceName] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');

  // Step 4: Photos
  const [photos, setPhotos] = useState<string[]>([]);

  // Step 5: AI Content
  const [aiDescription, setAiDescription] = useState('');
  const [aiHeadline, setAiHeadline] = useState({ en: '', es: '' });
  const [aiStory, setAiStory] = useState({ en: '', es: '' });
  const [generatingAi, setGeneratingAi] = useState(false);

  // Step 6: Publish
  const [publishNow, setPublishNow] = useState(false);
  const [listingType, setListingType] = useState<'sale_only' | 'rental_only' | 'both'>('sale_only');
  const [dailyRate, setDailyRate] = useState(0);
  const [weeklyRate, setWeeklyRate] = useState(0);
  const [creating, setCreating] = useState(false);

  // ================================================================
  // HANDLERS
  // ================================================================
  const handleDecodeVin = async () => {
    if (vin.length !== 17) { setVinError('VIN must be 17 characters'); return; }
    setDecoding(true);
    setVinError('');
    const result = await decodeVin(vin);
    setDecoding(false);

    if (!result || result.ErrorCode !== '0') {
      setVinError('Could not decode VIN. Please check and try again.');
      return;
    }

    setData(prev => ({
      ...prev,
      vin,
      year: parseInt(result.ModelYear) || new Date().getFullYear(),
      make: result.Make,
      model: result.Model,
    }));
    setDecodedBodyType(result.BodyClass || result.VehicleType || '');
    setDecoded(true);
  };

  const totalCost = purchasePrice + costTowing + costMechanical + costCosmetic + costOther;
  const suggestedPrice = Math.round((totalCost * 1.4) / 500) * 500;

  const handleCostNext = () => {
    setData(prev => ({
      ...prev,
      cost: purchasePrice,
      costTowing,
      costMechanical,
      costCosmetic,
      costOther,
      purchasePrice,
      price: data.price || suggestedPrice,
      suggestedPrice,
    }));
    setStep(3);
  };

  const handleConditionNext = () => {
    const activeDiags = conditions.filter(c => c.active).map(c => {
      const label = CONDITION_FLAGS.find(f => f.flag === c.flag)?.label || c.flag;
      return c.notes ? `${label}: ${c.notes}` : label;
    });
    setData(prev => ({
      ...prev,
      diagnostics: activeDiags,
    }));
    setStep(4);
  };

  const handlePhotosNext = () => {
    setData(prev => ({
      ...prev,
      imageUrl: photos[0] || '',
      gallery: photos.slice(1),
    }));
    setStep(5);
  };

  const generateAiContent = async () => {
    if (!data.make || !data.model) return;
    setGeneratingAi(true);
    const diags = data.diagnostics || [];
    try {
      const [desc, headline, story] = await Promise.all([
        generateVehicleDescription(data.make, data.model, data.year || 2024, diags),
        generateIdentityHeadline(data.make, data.model, data.year || 2024, decodedBodyType || undefined, diags),
        generateVehicleStory(data.make, data.model, data.year || 2024, data.mileage || 0, diags, ''),
      ]);
      setAiDescription(desc);
      setAiHeadline(headline);
      setAiStory(story);
    } catch (e) {
      console.error('AI generation failed:', e);
    }
    setGeneratingAi(false);
  };

  const handleAiNext = () => {
    setData(prev => ({
      ...prev,
      description: aiDescription,
      identityHeadline: aiHeadline.en,
      identityHeadlineEs: aiHeadline.es,
      vehicleStory: aiStory.en,
      vehicleStoryEs: aiStory.es,
    }));
    setStep(6);
  };

  const handleCreate = async () => {
    setCreating(true);
    const vehicle: Vehicle = {
      id: tempVehicleId.current,
      make: data.make || '',
      model: data.model || '',
      year: data.year || new Date().getFullYear(),
      price: data.price || suggestedPrice,
      cost: purchasePrice,
      costTowing,
      costMechanical,
      costCosmetic,
      costOther,
      mileage: data.mileage || 0,
      vin: data.vin || '',
      status: publishNow ? VehicleStatus.AVAILABLE : VehicleStatus.DRAFT,
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      gallery: data.gallery || [],
      diagnostics: data.diagnostics || [],
      identityHeadline: data.identityHeadline,
      identityHeadlineEs: data.identityHeadlineEs,
      vehicleStory: data.vehicleStory,
      vehicleStoryEs: data.vehicleStoryEs,
      purchasePrice,
      suggestedPrice,
      intakeSource: 'manual' as const,
      listingType: listingType === 'sale_only' ? 'sale' : listingType === 'rental_only' ? 'rental' : 'both',
      dailyRate: listingType !== 'sale_only' ? dailyRate : undefined,
      weeklyRate: listingType !== 'sale_only' ? weeklyRate : undefined,
    } as Vehicle;

    try {
      await addVehicle(vehicle);
      onCreated(vehicle);
      onClose();
    } catch (e) {
      console.error('Failed to create vehicle:', e);
    }
    setCreating(false);
  };

  if (!isOpen) return null;

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/[0.08] mx-4"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/[0.06] p-4 flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-bold tracking-tight">Quick Vehicle Intake</h2>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">
              Step {step} of 6 — {STEP_LABELS[step - 1]}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 px-4 py-2">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 transition-all ${
                i + 1 <= step ? 'bg-tj-gold' : 'bg-white/[0.06]'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* STEP 1: VIN DECODE */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 block">VIN Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={vin}
                    onChange={e => { setVin(e.target.value.toUpperCase()); setVinError(''); setDecoded(false); }}
                    placeholder="Enter 17-character VIN"
                    maxLength={17}
                    className="flex-1 bg-black border border-white/[0.08] text-white font-mono text-lg px-4 py-3 focus:border-tj-gold/50 focus:outline-none tracking-widest uppercase"
                  />
                  <button
                    onClick={handleDecodeVin}
                    disabled={decoding || vin.length !== 17}
                    className="px-6 bg-tj-gold text-black font-bold text-xs uppercase tracking-widest disabled:opacity-30 hover:bg-tj-gold/90 transition-all"
                  >
                    {decoding ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  </button>
                </div>
                {vinError && <p className="text-red-400 text-xs mt-2">{vinError}</p>}
                <p className="text-gray-600 text-[10px] mt-1">{vin.length}/17 characters</p>
              </div>

              {decoded && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <p className="text-green-400 text-xs flex items-center gap-2"><Check size={14} /> VIN Decoded Successfully</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Year', value: data.year },
                      { label: 'Make', value: data.make },
                      { label: 'Model', value: data.model },
                      { label: 'Body Type', value: decodedBodyType },
                    ].map(f => (
                      <div key={f.label} className="bg-black border border-white/[0.06] p-3">
                        <p className="text-gray-500 text-[10px] uppercase tracking-widest">{f.label}</p>
                        <p className="text-white text-sm font-mono">{f.value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Mileage</label>
                    <input
                      type="number"
                      value={data.mileage || ''}
                      onChange={e => setData(prev => ({ ...prev, mileage: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter mileage"
                      className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* STEP 2: COSTS & PRICING */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Purchase Price', value: purchasePrice, set: setPurchasePrice, icon: DollarSign },
                  { label: 'Towing Cost', value: costTowing, set: setCostTowing, icon: Truck },
                  { label: 'Mechanical Cost', value: costMechanical, set: setCostMechanical, icon: Wrench },
                  { label: 'Cosmetic Cost', value: costCosmetic, set: setCostCosmetic, icon: PaintBucket },
                  { label: 'Other Cost', value: costOther, set: setCostOther, icon: DollarSign },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1">
                      <f.icon size={10} /> {f.label}
                    </label>
                    <input
                      type="number"
                      value={f.value || ''}
                      onChange={e => f.set(parseInt(e.target.value) || 0)}
                      className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
                <div className="bg-black border border-white/[0.06] p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">Total Cost</p>
                  <p className="text-white text-lg font-mono">${totalCost.toLocaleString()}</p>
                </div>
                <div className="bg-black border border-tj-gold/20 p-3">
                  <p className="text-tj-gold text-[10px] uppercase tracking-widest">Suggested Price</p>
                  <p className="text-tj-gold text-lg font-mono">${suggestedPrice.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Listing Price</label>
                  <input
                    type="number"
                    value={data.price || suggestedPrice || ''}
                    onChange={e => setData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black border border-white/[0.08] text-white text-lg px-3 py-2 focus:border-tj-gold/50 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONDITION & SOURCE */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-3">Condition Flags</p>
                <div className="grid grid-cols-2 gap-2">
                  {conditions.map((cond, i) => {
                    const info = CONDITION_FLAGS[i];
                    return (
                      <div key={cond.flag} className={`border p-3 transition-all cursor-pointer ${cond.active ? 'border-red-500/40 bg-red-500/5' : 'border-white/[0.06] hover:border-white/20'}`}>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <button
                            onClick={() => {
                              const updated = [...conditions];
                              updated[i] = { ...updated[i], active: !updated[i].active };
                              setConditions(updated);
                            }}
                            className={`w-4 h-4 border flex items-center justify-center transition-all ${cond.active ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-white/20 text-transparent'}`}
                          >
                            <Check size={10} />
                          </button>
                          <info.icon size={12} className={cond.active ? 'text-red-400' : 'text-gray-600'} />
                          <span className={`text-xs ${cond.active ? 'text-white' : 'text-gray-400'}`}>{info.label}</span>
                        </label>
                        {cond.active && (
                          <input
                            type="text"
                            placeholder="Notes..."
                            value={cond.notes || ''}
                            onChange={e => {
                              const updated = [...conditions];
                              updated[i] = { ...updated[i], notes: e.target.value };
                              setConditions(updated);
                            }}
                            className="mt-2 w-full bg-black border border-white/[0.06] text-white text-xs px-2 py-1 focus:outline-none focus:border-red-500/30"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Source</label>
                  <select
                    value={intakeSource}
                    onChange={e => setIntakeSource(e.target.value as IntakeSource)}
                    className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none"
                  >
                    {INTAKE_SOURCES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Seller / Auction Name</label>
                  <input
                    type="text"
                    value={intakeSourceName}
                    onChange={e => setIntakeSourceName(e.target.value)}
                    placeholder="e.g. Manheim Houston"
                    className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Intake Notes</label>
                <textarea
                  value={intakeNotes}
                  onChange={e => setIntakeNotes(e.target.value)}
                  rows={3}
                  placeholder="Any additional notes about the vehicle condition..."
                  className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 4: PHOTOS */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest">Upload Vehicle Photos</p>
              <VehiclePhotoUploader
                vehicleId={tempVehicleId.current}
                photos={photos}
                onChange={setPhotos}
              />
              {photos.length === 0 && (
                <p className="text-gray-600 text-xs text-center py-4">No photos yet — you can add them later too</p>
              )}
            </div>
          )}

          {/* STEP 5: AI CONTENT */}
          {step === 5 && (
            <div className="space-y-4">
              {!aiDescription && !generatingAi && (
                <button
                  onClick={generateAiContent}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold hover:bg-tj-gold hover:text-black transition-all text-sm font-bold uppercase tracking-widest"
                >
                  <Sparkles size={16} />
                  Generate AI Content
                </button>
              )}

              {generatingAi && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Wand2 size={32} className="text-tj-gold animate-pulse mb-4" />
                  <p className="text-gray-400 text-sm">Generating description, headline, and story...</p>
                </div>
              )}

              {aiDescription && !generatingAi && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-500 text-[10px] uppercase tracking-widest">Description</label>
                      <button onClick={generateAiContent} className="text-gray-500 hover:text-tj-gold text-[10px] flex items-center gap-1">
                        <RefreshCw size={10} /> Regenerate
                      </button>
                    </div>
                    <textarea
                      value={aiDescription}
                      onChange={e => setAiDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Headline (EN)</label>
                      <input
                        type="text"
                        value={aiHeadline.en}
                        onChange={e => setAiHeadline(prev => ({ ...prev, en: e.target.value }))}
                        className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Headline (ES)</label>
                      <input
                        type="text"
                        value={aiHeadline.es}
                        onChange={e => setAiHeadline(prev => ({ ...prev, es: e.target.value }))}
                        className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Vehicle Story (EN)</label>
                    <textarea
                      value={aiStory.en}
                      onChange={e => setAiStory(prev => ({ ...prev, en: e.target.value }))}
                      rows={3}
                      className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Vehicle Story (ES)</label>
                    <textarea
                      value={aiStory.es}
                      onChange={e => setAiStory(prev => ({ ...prev, es: e.target.value }))}
                      rows={3}
                      className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* STEP 6: REVIEW & PUBLISH */}
          {step === 6 && (
            <div className="space-y-6">
              {/* Vehicle Summary */}
              <div className="bg-black border border-white/[0.06] p-4">
                <div className="flex items-start gap-4">
                  {data.imageUrl && (
                    <img src={data.imageUrl} alt="" className="w-24 h-18 object-cover border border-white/[0.06]" />
                  )}
                  <div className="flex-1">
                    <p className="text-tj-gold text-[10px] uppercase tracking-widest">{data.year} {data.make}</p>
                    <p className="text-white text-lg font-bold">{data.model}</p>
                    <p className="text-gray-400 text-xs mt-1">{data.vin}</p>
                    {data.mileage ? <p className="text-gray-500 text-xs">{data.mileage?.toLocaleString()} miles</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="text-tj-gold text-xl font-mono">${(data.price || suggestedPrice).toLocaleString()}</p>
                    <p className="text-gray-500 text-[10px]">Cost: ${totalCost.toLocaleString()}</p>
                  </div>
                </div>
                {data.description && (
                  <p className="text-gray-400 text-xs mt-3 border-t border-white/[0.06] pt-3">{data.description}</p>
                )}
              </div>

              {/* Publish Options */}
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <button
                    onClick={() => setPublishNow(!publishNow)}
                    className={`w-5 h-5 border flex items-center justify-center transition-all ${
                      publishNow ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/20 text-transparent hover:border-white/40'
                    }`}
                  >
                    <Check size={12} />
                  </button>
                  <span className="text-gray-300 text-sm group-hover:text-white transition-colors">Publish Now (set status to Available)</span>
                </label>

                <div>
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 block">Listing Type</label>
                  <div className="flex gap-2">
                    {(['sale_only', 'rental_only', 'both'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setListingType(type)}
                        className={`px-4 py-2 text-xs uppercase tracking-widest font-bold border transition-all ${
                          listingType === type
                            ? 'bg-tj-gold text-black border-tj-gold'
                            : 'text-gray-400 border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {listingType !== 'sale_only' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Daily Rate</label>
                      <input
                        type="number"
                        value={dailyRate || ''}
                        onChange={e => setDailyRate(parseInt(e.target.value) || 0)}
                        className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Weekly Rate</label>
                      <input
                        type="number"
                        value={weeklyRate || ''}
                        onChange={e => setWeeklyRate(parseInt(e.target.value) || 0)}
                        className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="sticky bottom-0 bg-[#0a0a0a] border-t border-white/[0.06] p-4 flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-xs uppercase tracking-widest transition-colors"
          >
            <ChevronLeft size={14} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 6 ? (
            <button
              onClick={() => {
                if (step === 1 && decoded) setStep(2);
                else if (step === 2) handleCostNext();
                else if (step === 3) handleConditionNext();
                else if (step === 4) handlePhotosNext();
                else if (step === 5) handleAiNext();
              }}
              disabled={step === 1 && !decoded}
              className="flex items-center gap-2 bg-tj-gold text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-tj-gold/90 transition-all disabled:opacity-30"
            >
              Next
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 bg-green-500 text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-green-400 transition-all disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {creating ? 'Creating...' : 'Create Vehicle'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VehicleIntakeWizard;
