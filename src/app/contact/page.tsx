import ContactForm from "@/components/leads/ContactForm";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const { vehicle } = await searchParams;
  const hasVehicle = !!vehicle;
  const source = hasVehicle ? "vehicle_inquiry" : "contact_form";

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* LEFT: Form */}
          <div className="lg:col-span-7">
            <h1 className="font-serif text-2xl md:text-3xl text-tj-cream font-light mb-2">
              Get In Touch
            </h1>
            <p className="text-sm text-white/40 leading-relaxed mb-8">
              {hasVehicle
                ? `Interested in the ${vehicle}? Fill out the form below and we'll get back to you within 24 hours.`
                : "Have a question or ready to visit? We're here to help. Fill out the form below or give us a call."}
            </p>

            <ContactForm
              source={source}
              vehicleName={vehicle}
              showVehicleField={hasVehicle}
            />
          </div>

          {/* RIGHT: Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* Contact details card */}
            <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] p-6 space-y-5">
              <h2 className="font-accent text-[10px] uppercase tracking-[0.25em] text-white/30 mb-4">
                Contact Information
              </h2>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-tj-gold/50 mt-0.5 flex-none"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <div>
                  <p className="font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1">
                    Phone
                  </p>
                  <a
                    href="tel:+18324009760"
                    className="font-serif text-sm text-tj-gold hover:text-tj-gold-light transition-colors"
                  >
                    (832) 400-9760
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-tj-gold/50 mt-0.5 flex-none"
                  aria-hidden="true"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <p className="font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1">
                    Address
                  </p>
                  <address className="not-italic text-sm text-tj-cream/70 leading-relaxed">
                    8774 Almeda Genoa Rd
                    <br />
                    Houston, TX 77075
                  </address>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-tj-gold/50 mt-0.5 flex-none"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <p className="font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1">
                    Hours
                  </p>
                  <p className="text-sm text-tj-cream/70">Mon–Sat 9AM–7PM</p>
                  <p className="text-sm text-white/30">Sun Closed</p>
                </div>
              </div>
            </div>

            {/* Direct call CTA */}
            <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] p-6 text-center">
              <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-white/30 mb-3">
                Prefer to call?
              </p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
