import ContactForm from "@/components/leads/ContactForm";

const STEPS = [
  {
    number: "01",
    title: "Fill out the form",
    description: "Tell us what you're looking for and your budget.",
  },
  {
    number: "02",
    title: "We'll call you",
    description: "Our team will reach out within 24 hours to discuss options.",
  },
  {
    number: "03",
    title: "Visit the lot",
    description: "Come see the vehicles in person. Test drive your favorites.",
  },
  {
    number: "04",
    title: "Drive home today",
    description: "We handle the paperwork. You drive home in your new car.",
  },
];

const BENEFITS = [
  "No credit check required",
  "Flexible down payments — as low as $500",
  "Weekly or bi-weekly payment options",
  "In-house financing — we work with you",
  "Vehicles from $3,000 to $8,000",
  "Clean titles, inspected vehicles",
];

export default function FinancingPage() {
  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* LEFT: Form */}
          <div className="lg:col-span-7">
            <h1 className="font-serif text-2xl md:text-3xl text-tj-cream font-light mb-2">
              Flexible Financing
            </h1>
            <p className="text-sm text-white/40 leading-relaxed mb-8">
              We believe everyone deserves reliable transportation. Our Buy Here
              Pay Here program makes car ownership accessible — no credit check,
              flexible payments, and a team that works with you.
            </p>

            <ContactForm
              source="financing_inquiry"
              showVehicleField
              showDownPayment
            />
          </div>

          {/* RIGHT: Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* How It Works */}
            <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] p-6">
              <h2 className="font-accent text-[10px] uppercase tracking-[0.25em] text-white/30 mb-5">
                How It Works
              </h2>
              <div className="space-y-5">
                {STEPS.map((step) => (
                  <div key={step.number} className="flex gap-4">
                    <span className="font-serif text-lg text-tj-gold/40 flex-none w-6">
                      {step.number}
                    </span>
                    <div>
                      <p className="text-sm text-tj-cream/80 font-medium">
                        {step.title}
                      </p>
                      <p className="text-[12px] text-white/30 mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BHPH Benefits */}
            <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] p-6">
              <h2 className="font-accent text-[10px] uppercase tracking-[0.25em] text-white/30 mb-4">
                Why Buy Here Pay Here
              </h2>
              <ul className="space-y-3">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-tj-gold/50 mt-0.5 flex-none"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-sm text-tj-cream/70">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct call CTA */}
            <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] p-6 text-center">
              <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-white/30 mb-3">
                Ready to get started?
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
