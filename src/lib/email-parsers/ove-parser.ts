import type { ParsedPurchase } from "@/types/pipeline";

/**
 * Parse OVE.com / Manheim Purchase Confirmation emails.
 *
 * Subject pattern:
 *   "Manheim.com Purchase Confirmation (2014 Chevrolet Malibu LTZ 1G11H5SL7EF122059 TOYOTA FINANCIAL SERVICES)"
 *
 * Body: structured HTML with labeled fields (machine-generated, consistent format).
 */

const SUBJECT_RE =
  /Manheim\.com Purchase Confirmation \((\d{4})\s+(\S+)\s+(\S+)\s+(.*?)\s+([A-HJ-NPR-Z0-9]{17})\s+(.+?)\)/i;

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|tr|td|th|li)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#?\w+;/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

function extractDollar(text: string, label: string): number | null {
  // Match patterns like "Purchase Amount: $12,345.67" or "Buy Fee $250.00"
  const re = new RegExp(label + "[:\\s]*\\$?([\\d,]+\\.?\\d*)", "i");
  const m = text.match(re);
  if (!m) return null;
  const val = parseFloat(m[1].replace(/,/g, ""));
  return Number.isFinite(val) ? val : null;
}

function extractField(text: string, label: string): string | null {
  const re = new RegExp(label + "[:\\s]+([^\\n]+)", "i");
  const m = text.match(re);
  return m ? m[1].trim() || null : null;
}

function extractMileage(text: string): number | null {
  const m = text.match(/([\d,]+)\s*mi/i);
  if (!m) return null;
  const val = parseInt(m[1].replace(/,/g, ""), 10);
  return Number.isFinite(val) ? val : null;
}

function extractColor(text: string, type: "ext" | "int"): string | null {
  // Patterns: "Blue ext", "BLK int", "Exterior Color: Blue"
  const shortRe = new RegExp(
    type === "ext" ? /(\S+)\s+ext/i : /(\S+)\s+int/i
  );
  const m = text.match(shortRe);
  if (m) return m[1].trim();

  const label = type === "ext" ? "Exterior Color" : "Interior Color";
  return extractField(text, label);
}

export function parseOvePurchaseConfirmation(
  subject: string,
  body: string
): ParsedPurchase | null {
  const subjectMatch = subject.match(SUBJECT_RE);
  if (!subjectMatch) return null;

  const [, yearStr, make, model, trim, vin, sellerName] = subjectMatch;
  const plainBody = stripHtml(body);

  return {
    vin: vin.toUpperCase(),
    year: parseInt(yearStr, 10),
    make,
    model,
    trim: trim || null,
    mileage: extractMileage(plainBody),
    exteriorColor: extractColor(plainBody, "ext"),
    interiorColor: extractColor(plainBody, "int"),
    bodyStyle: extractField(plainBody, "Body Style"),
    pickupLocation: extractField(plainBody, "Pick-Up Location") ??
      extractField(plainBody, "Pick Up Location") ??
      extractField(plainBody, "Pickup Location"),
    workOrderNumber: extractField(plainBody, "Work Order"),
    stockNumber: extractField(plainBody, "Stock Number") ??
      extractField(plainBody, "Stock #"),
    purchasePrice: extractDollar(plainBody, "Purchase Amount") ??
      extractDollar(plainBody, "Purchase Price"),
    buyFee: extractDollar(plainBody, "Buy Fee") ??
      extractDollar(plainBody, "Buyer Facilitation Fee"),
    totalCost: extractDollar(plainBody, "Total Amount") ??
      extractDollar(plainBody, "Total"),
    auctionLocation: extractField(plainBody, "Facilitating Location") ??
      extractField(plainBody, "Auction Location"),
    sellerName: sellerName.trim(),
    purchaseDate: extractField(plainBody, "Purchase Date") ??
      extractField(plainBody, "Sale Date"),
  };
}
