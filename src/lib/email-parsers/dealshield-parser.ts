import type { ParsedGuarantee } from "@/types/pipeline";

/**
 * Parse DealShield DS360 Guarantee Confirmation emails.
 *
 * From: protected@dealshield.com
 * Subject pattern: "Purchase Confirmation: VIN: {VIN}"
 * Body: plain text with "Key: Value" format (machine-generated).
 */

const SUBJECT_RE = /Purchase Confirmation:\s*VIN:\s*([A-HJ-NPR-Z0-9]{17})/i;

function extractField(text: string, label: string): string | null {
  const re = new RegExp(label + "\\s*[:\\-]\\s*([^\\n]+)", "i");
  const m = text.match(re);
  return m ? m[1].trim() || null : null;
}

function extractDollar(text: string, label: string): number | null {
  const re = new RegExp(label + "\\s*[:\\-]\\s*\\$?([\\d,]+\\.?\\d*)", "i");
  const m = text.match(re);
  if (!m) return null;
  const val = parseFloat(m[1].replace(/,/g, ""));
  return Number.isFinite(val) ? val : null;
}

function extractNumber(text: string, label: string): number | null {
  const re = new RegExp(label + "\\s*[:\\-]\\s*([\\d,]+)", "i");
  const m = text.match(re);
  if (!m) return null;
  const val = parseInt(m[1].replace(/,/g, ""), 10);
  return Number.isFinite(val) ? val : null;
}

function extractYear(text: string): number | null {
  const m = text.match(/\bYear\s*[:\-]\s*(\d{4})/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

export function parseDealShieldGuarantee(
  subject: string,
  body: string
): ParsedGuarantee | null {
  const subjectMatch = subject.match(SUBJECT_RE);
  if (!subjectMatch) return null;

  const vin = subjectMatch[1].toUpperCase();

  return {
    vin,
    year: extractYear(body),
    make: extractField(body, "Make"),
    model: extractField(body, "Model"),
    odometer: extractNumber(body, "Odometer") ??
      extractNumber(body, "Mileage"),
    vehiclePurchasePrice: extractDollar(body, "Vehicle Purchase Price") ??
      extractDollar(body, "Purchase Price"),
    dateGuaranteed: extractField(body, "Date Guaranteed"),
    guaranteeExpiration: extractField(body, "Guarantee Expiration") ??
      extractField(body, "Expiration"),
    guaranteePrice: extractDollar(body, "Guarantee Price") ??
      extractDollar(body, "Guarantee Cost"),
    location: extractField(body, "Location"),
  };
}
