// Process Follow-Up Queue - Supabase Edge Function
// Invoked every 5 minutes by pg_cron to process pending behavioral follow-up messages.
// Dispatches SMS via Twilio, email via Resend, and voice calls via Retell AI.
//
// Behavioral tiers handled:
//   Tier 1 (browse):  SMS after 24h browsing without action
//   Tier 2 (save):    SMS after 4h saving a vehicle
//   Tier 3 (abandon): SMS + email after 1h form abandonment
//   Tier 4 (voice):   Retell AI outbound call after 2h for high-intent question askers
//
// Per-item try/catch prevents one failure from blocking the rest of the batch.
// Items are marked sent=true even on error to prevent infinite retry loops.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendSms } from '../_shared/twilio.ts';
import { sendEmail } from '../_shared/resend.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Lead {
  phone: string | null;
  name: string | null;
  email: string | null;
  preferred_language: string | null;
}

interface QueueItem {
  id: string;
  lead_id: string;
  trigger_type: 'browse' | 'save' | 'abandon' | 'voice' | null;
  channel: 'sms' | 'email' | 'voice';
  vehicle_id: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_slug: string | null;
  views_7d: number;
  message_language: string;
  send_after: string;
  leads: Lead | null;
  // Nurture pipeline fields (from automation foundation)
  step_key: string | null;
  template_key: string | null;
}

