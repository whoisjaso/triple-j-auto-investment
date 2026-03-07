import Link from "next/link";
import Image from "next/image";
import type { Vehicle } from "@/types/database";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);

const formatMileage = (mileage: number) =>
  new Intl.NumberFormat("en-US").format(mileage);

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      href={`/inventory/${vehicle.slug}`}
      className="group block rounded-sm border border-white/[0.06] bg-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:border-tj-gold/20 hover:shadow-[0_8px_30px_rgba(212,175,55,0.05)] overflow-hidden"
    >
      {/* Image area — 4:3 aspect ratio */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-white/[0.04] to-transparent overflow-hidden">
        {vehicle.imageUrl ? (
          <Image
            src={vehicle.imageUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-white/[0.08]"
            >
              <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
              <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
              <path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2" />
              <path d="M9 17h6" />
            </svg>
            <span className="font-accent text-[9px] uppercase tracking-[0.3em] text-white/[0.1]">
              Photo Coming Soon
            </span>
          </div>
        )}
        {/* Body style badge */}
        {vehicle.bodyStyle && (
          <span className="absolute top-3 left-3 font-accent text-[9px] uppercase tracking-[0.25em] text-white/40 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-sm">
            {vehicle.bodyStyle}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 md:p-5">
        <h3 className="font-serif text-base md:text-lg text-tj-cream leading-tight">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>

        <p className="mt-2 font-serif text-lg md:text-xl text-tj-gold">
          {formatPrice(vehicle.price)}
        </p>

        <div className="mt-3 flex items-center gap-3 text-white/30">
          <span className="font-accent text-[10px] uppercase tracking-[0.15em]">
            {formatMileage(vehicle.mileage)} mi
          </span>
          {vehicle.transmission && (
            <>
              <span className="w-px h-2.5 bg-white/10" />
              <span className="font-accent text-[10px] uppercase tracking-[0.15em]">
                {vehicle.transmission}
              </span>
            </>
          )}
          {vehicle.drivetrain && (
            <>
              <span className="w-px h-2.5 bg-white/10" />
              <span className="font-accent text-[10px] uppercase tracking-[0.15em]">
                {vehicle.drivetrain}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
