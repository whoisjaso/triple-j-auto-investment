// Process Review Requests - Supabase Edge Function
// Invoked by pg_cron to process pending review request messages.
// Dispatches SMS via Twilio and email via Resend.
//
// Review request schedule:
//   Day 3 (initial):  SMS + email asking for a Google review
//   Day 7 (followup): Gentler SMS + email reminder if review not yet completed
//
// Per-item try/catch prevents one failure from blocking the rest of the batch.
// Items are marked sent=true even on error to prevent infinite retry loops.
// GOOGLE_REVIEW_LINK is a placeholder -- replace with actual Triple J Place ID.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendSms } from '../_shared/twilio.ts';
import { sendEmail } from '../_shared/resend.ts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// TODO(business-data): Replace with actual Triple J Google review link.
// Find it in Google Business Profile -> Get more reviews -> Share review form.
const GOOGLE_REVIEW_LINK = 'https://g.page/r/YOUR_PLACE_ID/review';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Registration {
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
}

interface ReviewQueueItem {
  id: string;
  registration_id: string;
  channel: 'sms' | 'email';
  request_type: 'initial' | 'followup';
  send_after: string;
  sent: boolean;
  sent_at: string | null;
  registrations: Registration | null;
}

// ---------------------------------------------------------------------------
// CORS headers (for manual testing via HTTP)
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Handle CORS preflight for manual testing
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  let processed = 0;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[review-requests] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase env vars' }),
        { status: 500, headers: CORS_HEADERS },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // -----------------------------------------------------------------------
    // 1. Fetch unsent review requests joined with registration contact data
    // -----------------------------------------------------------------------
    const { data: queue, error: fetchError } = await supabase
      .from('review_requests')
      .select('*, registrations(customer_name, customer_phone, customer_email, vehicle_year, vehicle_make, vehicle_model)')
      .eq('sent', false)
      .lte('send_after', new Date().toISOString())
      .order('send_after', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error(`[review-requests] Failed to fetch queue: ${fetchError.message}`);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: CORS_HEADERS },
      );
    }

    if (!queue || queue.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No items to process' }),
        { headers: CORS_HEADERS },
      );
    }

    console.log(`[review-requests] Processing ${queue.length} review request(s)`);

    // -----------------------------------------------------------------------
    // 2. Process each queue item
    // -----------------------------------------------------------------------
    for (const item of queue as ReviewQueueItem[]) {
      try {
        const registration = item.registrations;

        if (!registration) {
          console.warn(`[review-requests] Item ${item.id} has no linked registration, skipping`);
          await markSent(supabase, item.id, 'no_linked_registration');
          processed++;
          continue;
        }

        // Extract first name from customer_name (split on space, take first)
        const firstName = registration.customer_name
          ? registration.customer_name.split(' ')[0]
          : 'there';

        const year = registration.vehicle_year ?? '';
        const make = registration.vehicle_make ?? '';
        const model = registration.vehicle_model ?? '';

        // -------------------------------------------------------------------
        // Dispatch by channel
        // -------------------------------------------------------------------
        if (item.channel === 'sms') {
          if (!registration.customer_phone) {
            console.warn(`[review-requests] Item ${item.id} has no customer_phone, skipping`);
            await markSent(supabase, item.id, 'no_customer_phone');
            processed++;
            continue;
          }

          const smsBody = buildSmsBody(item.request_type, firstName, year, make, model);
          const smsResult = await sendSms(registration.customer_phone, smsBody);

          // Detect Twilio opt-out error (21610 = recipient has opted out)
          if (!smsResult.success && smsResult.error?.includes('21610')) {
            console.warn(`[review-requests] Phone ${registration.customer_phone} opted out (21610), not retrying`);
            await markSent(supabase, item.id, 'twilio_21610_opted_out');
          } else if (!smsResult.success) {
            console.warn(`[review-requests] SMS failed for item ${item.id}: ${smsResult.error}`);
            await markSent(supabase, item.id, `sms_failed: ${smsResult.error}`);
          } else {
            console.log(`[review-requests] SMS sent for item ${item.id} (${item.request_type})`);
            await markSent(supabase, item.id);
          }
        } else if (item.channel === 'email') {
          if (!registration.customer_email) {
            console.warn(`[review-requests] Item ${item.id} has no customer_email, skipping`);
            await markSent(supabase, item.id, 'no_customer_email');
            processed++;
            continue;
          }

          const subject = item.request_type === 'initial'
            ? `How is your ${year} ${make}?`
            : `Your experience could help a family`;

          const html = buildReviewEmailHtml(
            firstName,
            String(year),
            make,
            model,
            item.request_type,
            GOOGLE_REVIEW_LINK,
          );

          const emailResult = await sendEmail({ to: registration.customer_email, subject, html });

          if (!emailResult.success) {
            console.warn(`[review-requests] Email failed for item ${item.id}: ${emailResult.error}`);
            await markSent(supabase, item.id, `email_failed: ${emailResult.error}`);
          } else {
            console.log(`[review-requests] Email sent for item ${item.id} (${item.request_type})`);
            await markSent(supabase, item.id);
          }
        }

        processed++;
      } catch (itemError) {
        const errMsg = itemError instanceof Error ? itemError.message : String(itemError);
        console.error(`[review-requests] Error processing item ${item.id}: ${errMsg}`);
        processed++;

        // Mark as sent to prevent infinite retry
        try {
          await markSent(
            createClient(
              Deno.env.get('SUPABASE_URL')!,
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
            ),
            item.id,
            `processing_error: ${errMsg}`,
          );
        } catch {
          console.error(`[review-requests] Could not mark item ${item.id} as sent after error`);
        }
      }
    }
  } catch (outerError) {
    const errMsg = outerError instanceof Error ? outerError.message : String(outerError);
    console.error(`[review-requests] Fatal error: ${errMsg}`);
    return new Response(
      JSON.stringify({ error: errMsg, processed }),
      { status: 500, headers: CORS_HEADERS },
    );
  }

  console.log(`[review-requests] Done. Processed: ${processed}`);
  return new Response(
    JSON.stringify({ processed }),
    { headers: CORS_HEADERS },
  );
});

