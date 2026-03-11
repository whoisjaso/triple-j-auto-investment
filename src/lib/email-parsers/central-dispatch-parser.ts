import type {
  ParsedTransport,
  TransportStatus,
  TransportVehicle,
} from "@/types/pipeline";

/**
 * Parse Central Dispatch transport notification emails.
 *
 * From: do-not-reply@centraldispatch.com
 * Subject patterns:
 *   "Load ID: 12345 has been ACCEPTED by Carrier Name"
 *   "Load ID: 12345 has been PICKED UP by Carrier Name"
 *   "Load ID: 12345 has been DELIVERED by Carrier Name"
 *
 * Body: plain text with labeled fields (machine-generated).
 */

const SUBJECT_RE =
  /Load ID:\s*(\d+)\s+has been\s+(ACCEPTED|PICKED\s*UP|DELIVERED)\s+by\s+(.+)/i;

function normalizeTransportStatus(raw: string): TransportStatus {
  const upper = raw.toUpperCase().replace(/\s+/g, "_");
  if (upper === "PICKED_UP" || upper === "PICKEDUP") return "PICKED_UP";
  if (upper === "DELIVERED") return "DELIVERED";
  return "ACCEPTED";
}

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

function extractVehicles(text: string): TransportVehicle[] {
  const vehicles: TransportVehicle[] = [];

  // Pattern 1: "2014 Chevrolet Malibu VIN: 1G11H5SL7EF122059"
  const vinLineRe =
    /(\d{4})\s+(\S+)\s+(\S+).*?(?:VIN[:\s]*)?([A-HJ-NPR-Z0-9]{17})/gi;
  let match;
  while ((match = vinLineRe.exec(text)) !== null) {
    vehicles.push({
      year: parseInt(match[1], 10),
      make: match[2],
      model: match[3],
      vin: match[4].toUpperCase(),
    });
  }

  if (vehicles.length > 0) return vehicles;

  // Pattern 2: standalone VINs on their own lines
  const standaloneVinRe = /\b([A-HJ-NPR-Z0-9]{17})\b/g;
  while ((match = standaloneVinRe.exec(text)) !== null) {
    vehicles.push({
      year: null,
      make: null,
      model: null,
      vin: match[1].toUpperCase(),
    });
  }

  // Pattern 3: "Year Make Model" lines without VIN (e.g., DELIVERED emails)
  if (vehicles.length === 0) {
    const ymmRe = /(\d{4})\s+([A-Z][a-z]+\S*)\s+([A-Z][a-z]+\S*)/g;
    while ((match = ymmRe.exec(text)) !== null) {
      vehicles.push({
        year: parseInt(match[1], 10),
        make: match[2],
        model: match[3],
        vin: null,
      });
    }
  }

  return vehicles;
}

export function parseCentralDispatchNotification(
  subject: string,
  body: string
): ParsedTransport | null {
  const subjectMatch = subject.match(SUBJECT_RE);
  if (!subjectMatch) return null;

  const [, loadId, statusRaw, carrierName] = subjectMatch;

  return {
    loadId,
    transportStatus: normalizeTransportStatus(statusRaw),
    carrierName: carrierName.trim(),
    pickupLocation: extractField(body, "Pick Up Location") ??
      extractField(body, "Pick-Up Location") ??
      extractField(body, "Pickup Location"),
    deliveryLocation: extractField(body, "Delivery Location"),
    requestedPickupDate: extractField(body, "Requested Pick Up Date") ??
      extractField(body, "Requested Pickup Date"),
    requestedDeliveryDate: extractField(body, "Requested Delivery Date"),
    carrierPickupEta: extractField(body, "Carrier Pick Up ETA") ??
      extractField(body, "Carrier Pickup ETA"),
    carrierDeliveryEta: extractField(body, "Carrier Delivery ETA"),
    transportPrice: extractDollar(body, "Price") ??
      extractDollar(body, "Transport Price") ??
      extractDollar(body, "Total Price"),
    vehicles: extractVehicles(body),
  };
}
