/**
 * Generate a URL-friendly slug from vehicle data.
 * Appends first 6 chars of UUID for uniqueness (handles duplicate year/make/model).
 * Example: "2018-honda-accord-a1b2c3"
 */
export function generateVehicleSlug(year: number, make: string, model: string, id: string): string {
  const base = `${year}-${make}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const shortId = id.slice(0, 6);
  return `${base}-${shortId}`;
}

/**
 * Extract the short ID suffix from a slug for database lookup.
 * Example: "2018-honda-accord-a1b2c3" -> { shortId: "a1b2c3" }
 */
export function parseVehicleSlug(slug: string): { shortId: string } {
  const parts = slug.split('-');
  const shortId = parts[parts.length - 1];
  return { shortId };
}