// ---------------------------------------------------------------------------
// buildSmsBody
// ---------------------------------------------------------------------------
// Builds community-framed SMS body for initial (day 3) and followup (day 7).
// Community framing: "help other Houston families", not "do us a favor".

function buildSmsBody(
  requestType: 'initial' | 'followup',
  firstName: string,
  year: number | string,
  make: string,
  model: string,
): string {
  const vehicle = [year, make, model].filter(Boolean).join(' ') || 'your vehicle';

  if (requestType === 'initial') {
    return (
      `Hi ${firstName}! You've been driving your ${vehicle} for a few days now. ` +
      `Would you help other Houston families find a trustworthy dealer? ` +
      `Leave a quick Google review here: ${GOOGLE_REVIEW_LINK} ` +
      `-- Triple J Auto Investment (832) 400-9760`
    );
  }

  // followup (day 7) -- gentler tone
  return (
    `Hi ${firstName}, just a gentle reminder -- your experience with your ${vehicle} ` +
    `could help another family make a confident decision. ` +
    `Review here: ${GOOGLE_REVIEW_LINK} ` +
    `-- Triple J Auto Investment`
  );
}

// ---------------------------------------------------------------------------
// buildReviewEmailHtml
// ---------------------------------------------------------------------------
// Returns inline-styled HTML email for initial and followup review requests.
// Community framing: helping other Houston families, not self-serving.
// Inline CSS only (no external stylesheets) for email client compatibility.
// Dark theme matching site: bg #0a0a0a, text #d4d4d4, gold #d4af37.

function buildReviewEmailHtml(
  firstName: string,
  year: string,
  make: string,
  model: string,
  requestType: 'initial' | 'followup',
  reviewLink: string,
): string {
  const vehicle = [year, make, model].filter(Boolean).join(' ') || 'your vehicle';

  const bodyContent = requestType === 'initial'
    ? `
      <p style="margin:0 0 16px;font-size:16px;color:#ffffff;">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#d4d4d4;line-height:1.7;">
        You've been driving your <strong style="color:#d4af37;">${vehicle}</strong> for a few days now.
        We hope you love it!
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#d4d4d4;line-height:1.7;">
        Other Houston families are looking for a dealer they can trust.
        Your honest experience -- good or constructive -- helps them make a confident decision.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:20px 0;">
            <a href="${reviewLink}"
               style="display:inline-block;background-color:#d4af37;color:#000000;padding:12px 24px;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:0.12em;border-radius:4px;">
              Leave a Google Review
            </a>
          </td>
        </tr>
      </table>
    `
    : `
      <p style="margin:0 0 16px;font-size:16px;color:#ffffff;">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#d4d4d4;line-height:1.7;">
        Just a gentle reminder -- one review from you could help another Houston family
        find reliable transportation they can count on.
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#d4d4d4;line-height:1.7;">
        We appreciate your honest feedback, and so will the next family looking for a
        trustworthy dealer.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:20px 0;">
            <a href="${reviewLink}"
               style="display:inline-block;background-color:#d4af37;color:#000000;padding:12px 24px;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:0.12em;border-radius:4px;">
              Share Your Experience
            </a>
          </td>
        </tr>
      </table>
    `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Triple J Auto Investment</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#111111;border:1px solid #d4af37;">
          <!-- Header -->
          <tr>
            <td style="background-color:#d4af37;padding:20px 30px;text-align:center;">
              <p style="margin:0;font-size:20px;font-weight:bold;color:#0a0a0a;letter-spacing:0.1em;">TRIPLE J AUTO INVESTMENT</p>
              <p style="margin:4px 0 0;font-size:11px;color:#0a0a0a;letter-spacing:0.2em;">HOUSTON, TX</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:30px 30px 20px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 30px 20px;border-top:1px solid #333333;">
              <p style="margin:0;font-size:11px;color:#666666;text-align:center;">
                Triple J Auto Investment &bull; 8774 Almeda Genoa, Houston TX 77075 &bull; (832) 400-9760
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// markSent
// ---------------------------------------------------------------------------
// Updates a review_requests row as sent=true, sent_at=NOW().
// Optionally records an error string for failed deliveries.
// Marks sent=true even on error to prevent infinite retry loops (Phase 18 pattern).

async function markSent(
  supabase: ReturnType<typeof createClient>,
  itemId: string,
  error?: string,
): Promise<void> {
  const update: Record<string, unknown> = {
    sent: true,
    sent_at: new Date().toISOString(),
  };
  if (error) {
    // review_requests table has no error column; log to console instead
    console.warn(`[review-requests] Marking item ${itemId} sent with error: ${error}`);
  }

  const { error: updateError } = await supabase
    .from('review_requests')
    .update(update)
    .eq('id', itemId);

  if (updateError) {
    console.error(`[review-requests] Failed to mark item ${itemId} as sent: ${updateError.message}`);
  }
}
