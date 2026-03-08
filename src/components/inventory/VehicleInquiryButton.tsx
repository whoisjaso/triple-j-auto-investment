import Link from "next/link";

export default function VehicleInquiryButton({
  vehicleName,
}: {
  vehicleName: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Primary CTA: Call Now */}
      <a
        href="tel:+18324009760"
        className="flex items-center justify-center gap-2.5 w-full min-h-[52px] bg-tj-gold/90 hover:bg-tj-gold text-black font-accent text-[11px] uppercase tracking-[0.2em] rounded-sm transition-colors duration-300"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        Call Now — (832) 400-9760
      </a>

      {/* Secondary CTA: Inquire */}
      <Link
        href={`/contact?vehicle=${encodeURIComponent(vehicleName)}`}
        className="flex items-center justify-center gap-2.5 w-full min-h-[48px] border border-tj-gold/30 hover:border-tj-gold/50 hover:bg-tj-gold/5 text-tj-gold/80 hover:text-tj-gold font-accent text-[10px] uppercase tracking-[0.2em] rounded-sm transition-all duration-300"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        Inquire About This Vehicle
      </Link>
    </div>
  );
}
