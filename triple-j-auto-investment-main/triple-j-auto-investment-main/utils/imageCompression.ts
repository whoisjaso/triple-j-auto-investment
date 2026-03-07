/**
 * Image Compression Utility
 * Phase 20: Manheim Vehicle Intake Pipeline
 *
 * Compress an image file for upload to Supabase Storage.
 * Returns a JPEG Blob optimized for web display.
 *
 * - Max dimension: 1200px (wider than the 800px admin thumbnail — these are listing photos)
 * - JPEG quality: 0.8 (higher than admin's 0.5 — listing photos need to look good)
 * - Maintains aspect ratio
 */

// ================================================================
// FULL-SIZE COMPRESSION
// ================================================================

/**
 * Compress an image file for upload to Supabase Storage.
 * Returns a JPEG Blob optimized for web display.
 *
 * - Max dimension: 1200px (wider than the 800px admin thumbnail — these are listing photos)
 * - JPEG quality: 0.8 (higher than admin's 0.5 — listing photos need to look good)
 * - Maintains aspect ratio
 *
 * @param file - The image File to compress
 * @param maxDimension - Maximum width or height in pixels (default: 1200)
 * @param quality - JPEG quality from 0 to 1 (default: 0.8)
 * @returns A Promise resolving to a compressed JPEG Blob
 */
export function compressImageForUpload(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Compression produced empty blob'));
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ================================================================
// THUMBNAIL COMPRESSION
// ================================================================

/**
 * Generate a thumbnail Blob for fast grid rendering.
 * 400px max dimension, lower quality.
 *
 * @param file - The image File to compress
 * @returns A Promise resolving to a compressed JPEG thumbnail Blob
 */
export function compressImageForThumbnail(file: File): Promise<Blob> {
  return compressImageForUpload(file, 400, 0.6);
}
