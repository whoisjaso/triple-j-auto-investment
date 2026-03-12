"use client";

import { useState, useRef, useCallback } from "react";
import { compressImage } from "@/lib/image-utils";

interface PhotoItem {
  id: string;
  url: string;
  preview?: string;
  uploading: boolean;
  error?: boolean;
}

interface PhotoCaptureProps {
  initialPhotos?: string[];
  coverPhoto?: string | null;
}

export default function PhotoCapture({
  initialPhotos = [],
  coverPhoto,
}: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(
    initialPhotos
      .filter(Boolean)
      .map((url, i) => ({ id: `p-${i}`, url, uploading: false }))
  );
  const [cover, setCover] = useState(coverPhoto || initialPhotos[0] || "");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("photo", compressed, "photo.webp");

      const res = await fetch("/api/vehicles/photos", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) return null;
      const { url } = await res.json();
      return url;
    } catch {
      return null;
    }
  }, []);

  const handleFiles = useCallback(
    async (files: FileList) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (!imageFiles.length) return;

      // Create preview items immediately
      const items: (PhotoItem & { _file: File })[] = imageFiles.map((file) => ({
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url: "",
        preview: URL.createObjectURL(file),
        uploading: true,
        _file: file,
      }));

      setPhotos((prev) => [
        ...prev,
        ...items.map(({ _file: _, ...rest }) => rest),
      ]);

      // Upload each file
      for (const item of items) {
        const url = await uploadFile(item._file);

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, url: url || "", uploading: false, error: !url }
              : p
          )
        );

        // Auto-set first photo as cover
        if (url) {
          setCover((prev) => prev || url);
        }

        if (item.preview) URL.revokeObjectURL(item.preview);
      }
    },
    [uploadFile]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const photo = photos.find((p) => p.id === id);
      if (!photo) return;

      setPhotos((prev) => prev.filter((p) => p.id !== id));
      setSelectedId(null);

      // Update cover if we deleted the cover photo
      if (photo.url === cover) {
        const remaining = photos.filter((p) => p.id !== id && p.url);
        setCover(remaining[0]?.url || "");
      }

      // Delete from storage (fire and forget)
      if (photo.url && photo.url.includes("vehicle-photos")) {
        fetch("/api/vehicles/photos", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: photo.url }),
        }).catch(() => {});
      }
    },
    [photos, cover]
  );

  const handleSetCover = useCallback(
    (id: string) => {
      const photo = photos.find((p) => p.id === id);
      if (photo?.url) {
        setCover(photo.url);
        setSelectedId(null);
      }
    },
    [photos]
  );

  const resetInput = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) ref.current.value = "";
  };

  // Compute gallery URLs for form submission
  const galleryUrls = photos
    .filter((p) => p.url && !p.error)
    .map((p) => p.url);

  const uploadingCount = photos.filter((p) => p.uploading).length;

  return (
    <div>
      {/* Hidden form fields — these get submitted with the form */}
      <input type="hidden" name="imageUrl" value={cover} />
      <input type="hidden" name="gallery" value={galleryUrls.join("\n")} />

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          resetInput(cameraRef);
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          resetInput(galleryRef);
        }}
      />

      {photos.length === 0 ? (
        /* ───── Empty State ───── */
        <div className="border border-dashed border-white/[0.08] rounded-2xl p-8 sm:p-12 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/20"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white/40 text-sm font-medium">
              Add vehicle photos
            </p>
            <p className="text-white/15 text-xs mt-1">
              Take a photo or choose from your library
            </p>
          </div>
          <div className="flex gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-tj-gold/10 hover:bg-tj-gold/20 border border-tj-gold/20 hover:border-tj-gold/40 rounded-xl text-tj-gold text-xs font-accent uppercase tracking-wider transition-all duration-300 min-h-[48px] active:scale-95"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Camera
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-white/50 hover:text-white/70 text-xs font-accent uppercase tracking-wider transition-all duration-300 min-h-[48px] active:scale-95"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Library
            </button>
          </div>
        </div>
      ) : (
        /* ───── Photos Grid ───── */
        <div>
          {/* Upload progress bar */}
          {uploadingCount > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <div className="flex-1 h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-tj-gold/70 rounded-full animate-pulse w-2/3" />
              </div>
              <span className="text-[10px] text-white/30 font-accent uppercase tracking-wider">
                Uploading {uploadingCount}
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group animate-in fade-in zoom-in-95 duration-300 ${
                  selectedId === photo.id
                    ? "ring-2 ring-tj-gold ring-offset-1 ring-offset-black"
                    : ""
                }`}
                onClick={() =>
                  setSelectedId(selectedId === photo.id ? null : photo.id)
                }
              >
                {/* Photo thumbnail */}
                <img
                  src={photo.preview || photo.url}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                {/* Upload spinner overlay */}
                {photo.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-tj-gold rounded-full animate-spin" />
                  </div>
                )}

                {/* Error overlay */}
                {photo.error && (
                  <div className="absolute inset-0 bg-red-950/60 flex flex-col items-center justify-center gap-1">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-red-400"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span className="text-red-400 text-[8px] font-accent uppercase">
                      Failed
                    </span>
                  </div>
                )}

                {/* Cover badge */}
                {photo.url === cover && !photo.uploading && !photo.error && (
                  <div className="absolute top-1.5 left-1.5 bg-tj-gold text-black text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
                    Cover
                  </div>
                )}

                {/* Selected overlay with actions */}
                {selectedId === photo.id && !photo.uploading && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center gap-5">
                    {photo.url !== cover && photo.url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetCover(photo.id);
                        }}
                        className="flex flex-col items-center gap-1.5 text-white/80 hover:text-tj-gold transition-colors active:scale-90"
                      >
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="text-[8px] font-accent uppercase tracking-wider">
                          Cover
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo.id);
                      }}
                      className="flex flex-col items-center gap-1.5 text-white/80 hover:text-red-400 transition-colors active:scale-90"
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span className="text-[8px] font-accent uppercase tracking-wider">
                        Delete
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add More cell */}
            <div
              className="aspect-square rounded-lg border border-dashed border-white/[0.08] flex items-center justify-center cursor-pointer hover:border-white/[0.18] hover:bg-white/[0.02] transition-all duration-300 active:scale-95"
              onClick={() => galleryRef.current?.click()}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-white/20"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-tj-gold/10 hover:bg-tj-gold/20 border border-tj-gold/20 hover:border-tj-gold/40 rounded-xl text-tj-gold text-[10px] font-accent uppercase tracking-wider transition-all duration-300 min-h-[44px] active:scale-95"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Take Photo
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-white/40 hover:text-white/60 text-[10px] font-accent uppercase tracking-wider transition-all duration-300 min-h-[44px] active:scale-95"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Library
            </button>
          </div>

          {/* Photo count */}
          <p className="text-[10px] text-white/20 font-accent uppercase tracking-wider mt-2">
            {galleryUrls.length} photo{galleryUrls.length !== 1 ? "s" : ""}
            {cover && " · Cover set"}
          </p>
        </div>
      )}
    </div>
  );
}
