import type { MetadataRoute } from "next";
import { getMockVehicles } from "@/lib/mock-vehicles";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://triplejautoinvestment.com";

const STATIC_PAGES = [
  { path: "", changeFrequency: "daily" as const, priority: 1.0 },
  { path: "/inventory", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/financing", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/vin-decoder", changeFrequency: "monthly" as const, priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static pages — both locales
  for (const page of STATIC_PAGES) {
    entries.push({
      url: `${BASE_URL}/en${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          en: `${BASE_URL}/en${page.path}`,
          es: `${BASE_URL}/es${page.path}`,
        },
      },
    });
    entries.push({
      url: `${BASE_URL}/es${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          en: `${BASE_URL}/en${page.path}`,
          es: `${BASE_URL}/es${page.path}`,
        },
      },
    });
  }

  // Vehicle detail pages
  let vehicles;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@/lib/supabase/server");
    const { getVehicles } = await import("@/lib/supabase/queries/vehicles");
    const supabase = await createClient();
    vehicles = await getVehicles(supabase);
  } else {
    vehicles = getMockVehicles();
  }

  for (const vehicle of vehicles) {
    const lastMod = vehicle.updatedAt ? new Date(vehicle.updatedAt) : now;
    entries.push({
      url: `${BASE_URL}/en/inventory/${vehicle.slug}`,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: {
          en: `${BASE_URL}/en/inventory/${vehicle.slug}`,
          es: `${BASE_URL}/es/inventory/${vehicle.slug}`,
        },
      },
    });
    entries.push({
      url: `${BASE_URL}/es/inventory/${vehicle.slug}`,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: {
          en: `${BASE_URL}/en/inventory/${vehicle.slug}`,
          es: `${BASE_URL}/es/inventory/${vehicle.slug}`,
        },
      },
    });
  }

  return entries;
}
