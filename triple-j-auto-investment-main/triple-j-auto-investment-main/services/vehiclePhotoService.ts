import { supabase } from '../supabase/config';
import { compressImageForUpload } from '../utils/imageCompression';

const BUCKET = 'vehicle-photos';

export interface UploadProgress {
  index: number;
  total: number;
  status: 'compressing' | 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
}

/**
 * Upload a single photo for a vehicle.
 * Compresses client-side, uploads to Supabase Storage, returns public URL.
 */
export async function uploadVehiclePhoto(
  vehicleId: string,
  file: File,
  index: number
): Promise<string> {
  const blob = await compressImageForUpload(file);
  const timestamp = Date.now();
  const filePath = `${vehicleId}/${timestamp}-${index}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Upload multiple photos with progress callback.
 * Returns array of public URLs in upload order.
 */
export async function uploadVehiclePhotos(
  vehicleId: string,
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.({ index: i, total: files.length, status: 'compressing' });
      const url = await uploadVehiclePhoto(vehicleId, files[i], i);
      urls.push(url);
      onProgress?.({ index: i, total: files.length, status: 'done', url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      onProgress?.({ index: i, total: files.length, status: 'error', error: msg });
      // Continue uploading remaining photos — don't abort batch on single failure
    }
  }

  return urls;
}

/**
 * Delete a photo from Supabase Storage.
 * Extracts the storage path from the public URL.
 */
export async function deleteVehiclePhoto(publicUrl: string): Promise<void> {
  // Public URL format: https://<project>.supabase.co/storage/v1/object/public/vehicle-photos/<path>
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return; // Not a storage URL (legacy base64) — skip silently

  const filePath = publicUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) console.error('Failed to delete photo:', error.message);
}

/**
 * Check if a URL is a Supabase Storage URL (vs legacy base64 data URI).
 */
export function isStorageUrl(url: string): boolean {
  return url.startsWith('http') && url.includes(BUCKET);
}
