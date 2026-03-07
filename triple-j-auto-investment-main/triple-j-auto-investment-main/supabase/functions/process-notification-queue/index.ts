// Process Notification Queue - Supabase Edge Function
// Invoked every minute by pg_cron to process debounced notification queue items.
// Sends SMS via Twilio and/or email via Resend based on customer preferences.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendSms } from '../_shared/twilio.ts';
import { sendEmail } from '../_shared/resend.ts';
import { renderStatusUpdateEmail } from '../_shared/email-templates/status-update.tsx';
import { renderRejectionEmail } from '../_shared/email-templates/rejection-notice.tsx';

// ---------------------------------------------------------------------------
// Stage metadata (hardcoded to avoid importing frontend types into Deno)
// ---------------------------------------------------------------------------

const STAGE_LABELS: Record<string, string> = {
  sale_complete: 'Sale Complete',
  documents_collected: 'Documents Collected',
  submitted_to_dmv: 'Submitted to DMV',
  dmv_processing: 'DMV Processing',
  sticker_ready: 'Sticker Ready',
  sticker_delivered: 'Sticker Delivered',
  rejected: 'Rejected',
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  sale_complete: 'Vehicle sold, plates assigned from dealer inventory.',
  documents_collected: 'All paperwork received (title, 130-U, insurance, inspection).',
  submitted_to_dmv: 'Packet uploaded to webDEALER.',
  dmv_processing: 'Awaiting DMV review.',
  sticker_ready: 'Registration approved, sticker available for pickup/delivery.',
  sticker_delivered: 'Customer received their sticker.',
  rejected: 'DMV rejected submission. Review notes and resubmit.',
};

const STAGE_ORDER: Record<string, number> = {
  sale_complete: 1,
  documents_collected: 2,
  submitted_to_dmv: 3,
  dmv_processing: 4,
  sticker_ready: 5,
  sticker_delivered: 6,
  rejected: 0,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  return (
    Deno.env.get('PUBLIC_SITE_URL') ||
    Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app') ||
    'https://triplejautoinvestment.com'
  );
}

function getSupabaseFunctionsUrl(): string {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  return supabaseUrl;
}

function buildTrackingUrl(orderId: string, accessToken: string): string {
  return `${getBaseUrl()}/track/${orderId}-${accessToken}`;
}

function buildUnsubscribeUrl(registrationId: string, accessToken: string): string {
  return `${getSupabaseFunctionsUrl()}/functions/v1/unsubscribe?reg=${registrationId}&token=${accessToken}`;
}

// ---------------------------------------------------------------------------
// SMS message builders
// ---------------------------------------------------------------------------

function buildStageSms(
  reg: Record<string, unknown>,
  stageLabel: string,
  trackingUrl: string,
): string {
  return (
    `Hi ${reg.customer_name}, your ${reg.vehicle_year} ${reg.vehicle_make} ${reg.vehicle_model} ` +
    `registration is now at ${stageLabel}. ` +
    `View details: ${trackingUrl}\n` +
    `Reply STOP to unsubscribe`
  );
}

function buildRejectionSms(
  reg: Record<string, unknown>,
  trackingUrl: string,
): string {
  return (
    `Hi ${reg.customer_name}, your ${reg.vehicle_year} ${reg.vehicle_make} ${reg.vehicle_model} ` +
    `registration was returned by DMV for corrections. ` +
    `Our team is addressing this. ` +
    `View details: ${trackingUrl}\n` +
    `Questions? Call (832) 400-9760\n` +
    `Reply STOP to unsubscribe`
  );
}

// ---------------------------------------------------------------------------
// Notification logging
// ---------------------------------------------------------------------------

