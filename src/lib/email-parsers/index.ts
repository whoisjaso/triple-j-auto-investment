import type {
  ParsedPurchase,
  ParsedGuarantee,
  ParsedTransport,
  EmailClassification,
} from "@/types/pipeline";
import { classifyEmail } from "@/types/pipeline";
import { parseOvePurchaseConfirmation } from "./ove-parser";
import { parseDealShieldGuarantee } from "./dealshield-parser";
import { parseCentralDispatchNotification } from "./central-dispatch-parser";

export { parseOvePurchaseConfirmation } from "./ove-parser";
export { parseDealShieldGuarantee } from "./dealshield-parser";
export { parseCentralDispatchNotification } from "./central-dispatch-parser";

// ============================================================
// Unified email processing
// ============================================================

export type ProcessedEmail =
  | { type: "purchase"; data: ParsedPurchase; classification: EmailClassification }
  | { type: "high_bid"; data: ParsedPurchase; classification: EmailClassification }
  | { type: "guarantee"; data: ParsedGuarantee; classification: EmailClassification }
  | { type: "transport_accepted"; data: ParsedTransport; classification: EmailClassification }
  | { type: "transport_picked_up"; data: ParsedTransport; classification: EmailClassification }
  | { type: "transport_delivered"; data: ParsedTransport; classification: EmailClassification }
  | { type: "unknown"; data: null; classification: EmailClassification };

/**
 * Process a raw email by classifying it and routing to the appropriate parser.
 * Pure function — no network calls, no side effects.
 */
export function processEmail(
  sender: string,
  subject: string,
  body: string
): ProcessedEmail {
  const classification = classifyEmail(sender, subject);

  switch (classification.type) {
    case "purchase": {
      const data = parseOvePurchaseConfirmation(subject, body);
      if (data) return { type: "purchase", data, classification };
      return { type: "unknown", data: null, classification };
    }

    case "high_bid": {
      // High bid emails have similar format to purchase confirmations
      const data = parseOvePurchaseConfirmation(subject, body);
      if (data) return { type: "high_bid", data, classification };
      return { type: "unknown", data: null, classification };
    }

    case "guarantee": {
      const data = parseDealShieldGuarantee(subject, body);
      if (data) return { type: "guarantee", data, classification };
      return { type: "unknown", data: null, classification };
    }

    case "transport_accepted": {
      const data = parseCentralDispatchNotification(subject, body);
      if (data) return { type: "transport_accepted", data, classification };
      return { type: "unknown", data: null, classification };
    }

    case "transport_picked_up": {
      const data = parseCentralDispatchNotification(subject, body);
      if (data) return { type: "transport_picked_up", data, classification };
      return { type: "unknown", data: null, classification };
    }

    case "transport_delivered": {
      const data = parseCentralDispatchNotification(subject, body);
      if (data) return { type: "transport_delivered", data, classification };
      return { type: "unknown", data: null, classification };
    }

    default:
      return { type: "unknown", data: null, classification };
  }
}
