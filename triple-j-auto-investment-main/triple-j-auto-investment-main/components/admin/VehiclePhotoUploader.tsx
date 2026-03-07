import { useState, useRef, useCallback } from 'react';
import { Camera, ImagePlus, X, Star, GripVertical, Loader2 } from 'lucide-react';
import { uploadVehiclePhotos, deleteVehiclePhoto, isStorageUrl, type UploadProgress } from '../../services/vehiclePhotoService';

interface Props {
  vehicleId: string;
  photos: string[];                          // Array of URLs (storage or legacy base64)
  onChange: (photos: string[]) => void;       // Called when photos array changes
  maxPhotos?: number;
}

export default function VehiclePhotoUploader({ vehicleId, photos, onChange, maxPhotos = 15 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const remaining = maxPhotos - photos.length;

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, remaining);
    if (fileArray.length === 0) return;

    setUploading(true);
    setProgress(null);

    const urls = await uploadVehiclePhotos(
      vehicleId,
      fileArray,
      (p) => setProgress(p)
    );

    if (urls.length > 0) {
      onChange([...photos, ...urls]);
    }

    setUploading(false);
    setProgress(null);
  }, [vehicleId, photos, onChange, remaining]);

  const handleRemove = async (index: number) => {
    const url = photos[index];
    if (isStorageUrl(url)) {
      await deleteVehiclePhoto(url);
    }
    const next = photos.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleMakeHero = (index: number) => {
    if (index === 0) return;
    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    onChange(next);
  };

  // Drag-to-reorder handlers
  const handleDragStart = (index: number) => {
    setDragSourceIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (targetIndex: number) => {
    if (dragSourceIndex === null || dragSourceIndex === targetIndex) {
      setDragOverIndex(null);
      setDragSourceIndex(null);
      return;
    }
    const next = [...photos];
    const [moved] = next.splice(dragSourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDragOverIndex(null);
    setDragSourceIndex(null);
  };

  const handleDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {remaining > 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={handleDropZone}
          className="border border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-tj-gold/50 transition-colors"
        >
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 text-tj-gold animate-spin mx-auto" />
              {progress && (
                <p className="text-xs text-gray-400">
                  {progress.status === 'compressing' ? 'Compressing' : 'Uploading'} photo {progress.index + 1} of {progress.total}...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center gap-3">
                {/* Camera button — primary on mobile */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-3 bg-tj-gold text-black text-xs font-bold uppercase tracking-widest rounded-lg active:scale-95 transition-transform min-h-[48px]"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </button>

                {/* Gallery picker */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-3 border border-gray-600 text-gray-300 text-xs uppercase tracking-widest rounded-lg hover:border-gray-400 active:scale-95 transition-all min-h-[48px]"
                >
                  <ImagePlus className="w-5 h-5" />
                  Library
                </button>
              </div>
              <p className="text-[10px] text-gray-500">
                {remaining} photo{remaining !== 1 ? 's' : ''} remaining · Drop files here on desktop
              </p>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragOverIndex(null); setDragSourceIndex(null); }}
              className={`relative aspect-square rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing border-2 transition-colors ${
                dragOverIndex === idx
                  ? 'border-tj-gold'
                  : idx === 0
                  ? 'border-tj-gold/50'
                  : 'border-transparent'
              }`}
            >
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Hero badge */}
              {idx === 0 && (
                <div className="absolute top-1 left-1 bg-tj-gold text-black px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5" fill="currentColor" />
                  Cover
                </div>
              )}

              {/* Drag handle */}
              <div className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
              </div>

              {/* Action overlay on hover/touch */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleMakeHero(idx)}
                    className="p-2 bg-tj-gold rounded-full text-black"
                    title="Set as cover photo"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-2 bg-red-600 rounded-full text-white"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more button in grid */}
          {remaining > 0 && !uploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:text-gray-300 hover:border-gray-400 transition-colors"
            >
              <ImagePlus className="w-6 h-6" />
              <span className="text-[9px] mt-1">Add</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
