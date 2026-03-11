import { NextRequest, NextResponse } from "next/server";
import { searchEmails, getEmailContent, isGmailConfigured } from "@/lib/gmail";
import { processEmail } from "@/lib/email-parsers";
import {
  createVehicleFromPurchase,
  updateVehicleFromGuarantee,
  updateVehicleFromTransport,
  getVehicleByVin,
} from "@/lib/supabase/queries/pipeline";
import { createClient } from "@/lib/supabase/server";
import type { ParsedPurchase, ParsedGuarantee, ParsedTransport } from "@/types/pipeline";

// ============================================================
// Admin Auth (replicated from middleware — API routes are excluded)
// ============================================================

const ADMIN_SECRET = process.env.ADMIN_SECRET || "dev-secret-triple-j";
const SESSION_MAX_AGE = 86400 * 1000; // 24 hours

async function verifyAdminToken(token: string): Promise<boolean> {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;

  const timestamp = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!timestamp || !signature) return false;

  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > SESSION_MAX_AGE || age < 0) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ADMIN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expected;
}

// ============================================================
// Sync Endpoint
// ============================================================

// Gmail search query for pipeline email senders
const PIPELINE_QUERY =
  "from:support@ove.com OR from:protected@dealshield.com OR from:do-not-reply@centraldispatch.com";

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  details: {
    created: string[];
    updated: string[];
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<SyncResult | { error: string }>> {
  // 1. Auth check
  const token = request.cookies.get("admin-session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized. Admin login required." },
      { status: 401 }
    );
  }

  // 2. Check Gmail credentials
  if (!isGmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Gmail not configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN env vars.",
      },
      { status: 503 }
    );
  }

  // 3. Build search query with optional date filter
  const { searchParams } = new URL(request.url);
  const afterDays = parseInt(searchParams.get("days") || "30", 10);
  const afterDate = new Date(Date.now() - afterDays * 86400 * 1000);
  const afterStr = `${afterDate.getFullYear()}/${String(afterDate.getMonth() + 1).padStart(2, "0")}/${String(afterDate.getDate()).padStart(2, "0")}`;
  const maxResults = parseInt(searchParams.get("limit") || "50", 10);

  const query = `${PIPELINE_QUERY} after:${afterStr}`;

  const result: SyncResult = {
    success: true,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    details: { created: [], updated: [] },
  };

  try {
    // 4. Search Gmail
    const messageIds = await searchEmails(query, maxResults);

    if (messageIds.length === 0) {
      return NextResponse.json(result);
    }

    const supabase = await createClient();

    // 5. Check which emails were already processed
    const { data: existingEvents } = await supabase
      .from("vehicle_events")
      .select("source_email_id")
      .in("source_email_id", messageIds);

    const processedIds = new Set(
      (existingEvents || []).map((e: { source_email_id: string }) => e.source_email_id)
    );

    // 6. Process each email
    for (const msgId of messageIds) {
      // Skip already-processed emails (idempotent)
      if (processedIds.has(msgId)) {
        result.skipped++;
        continue;
      }

      try {
        const email = await getEmailContent(msgId);
        const body = email.bodyHtml || email.bodyText;

        if (!body) {
          result.skipped++;
          continue;
        }

        const processed = processEmail(email.sender, email.subject, body);

        switch (processed.type) {
          case "purchase": {
            const parsed = processed.data as ParsedPurchase;
            // Check if VIN already exists
            const existing = await getVehicleByVin(supabase, parsed.vin);
            if (existing) {
              result.skipped++;
            } else {
              const vehicle = await createVehicleFromPurchase(
                supabase,
                parsed,
                msgId
              );
              result.created++;
              result.details.created.push(
                `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
              );
            }
            break;
          }

          case "high_bid": {
            const parsed = processed.data as ParsedPurchase;
            const existing = await getVehicleByVin(supabase, parsed.vin);
            if (existing) {
              result.skipped++;
            } else {
              // Create with Bidding status
              const vehicle = await createVehicleFromPurchase(
                supabase,
                parsed,
                msgId
              );
              // Override status to Bidding
              await supabase
                .from("vehicles")
                .update({ status: "Bidding" })
                .eq("id", vehicle.id);
              result.created++;
              result.details.created.push(
                `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin}) [BIDDING]`
              );
            }
            break;
          }

          case "guarantee": {
            const parsed = processed.data as ParsedGuarantee;
            const updated = await updateVehicleFromGuarantee(
              supabase,
              parsed,
              msgId
            );
            if (updated) {
              result.updated++;
              result.details.updated.push(
                `${updated.vin} — guarantee confirmed`
              );
            } else {
              result.skipped++;
            }
            break;
          }

          case "transport_accepted":
          case "transport_picked_up":
          case "transport_delivered": {
            const parsed = processed.data as ParsedTransport;
            const updated = await updateVehicleFromTransport(
              supabase,
              parsed,
              msgId
            );
            if (updated.length > 0) {
              result.updated += updated.length;
              for (const v of updated) {
                result.details.updated.push(
                  `${v.vin} — ${processed.type.replace("transport_", "")}`
                );
              }
            } else {
              result.skipped++;
            }
            break;
          }

          default:
            result.skipped++;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        result.errors.push(`Email ${msgId}: ${message}`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Gmail sync failed: ${message}` },
      { status: 500 }
    );
  }

  result.success = result.errors.length === 0;
  return NextResponse.json(result);
}
