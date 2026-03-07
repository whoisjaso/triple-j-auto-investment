// Rental Auto-Alerts - Supabase Edge Function
// Invoked by pg_cron daily at 8am CT.
// Sends proactive customer SMS/email for:
//   - Return reminder (T-1 day before end_date)
//   - Overdue notice (T+1 day past end_date)
//   - Payment reminder (outstanding balance > 3 days)
//   - Insurance expiry warning (7 days before expiration)
//
// Uses template system: fetches template by key, renders with variables,
// sends via Twilio SMS, logs to sent_messages.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendSms } from '../_shared/twilio.ts';

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface RentalWithCustomer {
  id: string;
  booking_id: string;
  vehicle_id: string;
  customer_id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_cost: number;
  rental_customers: {
    full_name: string;
    phone: string;
    preferred_language: string | null;
  } | null;
  vehicles: {
    year: number;
    make: string;
    model: string;
  } | null;
}

interface MessageTemplate {
  id: string;
  template_key: string;
  language: string;
  body: string;
  subject: string | null;
  is_approved: boolean;
  auto_send: boolean;
}

// ---------------------------------------------------------------------------
// Template rendering
// ---------------------------------------------------------------------------

function renderTemplate(body: string, vars: Record<string, string>): string {
  let result = body;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  const stats = { returnReminders: 0, overdueNotices: 0, paymentReminders: 0, insuranceWarnings: 0, errors: 0 };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[rental-alerts] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase env vars' }),
        { status: 500, headers: CORS_HEADERS },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
    const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

    // -------------------------------------------------------------------
    // Fetch active/overdue rentals with customer + vehicle joins
    // -------------------------------------------------------------------
    const { data: rentals, error: rentalErr } = await supabase
      .from('rental_bookings')
      .select(`
        id, booking_id, vehicle_id, customer_id, start_date, end_date, status, total_cost,
        rental_customers (full_name, phone, preferred_language),
        vehicles (year, make, model)
      `)
      .in('status', ['active', 'overdue', 'reserved']);

    if (rentalErr) {
      console.error('[rental-alerts] Failed to fetch rentals:', rentalErr);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch rentals' }),
        { status: 500, headers: CORS_HEADERS },
      );
    }

    // -------------------------------------------------------------------
    // Pre-fetch all rental templates
    // -------------------------------------------------------------------
    const { data: templates } = await supabase
      .from('message_templates')
      .select('id, template_key, language, body, subject, is_approved, auto_send')
      .eq('category', 'rental')
      .eq('channel', 'sms')
      .eq('is_approved', true)
      .eq('auto_send', true);

    const templateMap = new Map<string, MessageTemplate>();
    for (const t of (templates || [])) {
      templateMap.set(`${t.template_key}:${t.language}`, t);
    }

    function getTemplate(key: string, lang: string): MessageTemplate | undefined {
      return templateMap.get(`${key}:${lang}`) || templateMap.get(`${key}:en`);
    }

    // -------------------------------------------------------------------
    // Process each rental
    // -------------------------------------------------------------------
    for (const rental of (rentals || []) as RentalWithCustomer[]) {
      const customer = rental.rental_customers;
      if (!customer?.phone) continue;

      const lang = customer.preferred_language || 'en';
      const vehicle = rental.vehicles;
      const vehicleStr = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'your vehicle';

      const vars: Record<string, string> = {
        customer_name: customer.full_name || 'Valued Customer',
        vehicle: vehicleStr,
        booking_id: rental.booking_id,
        end_date: rental.end_date,
        phone: '(832) 400-9760',
      };

      try {
        // 1) RETURN REMINDER: end_date = tomorrow
        if (rental.end_date === tomorrowStr && rental.status === 'active') {
          const tpl = getTemplate('rental_return_reminder', lang);
          if (tpl) {
            const body = renderTemplate(tpl.body, vars);
            const smsResult = await sendSms(customer.phone, body);
            if (smsResult.success) {
              await logSentMessage(supabase, tpl, rental, customer.phone, body);
              stats.returnReminders++;
            } else {
              stats.errors++;
            }
          }
        }

        // 2) OVERDUE NOTICE: end_date = yesterday and still active
        if (rental.end_date <= yesterdayStr && (rental.status === 'active' || rental.status === 'overdue')) {
          const tpl = getTemplate('rental_overdue_notice', lang);
          if (tpl) {
            const overdueDays = Math.floor((now.getTime() - new Date(rental.end_date).getTime()) / 86400000);
            vars.overdue_days = String(overdueDays);
            const body = renderTemplate(tpl.body, vars);
            const smsResult = await sendSms(customer.phone, body);
            if (smsResult.success) {
              await logSentMessage(supabase, tpl, rental, customer.phone, body);
              stats.overdueNotices++;

              // Auto-update status to overdue if not already
              if (rental.status !== 'overdue') {
                await supabase
                  .from('rental_bookings')
                  .update({ status: 'overdue' })
                  .eq('id', rental.id);
              }
            } else {
              stats.errors++;
            }
          }
        }

        // 3) PAYMENT REMINDER: outstanding balance > 3 days
        const { data: payments } = await supabase
          .from('rental_payments')
          .select('amount')
          .eq('booking_id', rental.id);

        const totalPaid = (payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
        const balance = rental.total_cost - totalPaid;
        const rentalAge = Math.floor((now.getTime() - new Date(rental.start_date).getTime()) / 86400000);

        if (balance > 0 && rentalAge > 3) {
          const tpl = getTemplate('rental_payment_reminder', lang);
          if (tpl) {
            vars.balance = `$${balance.toFixed(2)}`;
            const body = renderTemplate(tpl.body, vars);
            const smsResult = await sendSms(customer.phone, body);
            if (smsResult.success) {
              await logSentMessage(supabase, tpl, rental, customer.phone, body);
              stats.paymentReminders++;
            } else {
              stats.errors++;
            }
          }
        }
      } catch (err) {
        console.error(`[rental-alerts] Error processing rental ${rental.booking_id}:`, err);
        stats.errors++;
      }
    }

    // -------------------------------------------------------------------
    // 4) INSURANCE EXPIRY WARNING: expiring within 7 days
    // -------------------------------------------------------------------
    const sevenDaysStr = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

    const { data: expiringIns } = await supabase
      .from('rental_insurance')
      .select('id, booking_id, expiration_date, insurance_company')
      .gte('expiration_date', todayStr)
      .lte('expiration_date', sevenDaysStr);

    for (const ins of (expiringIns || [])) {
      // Find the rental + customer for this insurance
      const rental = ((rentals || []) as RentalWithCustomer[]).find(r => r.id === ins.booking_id);
      if (!rental?.rental_customers?.phone) continue;

      const customer = rental.rental_customers;
      const lang = customer.preferred_language || 'en';
      const tpl = getTemplate('rental_insurance_expiry', lang);
      if (!tpl) continue;

      const vehicle = rental.vehicles;
      const vars: Record<string, string> = {
        customer_name: customer.full_name || 'Valued Customer',
        vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'your vehicle',
        expiration_date: ins.expiration_date,
        insurance_company: ins.insurance_company || 'your provider',
        phone: '(832) 400-9760',
      };

      try {
        const body = renderTemplate(tpl.body, vars);
        const smsResult = await sendSms(customer.phone, body);
        if (smsResult.success) {
          await logSentMessage(supabase, tpl, rental, customer.phone, body);
          stats.insuranceWarnings++;
        } else {
          stats.errors++;
        }
      } catch (err) {
        console.error(`[rental-alerts] Insurance warning error for ${rental.booking_id}:`, err);
        stats.errors++;
      }
    }

    console.log(`[rental-alerts] Complete:`, stats);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[rental-alerts] Fatal error: ${msg}`);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: CORS_HEADERS },
    );
  }
});

// ---------------------------------------------------------------------------
// Log to sent_messages table
// ---------------------------------------------------------------------------

async function logSentMessage(
  supabase: any,
  template: MessageTemplate,
  rental: RentalWithCustomer,
  recipient: string,
  body: string,
): Promise<void> {
  try {
    await supabase.from('sent_messages').insert([{
      template_id: template.id,
      template_key: template.template_key,
      channel: 'sms',
      recipient,
      subject: null,
      body,
      entity_type: 'rental',
      entity_id: rental.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
    }]);
  } catch (err) {
    console.error(`[rental-alerts] Failed to log sent_message:`, err);
  }
}
