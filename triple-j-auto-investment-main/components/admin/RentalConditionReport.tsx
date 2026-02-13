import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Camera,
  Upload,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  Fuel,
  Gauge,
  Car,
  Armchair,
  Wrench,
  Image as ImageIcon,
  ClipboardCheck,
} from 'lucide-react';
import {
  ConditionChecklistItem,
  ConditionRating,
  FuelLevel,
  RentalConditionReport as RentalConditionReportType,
  CONDITION_CHECKLIST_TEMPLATE,
} from '../../types';
import { createConditionReport } from '../../services/rentalService';
import { supabase } from '../../supabase/config';

// ================================================================
// TYPES
// ================================================================

interface RentalConditionReportProps {
  bookingId: string;
  reportType: 'checkout' | 'return';
  vehicleName: string;
  onComplete: () => void;
  existingReport?: RentalConditionReportType;
}

type CategoryKey = 'Exterior' | 'Interior' | 'Mechanical';

const CATEGORY_ICONS: Record<CategoryKey, React.ReactNode> = {
  Exterior: <Car size={14} />,
  Interior: <Armchair size={14} />,
  Mechanical: <Wrench size={14} />,
};

const FUEL_LEVELS: { value: FuelLevel; label: string }[] = [
  { value: 'empty', label: 'E' },
  { value: '1/4', label: '1/4' },
  { value: '1/2', label: '1/2' },
  { value: '3/4', label: '3/4' },
  { value: 'full', label: 'F' },
];

const CONDITION_COLORS: Record<ConditionRating, { bg: string; border: string; text: string; activeBg: string }> = {
  good: { bg: 'bg-green-900/20', border: 'border-green-700/50', text: 'text-green-400', activeBg: 'bg-green-600' },
  fair: { bg: 'bg-amber-900/20', border: 'border-amber-700/50', text: 'text-amber-400', activeBg: 'bg-amber-600' },
  damaged: { bg: 'bg-red-900/20', border: 'border-red-700/50', text: 'text-red-400', activeBg: 'bg-red-600' },
};

// ================================================================
// RESIZE HELPER (matches Inventory.tsx pattern)
// ================================================================

/**
 * Resize and compress an image file to JPEG format.
 * Returns a Blob suitable for uploading to Supabase Storage.
 */
