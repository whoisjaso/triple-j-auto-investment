import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Vehicle } from "@/types/database";

export default function VehicleGallery({ vehicle }: { vehicle: Vehicle }) {
  const t = useTranslations("inventory");
  const hasImages = vehicle.imageUrl || vehicle.gallery.length > 0;

  if (!hasImages) {
    return (
      <div className="relative aspect-[4/3] md:aspect-[16/10] rounded-sm border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent overflow-hidden">
        {vehicle.bodyStyle && (
          <span className="absolute top-3 left-3 z-10 font-accent text-[9px] uppercase tracking-[0.25em] text-white/40 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-sm">
            {vehicle.bodyStyle}
          </span>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            className="text-white/[0.08]"
            aria-hidden="true"
          >
            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2" />
            <path d="M9 17h6" />
          </svg>
          <span className="font-accent text-[10px] uppercase tracking-[0.3em] text-white/[0.1]">
            {t("photosComingSoon")}
          </span>
        </div>
      </div>
    );
  }

  const mainImage = vehicle.imageUrl || vehicle.gallery[0];
  const thumbnails = vehicle.gallery.length > 1 ? vehicle.gallery : [];

  return (
    <div className="space-y-2">
      {/* Main image */}
      <div className="relative aspect-[4/3] md:aspect-[16/10] rounded-sm border border-white/[0.06] overflow-hidden">
        {vehicle.bodyStyle && (
          <span className="absolute top-3 left-3 z-10 font-accent text-[9px] uppercase tracking-[0.25em] text-white/40 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-sm">
            {vehicle.bodyStyle}
          </span>
        )}
        <Image
          src={mainImage!}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 58vw"
          priority
        />
      </div>

      {/* Thumbnail strip */}
      {thumbnails.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {thumbnails.map((src, i) => (
            <div
              key={i}
              className="relative flex-none w-20 h-16 rounded-sm border border-white/[0.06] overflow-hidden"
            >
              <Image
                src={src}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} — photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
