import VinDecoder from "@/components/inventory/VinDecoder";

export default function VinDecoderPage() {
  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="mx-auto max-w-2xl px-4 md:px-8">
        {/* Page header */}
        <div className="mb-10 md:mb-14 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-tj-gold/20 mb-6">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-tj-gold/60"
            >
              <rect x="2" y="6" width="20" height="12" rx="1" />
              <path d="M6 10h2M10 10h4M16 10h2M6 14h12" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-tj-cream font-light">
            VIN Decoder
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/40 max-w-md mx-auto leading-relaxed">
            Enter any 17-character Vehicle Identification Number to instantly
            look up factory specifications from the NHTSA database.
          </p>
        </div>

        {/* Decoder */}
        <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] p-5 md:p-8">
          <VinDecoder alwaysOpen />
        </div>

        {/* Info section */}
        <div className="mt-10 md:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-tj-gold/40 mb-1.5">
              Free & Instant
            </p>
            <p className="text-xs text-white/30 leading-relaxed">
              No registration required. Results powered by the official NHTSA
              vehicle database.
            </p>
          </div>
          <div>
            <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-tj-gold/40 mb-1.5">
              Factory Specs
            </p>
            <p className="text-xs text-white/30 leading-relaxed">
              Decode engine, transmission, drivetrain, body style, and
              manufacturing origin.
            </p>
          </div>
          <div>
            <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-tj-gold/40 mb-1.5">
              Where to Find
            </p>
            <p className="text-xs text-white/30 leading-relaxed">
              Your VIN is on the driver-side dashboard, door jamb sticker, or
              vehicle title.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