const resizeImageToBlob = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            'image/jpeg',
            0.5
          );
        } else {
          reject(new Error('Canvas context unavailable'));
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// ================================================================
// COMPONENT
// ================================================================

export const RentalConditionReport: React.FC<RentalConditionReportProps> = ({
  bookingId,
  reportType,
  vehicleName,
  onComplete,
  existingReport,
}) => {
  const isViewMode = !!existingReport;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Checklist state ----
  const [checklistItems, setChecklistItems] = useState<ConditionChecklistItem[]>(() => {
    if (existingReport?.checklistItems?.length) {
      return existingReport.checklistItems;
    }
    return CONDITION_CHECKLIST_TEMPLATE.map(item => ({ ...item }));
  });

  // ---- Odometer & fuel ----
  const [mileage, setMileage] = useState<string>(
    existingReport?.mileage?.toString() || ''
  );
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>(
    existingReport?.fuelLevel || '1/2'
  );

  // ---- Photos ----
  const [photoUrls, setPhotoUrls] = useState<string[]>(existingReport?.photoUrls || []);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);

  // ---- Collapsed sections ----
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // ---- Submit state ----
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ================================================================
  // DERIVED VALUES
  // ================================================================

  const categories = useMemo(() => {
    const cats = new Map<CategoryKey, ConditionChecklistItem[]>();
    checklistItems.forEach((item) => {
      const key = item.category as CategoryKey;
      if (!cats.has(key)) cats.set(key, []);
      cats.get(key)!.push(item);
    });
    return cats;
  }, [checklistItems]);

  const conditionCounts = useMemo(() => {
    let good = 0, fair = 0, damaged = 0;
    checklistItems.forEach(item => {
      if (item.condition === 'good') good++;
      else if (item.condition === 'fair') fair++;
      else if (item.condition === 'damaged') damaged++;
    });
    return { good, fair, damaged, total: checklistItems.length };
  }, [checklistItems]);

  // ================================================================
  // HANDLERS
  // ================================================================

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const updateItemCondition = useCallback((category: string, itemName: string, condition: ConditionRating) => {
    setChecklistItems(prev =>
      prev.map(item =>
        item.category === category && item.item === itemName
          ? { ...item, condition }
          : item
      )
    );
  }, []);

  const updateItemNotes = useCallback((category: string, itemName: string, notes: string) => {
    setChecklistItems(prev =>
      prev.map(item =>
        item.category === category && item.item === itemName
          ? { ...item, notes }
          : item
      )
    );
  }, []);

  // ---- Photo upload ----
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPhotoError(null);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setPhotoError('Only JPEG and PNG images are accepted');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setPhotoError('Images must be under 2MB each');
        return;
      }
      validFiles.push(file);
    }

    setUploadingPhotos(true);
    const newProgress: Record<string, boolean> = {};
    validFiles.forEach((_, i) => { newProgress[`file-${i}`] = false; });
    setUploadProgress(newProgress);

    try {
      const uploadPromises = validFiles.map(async (file, index) => {
        // Resize before upload
        const blob = await resizeImageToBlob(file);
        const timestamp = Date.now();
        const fileName = `${timestamp}-${index}.jpg`;
        const filePath = `condition-reports/${bookingId}/${reportType}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('rental-photos')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (error) {
          // Check if storage bucket doesn't exist
          if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
            setStorageAvailable(false);
            throw new Error('STORAGE_NOT_CONFIGURED');
          }
          throw error;
        }

        setUploadProgress(prev => ({ ...prev, [`file-${index}`]: true }));

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('rental-photos')
          .getPublicUrl(data.path);

        return urlData.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setPhotoUrls(prev => [...prev, ...urls]);
    } catch (err: any) {
      if (err?.message === 'STORAGE_NOT_CONFIGURED') {
        setStorageAvailable(false);
        setPhotoError('Photo upload not available - configure Supabase Storage bucket "rental-photos"');
      } else {
        setPhotoError(`Upload failed: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      setUploadingPhotos(false);
      setUploadProgress({});
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!mileage) {
      setSubmitError('Mileage is required');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const result = await createConditionReport({
        bookingId,
        reportType,
        checklistItems,
        fuelLevel,
        mileage: parseInt(mileage, 10),
        photoUrls,
      });

      if (!result) {
        setSubmitError('Failed to save condition report. Please try again.');
        setIsSubmitting(false);
        return;
      }

      onComplete();
    } catch (err: any) {
      setSubmitError(`Error: ${err?.message || 'Something went wrong'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================================================================
  // RENDER
  // ================================================================

  const renderConditionButton = (
    category: string,
    itemName: string,
    currentCondition: ConditionRating,
    rating: ConditionRating,
    label: string
  ) => {
    const isActive = currentCondition === rating;
    const colors = CONDITION_COLORS[rating];

    return (
      <button
        key={rating}
        type="button"
        onClick={() => !isViewMode && updateItemCondition(category, itemName, rating)}
        disabled={isViewMode}
        className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium border transition-all ${
          isActive
            ? `${colors.activeBg} border-transparent text-white`
            : `bg-transparent ${colors.border} ${colors.text} ${!isViewMode ? 'hover:bg-white/5' : ''} opacity-40`
        } ${isViewMode ? 'cursor-default' : 'cursor-pointer'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <ClipboardCheck className="text-tj-gold" size={16} />
            {reportType === 'checkout' ? 'Checkout' : 'Return'} Condition Report
          </h3>
          <p className="text-[10px] text-gray-500 mt-0.5">{vehicleName}</p>
        </div>
        {isViewMode && (
          <span className="text-[10px] uppercase tracking-widest text-green-400 bg-green-900/20 border border-green-700/30 px-3 py-1">
            Completed
          </span>
        )}
      </div>

      {/* Section 1: Odometer & Fuel */}
      <div className="bg-black/30 border border-white/5 p-4 space-y-3">
        <h4 className="text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
          <Gauge size={12} /> Odometer & Fuel
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mileage */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
              Mileage <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={mileage}
              onChange={(e) => !isViewMode && setMileage(e.target.value)}
              disabled={isViewMode}
              placeholder="Current odometer reading"
              className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600 font-mono disabled:opacity-60 disabled:cursor-default"
            />
          </div>

          {/* Fuel level */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 flex items-center gap-1">
              <Fuel size={10} /> Fuel Level
            </label>
            <div className="flex gap-1">
              {FUEL_LEVELS.map((fl) => (
                <button
                  key={fl.value}
                  type="button"
                  onClick={() => !isViewMode && setFuelLevel(fl.value)}
                  disabled={isViewMode}
                  className={`flex-1 py-3 text-xs font-medium border transition-all text-center ${
                    fuelLevel === fl.value
                      ? 'bg-tj-gold text-black border-tj-gold font-bold'
                      : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'
                  } ${isViewMode ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {fl.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sections 2-4: Checklist categories */}
      {Array.from(categories.entries()).map(([category, items]) => {
        const isCollapsed = collapsedCategories.has(category);
        const catCounts = items.reduce(
          (acc, item) => {
            acc[item.condition] = (acc[item.condition] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        return (
          <div key={category} className="bg-black/30 border border-white/5 overflow-hidden">
            {/* Category header */}
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                {CATEGORY_ICONS[category as CategoryKey]}
                <h4 className="text-[10px] uppercase tracking-widest text-tj-gold">
                  {category}
                </h4>
                <span className="text-[10px] text-gray-500">({items.length} items)</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Mini condition summary */}
                <div className="flex items-center gap-2 text-[10px]">
                  {catCounts.good ? (
                    <span className="text-green-400">{catCounts.good}G</span>
                  ) : null}
                  {catCounts.fair ? (
                    <span className="text-amber-400">{catCounts.fair}F</span>
                  ) : null}
                  {catCounts.damaged ? (
                    <span className="text-red-400">{catCounts.damaged}D</span>
                  ) : null}
                </div>
                {isCollapsed ? <ChevronRight size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
              </div>
            </button>

            {/* Items */}
            {!isCollapsed && (
              <div className="border-t border-white/5">
                {items.map((item) => (
                  <div
                    key={`${item.category}-${item.item}`}
                    className="px-4 py-3 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-300 flex-grow">{item.item}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        {renderConditionButton(item.category, item.item, item.condition, 'good', 'Good')}
                        {renderConditionButton(item.category, item.item, item.condition, 'fair', 'Fair')}
                        {renderConditionButton(item.category, item.item, item.condition, 'damaged', 'Damaged')}
                      </div>
                    </div>

                    {/* Notes field for fair/damaged items */}
                    {(item.condition === 'fair' || item.condition === 'damaged') && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => !isViewMode && updateItemNotes(item.category, item.item, e.target.value)}
                          disabled={isViewMode}
                          placeholder={`Describe ${item.condition} condition...`}
                          className={`w-full bg-black border px-3 py-2 text-xs text-white focus:border-tj-gold outline-none transition-colors placeholder-gray-600 disabled:opacity-60 disabled:cursor-default ${
                            CONDITION_COLORS[item.condition].border
                          }`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Section 5: Photos */}
      <div className="bg-black/30 border border-white/5 p-4 space-y-3">
        <h4 className="text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
          <Camera size={12} /> Photos
        </h4>

        {!storageAvailable && !isViewMode && (
          <div className="bg-amber-900/20 border border-amber-700/30 px-3 py-2 text-xs text-amber-400 flex items-center gap-2">
            <AlertTriangle size={14} />
            Photo upload not available - configure Supabase Storage bucket "rental-photos"
          </div>
        )}

        {/* Upload area (edit mode only) */}
        {!isViewMode && storageAvailable && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 hover:border-tj-gold/50 p-6 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            {uploadingPhotos ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-tj-gold" size={24} />
                <span className="text-xs text-gray-400">
                  Uploading... ({Object.values(uploadProgress).filter(Boolean).length}/{Object.keys(uploadProgress).length})
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="text-gray-600" size={24} />
                <span className="text-xs text-gray-500">
                  Drag & drop photos or <span className="text-tj-gold">click to browse</span>
                </span>
                <span className="text-[10px] text-gray-600">JPEG/PNG, max 2MB each</span>
              </div>
            )}
          </div>
        )}

        {photoError && (
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertTriangle size={12} />
            {photoError}
          </div>
        )}

        {/* Photo grid */}
        {photoUrls.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {photoUrls.map((url, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={url}
                  alt={`Condition photo ${index + 1}`}
                  className="w-full h-full object-cover border border-white/10"
                />
                {!isViewMode && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isViewMode && photoUrls.length === 0 && (
          <div className="text-center py-4">
            <ImageIcon className="mx-auto text-gray-700 mb-2" size={24} />
            <p className="text-xs text-gray-600">No photos attached</p>
          </div>
        )}
      </div>

      {/* Section 6: Summary & Submit */}
      <div className="bg-black/30 border border-white/5 p-4 space-y-3">
        <h4 className="text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
          <ClipboardCheck size={12} /> Summary
        </h4>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle size={12} /> {conditionCounts.good} Good
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <AlertTriangle size={12} /> {conditionCounts.fair} Fair
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <X size={12} /> {conditionCounts.damaged} Damaged
          </span>
        </div>

        {conditionCounts.damaged > 0 && (
          <div className="bg-amber-900/20 border border-amber-700/30 px-3 py-2 text-xs text-amber-400 flex items-center gap-2">
            <AlertTriangle size={14} />
            {conditionCounts.damaged} damaged item{conditionCounts.damaged !== 1 ? 's' : ''} noted
          </div>
        )}

        {mileage && (
          <div className="text-xs text-gray-400">
            Odometer: <span className="text-white font-mono">{parseInt(mileage).toLocaleString()}</span> mi
            {' | '}Fuel: <span className="text-white">{fuelLevel}</span>
          </div>
        )}

        {photoUrls.length > 0 && (
          <div className="text-xs text-gray-400">
            Photos: <span className="text-white">{photoUrls.length}</span> attached
          </div>
        )}

        {submitError && (
          <div className="bg-red-900/20 border border-red-700/30 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle size={14} />
            {submitError}
          </div>
        )}

        {!isViewMode && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !mileage}
            className="w-full bg-tj-gold text-black font-bold py-3 text-xs uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle size={14} />
                Complete Report
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default RentalConditionReport;