interface MessageTemplate {
  body: string;
  subject: string | null;
  variables: string[];
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
      console.error('[follow-up] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase env vars' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // -----------------------------------------------------------------------
    // 1. Fetch ready queue items joined with lead contact data
    // -----------------------------------------------------------------------
    const { data: queue, error: fetchError } = await supabase
      .from('follow_up_queue')
      .select('*, leads(phone, name, email, preferred_language)')
      .eq('sent', false)
      .eq('cancelled', false)
      .lte('send_after', new Date().toISOString())
      .order('send_after', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error(`[follow-up] Failed to fetch queue: ${fetchError.message}`);
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

    console.log(`[follow-up] Processing ${queue.length} follow-up(s)`);

    // -----------------------------------------------------------------------
    // 2. Process each queue item
    // -----------------------------------------------------------------------
    for (const item of queue as QueueItem[]) {
      try {
        const lead = item.leads;
        const lang = (item.message_language || lead?.preferred_language || 'en') as 'en' | 'es';

        if (!lead) {
          console.warn(`[follow-up] Queue item ${item.id} has no linked lead, skipping`);
          await markSent(supabase, item.id, 'no_linked_lead');
          processed++;
          continue;
        }

        if (!lead.phone && item.channel !== 'email') {
          console.warn(`[follow-up] Lead for queue item ${item.id} has no phone, skipping`);
          await markSent(supabase, item.id, 'no_phone_on_lead');
          processed++;
          continue;
        }

        // -------------------------------------------------------------------
        // Handle nurture pipeline items (template-based)
        // -------------------------------------------------------------------
        if (item.step_key && item.template_key) {
          // Special case: cold_14d just marks lead as Cold, no message sent
          if (item.step_key === 'cold_14d') {
            await supabase
              .from('leads')
              .update({ status: 'Cold', nurture_active: false })
              .eq('id', item.lead_id);
            await markSent(supabase, item.id);
            processed++;
            continue;
          }

          // Fetch template
          const { data: tmpl } = await supabase
            .from('message_templates')
            .select('body, subject, variables')
            .eq('template_key', item.template_key)
            .eq('language', lang)
            .eq('is_approved', true)
            .eq('auto_send', true)
            .single();

          if (!tmpl || !tmpl.body) {
            console.warn(`[follow-up] Template ${item.template_key}/${lang} not approved/auto-send or not found`);
            await markSent(supabase, item.id, 'template_not_ready');
            processed++;
            continue;
          }

          // Fetch vehicle data for template variables if lead has a vehicle interest
          const { data: leadData } = await supabase
            .from('leads')
            .select('interest, vehicle_id')
            .eq('id', item.lead_id)
            .single();

          let vehicleVars: Record<string, string> = {};
          if (leadData?.vehicle_id) {
            const { data: veh } = await supabase
              .from('vehicles')
              .select('year, make, model, price, slug')
              .eq('id', leadData.vehicle_id)
              .single();
            if (veh) {
              vehicleVars = {
                vehicle_year: String(veh.year || ''),
                vehicle_make: veh.make || '',
                vehicle_model: veh.model || '',
                vehicle_price: veh.price ? String(veh.price) : '',
                vehicle_url: veh.slug
                  ? `https://triplejautoinvestment.com/vehicles/${veh.slug}`
                  : 'https://triplejautoinvestment.com/inventory',
              };
            }
          }

          // Render template
          const vars: Record<string, string> = {
            customer_name: lead.name || 'there',
            ...vehicleVars,
          };
          let body = tmpl.body;
          for (const [key, value] of Object.entries(vars)) {
            body = body.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
          }

          // Dispatch rendered message
          if (item.channel === 'sms' && lead.phone) {
            const smsResult = await sendSms(lead.phone, body + ' Reply STOP to opt out.');
            if (!smsResult.success) {
              await markSent(supabase, item.id, `sms_failed: ${smsResult.error}`);
              errors++;
            } else {
              // Log to sent_messages
              await supabase.from('sent_messages').insert({
                template_key: item.template_key,
                channel: 'sms',
                recipient: lead.phone,
                body,
                entity_type: 'lead',
                entity_id: item.lead_id,
                status: 'sent',
                provider_message_id: smsResult.sid || null,
              });
              await markSent(supabase, item.id);
            }
          } else if (item.channel === 'email' && lead.email) {
            const emailResult = await sendEmail({
              to: lead.email,
              subject: tmpl.subject || 'Triple J Auto Investment',
              html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
            });
            if (!emailResult.success) {
              await markSent(supabase, item.id, `email_failed: ${emailResult.error}`);
              errors++;
            } else {
              await supabase.from('sent_messages').insert({
                template_key: item.template_key,
                channel: 'email',
                recipient: lead.email,
                subject: tmpl.subject,
                body,
                entity_type: 'lead',
                entity_id: item.lead_id,
                status: 'sent',
              });
              await markSent(supabase, item.id);
            }
          } else if (item.channel === 'voice' && lead.phone) {
            const voiceResult = await triggerRetellCall(item, lead);
            if (!voiceResult.success) {
              await markSent(supabase, item.id, `voice_failed: ${voiceResult.error}`);
              errors++;
            } else {
              await supabase.from('sent_messages').insert({
                template_key: item.template_key,
                channel: 'voice',
                recipient: lead.phone,
                body: `Voice call initiated: ${body}`,
                entity_type: 'lead',
                entity_id: item.lead_id,
                status: 'sent',
                provider_message_id: voiceResult.callId || null,
              });
              await markSent(supabase, item.id);
            }
          } else {
            await markSent(supabase, item.id, 'no_contact_info_for_channel');
          }

          // Update lead follow-up tracking
          await supabase
            .from('leads')
            .update({ last_follow_up_at: new Date().toISOString(), follow_up_step: item.step_key })
            .eq('id', item.lead_id);

          processed++;
          continue;
        }

        // -------------------------------------------------------------------
        // Dispatch by channel (legacy behavioral follow-ups)
        // -------------------------------------------------------------------
        if (item.channel === 'sms') {
          if (!lead.phone) {
            await markSent(supabase, item.id, 'no_phone_on_lead');
            processed++;
            continue;
          }

          const smsBody = buildSmsBody(item, lang);
          const smsResult = await sendSms(lead.phone, smsBody);

          // Detect Twilio opt-out error (21610 = recipient has opted out)
          if (!smsResult.success && smsResult.error?.includes('21610')) {
            console.warn(`[follow-up] Phone ${lead.phone} has opted out (21610), not retrying`);
            await markSent(supabase, item.id, 'twilio_21610_opted_out');
          } else if (!smsResult.success) {
            console.warn(`[follow-up] SMS failed for item ${item.id}: ${smsResult.error}`);
            await markSent(supabase, item.id, `sms_failed: ${smsResult.error}`);
            errors++;
          } else {
            await markSent(supabase, item.id);
          }
        } else if (item.channel === 'email') {
          if (!lead.email) {
            console.warn(`[follow-up] Lead for queue item ${item.id} has no email, skipping`);
            await markSent(supabase, item.id, 'no_email_on_lead');
            processed++;
            continue;
          }

          const subject = lang === 'es'
            ? `Continua tu busqueda - Triple J Auto Investment`
            : `Pick up where you left off - Triple J Auto Investment`;

          const emailHtml = buildEmailHtml(item, lang, lead);
          const emailResult = await sendEmail({ to: lead.email, subject, html: emailHtml });

          if (!emailResult.success) {
            console.warn(`[follow-up] Email failed for item ${item.id}: ${emailResult.error}`);
            await markSent(supabase, item.id, `email_failed: ${emailResult.error}`);
            errors++;
          } else {
            await markSent(supabase, item.id);
          }
        } else if (item.channel === 'voice') {
          if (!lead.phone) {
            await markSent(supabase, item.id, 'no_phone_on_lead');
            processed++;
            continue;
          }

          const voiceResult = await triggerRetellCall(item, lead);

          if (!voiceResult.success) {
            console.warn(`[follow-up] Retell call failed for item ${item.id}: ${voiceResult.error}`);
            await markSent(supabase, item.id, `voice_failed: ${voiceResult.error}`);
            errors++;
          } else {
            await markSent(supabase, item.id);
          }
        }

        processed++;
      } catch (itemError) {
        const errMsg = itemError instanceof Error ? itemError.message : String(itemError);
        console.error(`[follow-up] Error processing item ${item.id}: ${errMsg}`);
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
          console.error(`[follow-up] Could not mark item ${item.id} as sent after error`);
        }
      }
    }
  } catch (outerError) {
    const errMsg = outerError instanceof Error ? outerError.message : String(outerError);
    console.error(`[follow-up] Fatal error: ${errMsg}`);
    return new Response(
      JSON.stringify({ error: errMsg, processed, errors }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  console.log(`[follow-up] Done. Processed: ${processed}, Errors: ${errors}`);
  return new Response(
    JSON.stringify({ processed, errors }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});

// ---------------------------------------------------------------------------
// buildSmsBody
// ---------------------------------------------------------------------------
// Builds bilingual SMS message for SMS-channel queue items.
// Covers: browse, save, abandon trigger types.
// Every message includes: vehicle ref, vehicle page URL, dealership phone,
// and STOP opt-out instruction.

function buildSmsBody(
  item: QueueItem,
  lang: 'en' | 'es',
): string {
  const vehicle = buildVehicleLabel(item);
  const url = buildVehicleUrl(item);

  if (lang === 'es') {
    switch (item.trigger_type) {
      case 'browse':
        return (
          `Hola! El ${vehicle} que estabas viendo sigue disponible. ` +
          `Velo aqui: ${url} o llamanos al (832) 400-9760. ` +
          `Responde STOP para cancelar.`
        );
      case 'save':
        return (
          `Hola! El ${vehicle} que guardaste tiene atencion -- ` +
          `${item.views_7d || 0} vistas esta semana. ` +
          `Te interesa? ${url} o llama al (832) 400-9760. ` +
          `Responde STOP para cancelar.`
        );
      case 'abandon':
        return (
          `Hola! Guardamos tu informacion sobre el ${vehicle}. ` +
          `Continua aqui: ${url} o llamanos al (832) 400-9760. ` +
          `Responde STOP para cancelar.`
        );
      default:
        return (
          `Hola! Gracias por visitar Triple J Auto Investment. ` +
          `Ver inventario: ${url} o llama al (832) 400-9760. ` +
          `Responde STOP para cancelar.`
        );
    }
  }

  // English (default)
  switch (item.trigger_type) {
    case 'browse':
      return (
        `Hi! The ${vehicle} you were looking at is still available. ` +
        `View it here: ${url} or call us at (832) 400-9760. ` +
        `Reply STOP to opt out.`
      );
    case 'save':
      return (
        `Hi! The ${vehicle} you saved is getting attention -- ` +
        `${item.views_7d || 0} views this week. ` +
        `Still interested? ${url} or call (832) 400-9760. ` +
        `Reply STOP to opt out.`
      );
    case 'abandon':
      return (
        `Hi! We saved your info from your inquiry about the ${vehicle}. ` +
        `Pick up where you left off: ${url} or call (832) 400-9760. ` +
        `Reply STOP to opt out.`
      );
    default:
      return (
        `Hi! Thanks for visiting Triple J Auto Investment. ` +
        `Browse inventory: ${url} or call us at (832) 400-9760. ` +
        `Reply STOP to opt out.`
      );
  }
}

// ---------------------------------------------------------------------------
// buildEmailHtml
// ---------------------------------------------------------------------------
// Builds minimal inline-styled HTML email for Tier 3 (abandon) follow-ups.
// Bilingual based on message_language. Includes vehicle details, CTA link,
// dealership phone, and unsubscribe link.

function buildEmailHtml(
  item: QueueItem,
  lang: 'en' | 'es',
  lead: Lead,
): string {
  const vehicle = buildVehicleLabel(item);
  const url = buildVehicleUrl(item);
  const greeting = lead.name ? (lang === 'es' ? `Hola ${lead.name}` : `Hi ${lead.name}`) : (lang === 'es' ? `Hola` : `Hi there`);
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://triplejautoinvestment.com';
  const unsubscribeUrl = `${supabaseUrl}/functions/v1/unsubscribe?lead=${item.lead_id}&type=follow_up`;

  if (lang === 'es') {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Triple J Auto Investment</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#111111;border:1px solid #D4AF37;">
          <!-- Header -->
          <tr>
            <td style="background-color:#D4AF37;padding:20px 30px;text-align:center;">
              <p style="margin:0;font-size:20px;font-weight:bold;color:#0a0a0a;letter-spacing:0.1em;">TRIPLE J AUTO INVESTMENT</p>
              <p style="margin:4px 0 0;font-size:11px;color:#0a0a0a;letter-spacing:0.2em;">HOUSTON, TX</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:30px 30px 20px;">
              <p style="margin:0 0 16px;font-size:16px;color:#ffffff;">${greeting},</p>
              <p style="margin:0 0 16px;font-size:15px;color:#cccccc;line-height:1.6;">
                Guardamos tu informacion sobre el <strong style="color:#D4AF37;">${vehicle}</strong>.
                Si quieres continuar, el vehiculo sigue disponible para ti.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <a href="${url}" style="display:inline-block;background-color:#D4AF37;color:#0a0a0a;padding:14px 30px;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:0.15em;">
                      VER VEHICULO
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:14px;color:#cccccc;">
                Tambien puedes llamarnos directamente:
              </p>
              <p style="margin:0 0 24px;font-size:16px;font-weight:bold;color:#D4AF37;">
                (832) 400-9760
              </p>
              <p style="margin:0;font-size:14px;color:#cccccc;line-height:1.6;">
                Estamos aqui para ayudarte a encontrar el vehiculo correcto a un precio justo.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 30px 20px;border-top:1px solid #333333;">
              <p style="margin:0;font-size:11px;color:#666666;text-align:center;">
                Triple J Auto Investment &bull; Houston, TX &bull; (832) 400-9760
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#666666;text-align:center;">
                <a href="${unsubscribeUrl}" style="color:#666666;text-decoration:underline;">Cancelar suscripcion</a>
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

  // English
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
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#111111;border:1px solid #D4AF37;">
          <!-- Header -->
          <tr>
            <td style="background-color:#D4AF37;padding:20px 30px;text-align:center;">
              <p style="margin:0;font-size:20px;font-weight:bold;color:#0a0a0a;letter-spacing:0.1em;">TRIPLE J AUTO INVESTMENT</p>
              <p style="margin:4px 0 0;font-size:11px;color:#0a0a0a;letter-spacing:0.2em;">HOUSTON, TX</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:30px 30px 20px;">
              <p style="margin:0 0 16px;font-size:16px;color:#ffffff;">${greeting},</p>
              <p style="margin:0 0 16px;font-size:15px;color:#cccccc;line-height:1.6;">
                We saved your information from your inquiry about the <strong style="color:#D4AF37;">${vehicle}</strong>.
                If you are still interested, the vehicle is available for you.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <a href="${url}" style="display:inline-block;background-color:#D4AF37;color:#0a0a0a;padding:14px 30px;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:0.15em;">
                      VIEW VEHICLE
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:14px;color:#cccccc;">
                You can also call us directly:
              </p>
              <p style="margin:0 0 24px;font-size:16px;font-weight:bold;color:#D4AF37;">
                (832) 400-9760
              </p>
              <p style="margin:0;font-size:14px;color:#cccccc;line-height:1.6;">
                We are here to help you find the right vehicle at a fair price.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 30px 20px;border-top:1px solid #333333;">
              <p style="margin:0;font-size:11px;color:#666666;text-align:center;">
                Triple J Auto Investment &bull; Houston, TX &bull; (832) 400-9760
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#666666;text-align:center;">
                <a href="${unsubscribeUrl}" style="color:#666666;text-decoration:underline;">Unsubscribe</a>
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
// triggerRetellCall
// ---------------------------------------------------------------------------
// Initiates an outbound Retell AI voice call for Tier 4 (voice) follow-ups.
// Uses server-side Deno.env credentials (NOT VITE_ prefixed).
// If Retell credentials are not configured, logs a warning and returns error
// without crashing the queue batch.

interface RetellCallResult {
  success: boolean;
  callId?: string;
  error?: string;
}

async function triggerRetellCall(
  item: QueueItem,
  lead: Lead,
): Promise<RetellCallResult> {
  const apiKey = Deno.env.get('RETELL_API_KEY');
  const agentId = Deno.env.get('RETELL_OUTBOUND_AGENT_ID');
  const fromNumber = Deno.env.get('RETELL_OUTBOUND_NUMBER');

  if (!apiKey || !agentId || !fromNumber) {
    const missing = [
      !apiKey && 'RETELL_API_KEY',
      !agentId && 'RETELL_OUTBOUND_AGENT_ID',
      !fromNumber && 'RETELL_OUTBOUND_NUMBER',
    ].filter(Boolean).join(', ');
    console.warn(`[follow-up] Retell credentials not configured: ${missing}. Voice call skipped.`);
    return { success: false, error: 'retell_not_configured' };
  }

  const vehicleFull = [item.vehicle_year, item.vehicle_make, item.vehicle_model]
    .filter(Boolean)
    .join(' ') || 'the vehicle';

  try {
    const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        to_number: lead.phone,
        from_number: fromNumber,
        retell_llm_dynamic_variables: {
          customer_name: lead.name || 'there',
          vehicle_full: vehicleFull,
          vehicle_year: String(item.vehicle_year || ''),
          vehicle_make: item.vehicle_make || '',
          vehicle_model: item.vehicle_model || '',
          inquiry_source: 'follow_up',
          is_rental: 'no',
          preferred_language: lead.preferred_language || 'en',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[follow-up] Retell API error for item ${item.id}: ${response.status} ${errorText}`);
      return { success: false, error: `retell_api_error: ${response.status}` };
    }

    const data = await response.json();
    console.log(`[follow-up] Retell call initiated for item ${item.id}, call_id: ${data.call_id}`);
    return { success: true, callId: data.call_id };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[follow-up] Retell network error for item ${item.id}: ${errMsg}`);
    return { success: false, error: `retell_network_error: ${errMsg}` };
  }
}

// ---------------------------------------------------------------------------
// markSent
// ---------------------------------------------------------------------------
// Updates a queue item as sent=true, sent_at=NOW().
// Optionally sets error column for failed deliveries.
// Matches the exact pattern used in process-notification-queue.

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
    .from('follow_up_queue')
    .update(update)
    .eq('id', queueItemId);

  if (updateError) {
    console.error(`[follow-up] Failed to mark item ${queueItemId} as sent: ${updateError.message}`);
  }
}

// ---------------------------------------------------------------------------
// buildVehicleLabel
// ---------------------------------------------------------------------------
// Returns a human-readable vehicle description from queue item fields.

function buildVehicleLabel(item: QueueItem): string {
  const parts = [item.vehicle_year, item.vehicle_make, item.vehicle_model].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'the vehicle';
}

// ---------------------------------------------------------------------------
// buildVehicleUrl
// ---------------------------------------------------------------------------
// Returns the full URL to the vehicle detail page.
// Falls back to inventory page if no slug is available.

function buildVehicleUrl(item: QueueItem): string {
  if (item.vehicle_slug) {
    return `https://triplejautoinvestment.com/vehicles/${item.vehicle_slug}`;
  }
  return 'https://triplejautoinvestment.com/inventory';
}
