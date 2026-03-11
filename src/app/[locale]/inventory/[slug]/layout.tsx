import type { Metadata } from "next";
import { getMockVehicleBySlug } from "@/lib/mock-vehicles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let vehicle;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const { getVehicleBySlug } = await import(
      "@/lib/supabase/queries/vehicles"
    );
    const supabase = await createClient();
    vehicle = await getVehicleBySlug(supabase, slug);
  } else {
    vehicle = getMockVehicleBySlug(slug);
  }

  if (!vehicle) {
    return { title: "Vehicle Not Found | Triple J Auto Investment" };
  }

  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(vehicle.price);

  return {
    title: `${name} | Triple J Auto Investment`,
    description: `${name} for ${price}. ${vehicle.mileage.toLocaleString()} miles. ${vehicle.description ?? "Quality pre-owned vehicle in Houston, TX."}`,
  };
}

export default function VehicleDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