async function logNotification(
  supabase: ReturnType<typeof createClient>,
  params: {
    registrationId: string;
    channel: string;
    oldStage: string | null;
    newStage: string;
    subject: string;
    templateUsed: string;
    providerMessageId: string | null;
    delivered: boolean;
    deliveryError: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from('registration_notifications').insert({
    registration_id: params.registrationId,
    notification_type: params.channel, // 'sms' or 'email'
    old_stage: params.oldStage,
    new_stage: params.newStage,
    subject: params.subject,
    template_used: params.templateUsed,
    provider_message_id: params.providerMessageId,
    delivered: params.delivered,
    delivery_error: params.deliveryError,
    sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error(`[queue] Failed to log notification: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (_req: Request) => {
  let processed = 0;
  let errors = 0;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[queue] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase env vars' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // -----------------------------------------------------------------------
    // 1. Fetch ready queue items joined with registration data
    // -----------------------------------------------------------------------
    const { data: queue, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*, registrations(*)')
      .eq('sent', false)
      .eq('notify_customer', true)
      .lte('send_after', new Date().toISOString());

    if (fetchError) {
      console.error(`[queue] Failed to fetch queue: ${fetchError.message}`);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!queue || queue.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, errors: 0, message: 'No items to process' }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[queue] Processing ${queue.length} notification(s)`);

    // -----------------------------------------------------------------------
    // 2. Process each queue item
    // -----------------------------------------------------------------------
    for (const item of queue) {
      try {
        const reg = item.registrations;

        if (!reg) {
          console.warn(`[queue] Queue item ${item.id} has no linked registration, skipping`);
          await markSent(supabase, item.id, 'no_linked_registration');
          processed++;
          continue;
        }

        // Check notification preferences
        if (reg.notification_pref === 'none') {
          console.log(`[queue] Registration ${reg.id} pref is 'none', skipping`);
          await markSent(supabase, item.id, 'skipped_preference_none');

          await logNotification(supabase, {
            registrationId: reg.id,
            channel: 'none',
            oldStage: item.old_stage,
            newStage: item.new_stage,
            subject: 'Skipped - preference none',
            templateUsed: 'none',
            providerMessageId: null,
            delivered: false,
            deliveryError: 'skipped_preference_none',
          });

          processed++;
          continue;
        }

        const newStage = item.new_stage as string;
        const oldStage = item.old_stage as string | null;
        const isRejection = newStage === 'rejected';
        const stageLabel = STAGE_LABELS[newStage] || newStage;
        const stageDescription = STAGE_DESCRIPTIONS[newStage] || '';
        const stageOrder = STAGE_ORDER[newStage] || 0;

        const trackingUrl = buildTrackingUrl(
          reg.order_id || reg.id,
          reg.access_token || '',
        );
        const unsubscribeUrl = buildUnsubscribeUrl(reg.id, reg.access_token || '');

        let smsSuccess = false;
        let emailSuccess = false;
        let smsAttempted = false;
        let emailAttempted = false;

        // -------------------------------------------------------------------
        // Send SMS if pref includes SMS and phone exists
        // -------------------------------------------------------------------
        const shouldSendSms =
          ['sms', 'both'].includes(reg.notification_pref || 'both') && reg.customer_phone;

        if (shouldSendSms) {
          smsAttempted = true;
          const smsBody = isRejection
            ? buildRejectionSms(reg, trackingUrl)
            : buildStageSms(reg, stageLabel, trackingUrl);

          const smsResult = await sendSms(reg.customer_phone, smsBody);
          smsSuccess = smsResult.success;

          await logNotification(supabase, {
            registrationId: reg.id,
            channel: 'sms',
            oldStage,
            newStage,
            subject: isRejection
              ? 'Attention Required - Registration Returned'
              : `Registration Update - ${stageLabel}`,
            templateUsed: isRejection ? 'rejection_sms' : 'stage_update_sms',
            providerMessageId: smsResult.sid || null,
            delivered: smsResult.success,
            deliveryError: smsResult.error || null,
          });

          if (!smsResult.success) {
            console.warn(`[queue] SMS failed for ${reg.id}: ${smsResult.error}`);
          }
        }

        // -------------------------------------------------------------------
        // Send email if pref includes email and email exists
        // Also send email as fallback if SMS failed (per CONTEXT.md auto-fallback)
        // -------------------------------------------------------------------
        const prefIncludesEmail = ['email', 'both'].includes(reg.notification_pref || 'both');
        const smsFailed = smsAttempted && !smsSuccess;
        const shouldSendEmail = (prefIncludesEmail || smsFailed) && reg.customer_email;

        if (shouldSendEmail) {
          emailAttempted = true;
          const emailSubject = isRejection
            ? 'Attention Required - Registration Returned'
            : `Registration Update - ${stageLabel}`;

          const emailHtml = isRejection
            ? renderRejectionEmail({
                customerName: reg.customer_name || 'Valued Customer',
                vehicleYear: reg.vehicle_year || 0,
                vehicleMake: reg.vehicle_make || '',
                vehicleModel: reg.vehicle_model || '',
                rejectionNotes: reg.rejection_notes || undefined,
                trackingUrl,
                unsubscribeUrl,
              })
            : renderStatusUpdateEmail({
                customerName: reg.customer_name || 'Valued Customer',
                vehicleYear: reg.vehicle_year || 0,
                vehicleMake: reg.vehicle_make || '',
                vehicleModel: reg.vehicle_model || '',
                currentStage: newStage,
                stageLabel,
                stageDescription,
                stageOrder,
                trackingUrl,
                unsubscribeUrl,
              });

          const emailResult = await sendEmail({
            to: reg.customer_email,
            subject: emailSubject,
            html: emailHtml,
          });
          emailSuccess = emailResult.success;

          const templateUsed = isRejection ? 'rejection_email' : 'stage_update_email';
          const channelLabel = smsFailed && !prefIncludesEmail ? 'email_fallback' : 'email';

          await logNotification(supabase, {
            registrationId: reg.id,
            channel: channelLabel,
            oldStage,
            newStage,
            subject: emailSubject,
            templateUsed,
            providerMessageId: emailResult.id || null,
            delivered: emailResult.success,
            deliveryError: emailResult.error || null,
          });

          if (!emailResult.success) {
            console.warn(`[queue] Email failed for ${reg.id}: ${emailResult.error}`);
          }
        }

        // -------------------------------------------------------------------
        // Mark queue item as sent (even if both failed -- don't retry forever)
        // -------------------------------------------------------------------
        const anySuccess = smsSuccess || emailSuccess;
        const noneAttempted = !smsAttempted && !emailAttempted;
        const errorNote = noneAttempted
          ? 'no_contact_info'
          : !anySuccess
            ? 'all_channels_failed'
            : undefined;

        await markSent(supabase, item.id, errorNote);

        if (!anySuccess && !noneAttempted) {
          errors++;
          console.error(`[queue] All channels failed for registration ${reg.id}`);
        }

        processed++;
      } catch (itemError) {
        const errMsg = itemError instanceof Error ? itemError.message : String(itemError);
        console.error(`[queue] Error processing item ${item.id}: ${errMsg}`);
        errors++;
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
          console.error(`[queue] Could not mark item ${item.id} as sent after error`);
        }
      }
    }
  } catch (outerError) {
    const errMsg = outerError instanceof Error ? outerError.message : String(outerError);
    console.error(`[queue] Fatal error: ${errMsg}`);
    return new Response(
      JSON.stringify({ error: errMsg, processed, errors }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  console.log(`[queue] Done. Processed: ${processed}, Errors: ${errors}`);
  return new Response(
    JSON.stringify({ processed, errors }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});

// ---------------------------------------------------------------------------
// Mark a queue item as sent
// ---------------------------------------------------------------------------

async function markSent(
  supabase: ReturnType<typeof createClient>,
  queueItemId: string,
  error?: string,
): Promise<void> {
  const update: Record<string, unknown> = {
    sent: true,
    sent_at: new Date().toISOString(),
  };
  if (error) {
    update.error = error;
  }

  const { error: updateError } = await supabase
    .from('notification_queue')
    .update(update)
    .eq('id', queueItemId);

  if (updateError) {
    console.error(`[queue] Failed to mark item ${queueItemId} as sent: ${updateError.message}`);
  }
}
