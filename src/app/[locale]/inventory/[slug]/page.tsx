import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getMockVehicleBySlug } from "@/lib/mock-vehicles";
import VehicleGallery from "@/components/inventory/VehicleGallery";
import VehicleSpecs from "@/components/inventory/VehicleSpecs";
import PaymentCalculator from "@/components/inventory/PaymentCalculator";
import VehicleInquiryButton from "@/components/inventory/VehicleInquiryButton";
import { Link } from "@/i18n/navigation";

async function getVehicle(slug: string) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const { getVehicleBySlug } = await import(
        "@/lib/supabase/queries/vehicles"
      );
      const supabase = await createClient();
      return getVehicleBySlug(supabase, slug);
    } catch (err) {
      console.error("Supabase query failed, using mock data:", err);
      return getMockVehicleBySlug(slug);
    }
  }
  return getMockVehicleBySlug(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const vehicle = await getVehicle(slug);

  if (!vehicle) {
    return { title: "Vehicle Not Found" };
  }

  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const description =
    vehicle.description ||
    `${vehicleName} — $${vehicle.price.toLocaleString()} at Triple J Auto Investment, Houston TX.`;

  return {
    title: vehicleName,
    description,
    openGraph: {
      locale: locale === "es" ? "es_US" : "en_US",
      title: `${vehicleName} | Triple J Auto Investment`,
      description,
    },
  };
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const t = await getTranslations("inventory");
  const { slug } = await params;

  const vehicle = await getVehicle(slug);

  if (!vehicle) notFound();

  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  const vehicleJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: vehicleName,
    brand: { "@type": "Brand", name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: vehicle.mileage,
      unitCode: "SMI",
    },
    vehicleIdentificationNumber: vehicle.vin,
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "AutoDealer",
        name: "Triple J Auto Investment",
      },
    },
  };
  if (vehicle.exteriorColor) vehicleJsonLd.color = vehicle.exteriorColor;
  if (vehicle.transmission) vehicleJsonLd.vehicleTransmission = vehicle.transmission;
  if (vehicle.drivetrain) vehicleJsonLd.driveWheelConfiguration = vehicle.drivetrain;
  if (vehicle.fuelType) vehicleJsonLd.fuelType = vehicle.fuelType;
  if (vehicle.bodyStyle) vehicleJsonLd.bodyType = vehicle.bodyStyle;
  if (vehicle.engine) vehicleJsonLd.vehicleEngine = { "@type": "EngineSpecification", name: vehicle.engine };

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16 md:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 font-accent text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-white/60 transition-colors mb-6 md:mb-8"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          {t("backToInventory")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-7">
            <VehicleGallery vehicle={vehicle} />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl text-tj-cream font-light">
                {vehicleName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="font-serif text-2xl text-tj-gold">
                  {formatPrice(vehicle.price)}
                </span>
                <span className="font-accent text-[9px] uppercase tracking-[0.2em] text-emerald-400/70 border border-emerald-400/20 px-2 py-0.5 rounded-sm">
                  {vehicle.status}
                </span>
              </div>
            </div>

            {vehicle.description && (
              <p className="text-sm text-white/50 leading-relaxed">
                {vehicle.description}
              </p>
            )}

            <VehicleSpecs vehicle={vehicle} />
            <PaymentCalculator price={vehicle.price} />
            <VehicleInquiryButton vehicleName={vehicleName} />
          </div>
        </div>
      </div>
    </div>
  );
}
