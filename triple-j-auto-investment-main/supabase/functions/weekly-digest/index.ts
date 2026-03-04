// Weekly Digest - Supabase Edge Function
// Invoked by pg_cron Sunday at 8pm CT.
// Compiles a comprehensive weekly business summary and emails it to the admin.
//
// Queries:
//  - Vehicles added/sold this week, avg days on lot
//  - Leads: total new, response rate
//  - Revenue: gross, net, margin
//  - Registrations: completed, in progress
//  - Rentals: active, revenue, late returns
//  - Top referrer of the week
//  - Recommended actions for next week

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendEmail } from '../_shared/resend.ts';
import { sendTelegram } from '../_shared/telegram.ts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = 'admin@triplejautoinvestment.com';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || ADMIN_EMAIL;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[weekly-digest] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase env vars' }),
        { status: 500, headers: CORS_HEADERS },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Date ranges
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgoStr = weekAgo.toISOString().slice(0, 10);
    const monthStartStr = monthStart.toISOString().slice(0, 10);

    // -----------------------------------------------------------------------
    // Parallel data fetch
    // -----------------------------------------------------------------------
    const [
      vehicleRes,
      soldRes,
      leadsRes,
      regsRes,
      rentalsRes,
      paymentsRes,
      referralRes,
      staleRes,
    ] = await Promise.all([
      // Vehicles added this week
      supabase.from('vehicles').select('id, make, model, year, status, price, cost, date_added')
        .gte('date_added', weekAgoStr),
      // Sold this week
      supabase.from('vehicles').select('id, make, model, year, price, cost, sold_price, cost_towing, cost_mechanical, cost_cosmetic, cost_other, sold_date, date_added')
        .eq('status', 'Sold')
        .gte('sold_date', weekAgoStr),
      // Leads this week
      supabase.from('leads').select('id, name, status, date')
        .gte('date', weekAgo.toISOString()),
      // Registrations
      supabase.from('registrations').select('id, current_stage, customer_name'),
      // Active rentals
      supabase.from('rental_bookings').select('id, booking_id, status, end_date, total_cost')
        .in('status', ['active', 'overdue']),
      // Rental payments this month
      supabase.from('rental_payments').select('amount, payment_date')
        .gte('payment_date', monthStartStr),
      // Referral clicks this week
      supabase.from('referral_clicks').select('referral_code')
        .gte('clicked_at', weekAgo.toISOString()),
      // Stale inventory (21+ days)
      supabase.from('vehicles').select('id, make, model, year, price, date_added')
        .eq('status', 'Available'),
    ]);

    // -----------------------------------------------------------------------
    // Compute metrics
    // -----------------------------------------------------------------------

    const vehiclesAdded = vehicleRes.data?.length || 0;
    const sold = soldRes.data || [];
    const vehiclesSold = sold.length;

    // Revenue
    const grossRevenue = sold.reduce((s: number, v: any) => s + (v.sold_price || v.price || 0), 0);
    const totalCosts = sold.reduce((s: number, v: any) =>
      s + (v.cost || 0) + (v.cost_towing || 0) + (v.cost_mechanical || 0) + (v.cost_cosmetic || 0) + (v.cost_other || 0), 0);
    const netProfit = grossRevenue - totalCosts;
    const margin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

    // Avg days on lot for sold vehicles
    const daysOnLot = sold.map((v: any) => {
      if (!v.date_added || !v.sold_date) return 0;
      return Math.max(0, Math.floor((new Date(v.sold_date).getTime() - new Date(v.date_added).getTime()) / 86400000));
    });
    const avgDaysOnLot = daysOnLot.length > 0 ? Math.round(daysOnLot.reduce((a: number, b: number) => a + b, 0) / daysOnLot.length) : 0;

    // Leads
    const leads = leadsRes.data || [];
    const newLeads = leads.length;
    const respondedLeads = leads.filter((l: any) => ['Contacted', 'Engaged', 'Scheduled'].includes(l.status)).length;
    const responseRate = newLeads > 0 ? Math.round((respondedLeads / newLeads) * 100) : 0;

    // Registrations
    const regs = regsRes.data || [];
    const activeRegs = regs.filter((r: any) => !['sticker_delivered', 'rejected'].includes(r.current_stage)).length;
    const completedRegs = regs.filter((r: any) => r.current_stage === 'sticker_delivered').length;
    const readyForDelivery = regs.filter((r: any) => r.current_stage === 'sticker_ready').length;

    // Rentals
    const activeRentals = (rentalsRes.data || []).filter((r: any) => r.status === 'active').length;
    const overdueRentals = (rentalsRes.data || []).filter((r: any) => r.status === 'overdue').length;
    const rentalRevenue = (paymentsRes.data || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);

    // Top referrer
    const referralCounts: Record<string, number> = {};
    for (const c of (referralRes.data || [])) {
      referralCounts[c.referral_code] = (referralCounts[c.referral_code] || 0) + 1;
    }
    const topReferralCode = Object.entries(referralCounts).sort(([, a], [, b]) => b - a)[0];
    let topReferrerName = 'None this week';
    if (topReferralCode) {
      const { data: refData } = await supabase
        .from('owner_referrals')
        .select('referrer_name')
        .eq('referral_code', topReferralCode[0])
        .limit(1)
        .single();
      topReferrerName = refData?.referrer_name
        ? `${refData.referrer_name} (${topReferralCode[1]} clicks)`
        : `${topReferralCode[0]} (${topReferralCode[1]} clicks)`;
    }

    // Stale inventory
    const staleVehicles = (staleRes.data || []).filter((v: any) => {
      if (!v.date_added) return false;
      const days = Math.floor((now.getTime() - new Date(v.date_added).getTime()) / 86400000);
      return days >= 21;
    });

    // Recommendations
    const recommendations: string[] = [];
    if (staleVehicles.length > 0) {
      recommendations.push(`${staleVehicles.length} vehicle${staleVehicles.length > 1 ? 's' : ''} on lot 21+ days — consider price reductions`);
    }
    if (overdueRentals > 0) {
      recommendations.push(`${overdueRentals} overdue rental${overdueRentals > 1 ? 's' : ''} — follow up on returns`);
    }
    if (readyForDelivery > 0) {
      recommendations.push(`${readyForDelivery} sticker${readyForDelivery > 1 ? 's' : ''} ready for delivery — schedule pickups`);
    }
    if (newLeads > 5 && responseRate < 50) {
      recommendations.push(`Response rate ${responseRate}% — prioritize lead follow-up`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Business is running smoothly — keep up the great work!');
    }

    // -----------------------------------------------------------------------
    // Build email HTML
    // -----------------------------------------------------------------------
    const weekLabel = `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const html = buildDigestEmail({
      weekLabel,
      vehiclesAdded,
      vehiclesSold,
      avgDaysOnLot,
      grossRevenue,
      netProfit,
      margin,
      newLeads,
      responseRate,
      activeRegs,
      completedRegs,
      readyForDelivery,
      activeRentals,
      overdueRentals,
      rentalRevenue,
      topReferrerName,
      recommendations,
      staleVehicles: staleVehicles.map((v: any) => `${v.year} ${v.make} ${v.model} — $${(v.price || 0).toLocaleString()}`),
    });

    // -----------------------------------------------------------------------
    // Send email
    // -----------------------------------------------------------------------
    const result = await sendEmail({
      to: adminEmail,
      subject: `Weekly Digest — ${weekLabel}`,
      html,
    });

    console.log(`[weekly-digest] Email sent: ${result.success}, id: ${result.id || 'n/a'}`);

    // -----------------------------------------------------------------------
    // Send Telegram summary
    // -----------------------------------------------------------------------
    const telegramMsg = buildTelegramDigest({
      weekLabel,
      vehiclesAdded,
      vehiclesSold,
      avgDaysOnLot,
      grossRevenue,
      netProfit,
      margin,
      newLeads,
      responseRate,
      activeRentals,
      overdueRentals,
      rentalRevenue,
      topReferrerName,
      recommendations,
      staleCount: staleVehicles.length,
    });

    const tgResult = await sendTelegram(telegramMsg, 'HTML');
    console.log(`[weekly-digest] Telegram sent: ${tgResult.success}`);

    return new Response(
      JSON.stringify({
        success: result.success,
        telegram: tgResult.success,
        metrics: { vehiclesAdded, vehiclesSold, grossRevenue, netProfit, newLeads, activeRentals },
      }),
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[weekly-digest] Error: ${msg}`);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: CORS_HEADERS },
    );
  }
});

// ---------------------------------------------------------------------------
// Email template builder
// ---------------------------------------------------------------------------

interface DigestData {
  weekLabel: string;
  vehiclesAdded: number;
  vehiclesSold: number;
  avgDaysOnLot: number;
  grossRevenue: number;
  netProfit: number;
  margin: number;
  newLeads: number;
  responseRate: number;
  activeRegs: number;
  completedRegs: number;
  readyForDelivery: number;
  activeRentals: number;
  overdueRentals: number;
  rentalRevenue: number;
  topReferrerName: string;
  recommendations: string[];
  staleVehicles: string[];
}

function buildDigestEmail(d: DigestData): string {
  const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;

  const recItems = d.recommendations.map(r => `
    <tr><td style="padding:4px 0;color:#d4af37;font-size:13px;">&#x2022; ${r}</td></tr>
  `).join('');

  const staleItems = d.staleVehicles.length > 0
    ? d.staleVehicles.slice(0, 5).map(v => `
        <tr><td style="padding:2px 0;color:#999;font-size:12px;">&#x2022; ${v}</td></tr>
      `).join('')
    : '<tr><td style="color:#666;font-size:12px;">None — inventory is fresh!</td></tr>';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="padding:30px 20px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
          <h1 style="margin:0;color:#d4af37;font-size:20px;letter-spacing:3px;text-transform:uppercase;">
            Triple J Auto Investment
          </h1>
          <p style="margin:8px 0 0;color:#666;font-size:12px;letter-spacing:2px;">
            WEEKLY DIGEST &mdash; ${d.weekLabel}
          </p>
        </td></tr>

        <!-- Sales & Revenue -->
        <tr><td style="padding:24px 20px 0;">
          <h2 style="margin:0 0 12px;color:#fff;font-size:13px;letter-spacing:2px;text-transform:uppercase;">
            Sales & Revenue
          </h2>
          <table width="100%" cellpadding="8" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
            <tr>
              <td style="color:#999;font-size:12px;">Vehicles Added</td>
              <td style="color:#fff;font-size:14px;font-weight:bold;text-align:right;">${d.vehiclesAdded}</td>
            </tr>
            <tr>
              <td style="color:#999;font-size:12px;">Vehicles Sold</td>
              <td style="color:#d4af37;font-size:14px;font-weight:bold;text-align:right;">${d.vehiclesSold}</td>
            </tr>
            <tr>
              <td style="color:#999;font-size:12px;">Avg Days on Lot</td>
              <td style="color:#fff;font-size:14px;font-weight:bold;text-align:right;">${d.avgDaysOnLot}d</td>
            </tr>
            <tr style="border-top:1px solid rgba(255,255,255,0.06);">
              <td style="color:#999;font-size:12px;">Gross Revenue</td>
              <td style="color:#fff;font-size:14px;font-weight:bold;text-align:right;">${fmt(d.grossRevenue)}</td>
            </tr>
            <tr>
              <td style="color:#999;font-size:12px;">Net Profit</td>
              <td style="color:${d.netProfit >= 0 ? '#4ade80' : '#f87171'};font-size:14px;font-weight:bold;text-align:right;">${fmt(d.netProfit)}</td>
            </tr>
            <tr>
              <td style="color:#999;font-size:12px;">Margin</td>
              <td style="color:#d4af37;font-size:14px;font-weight:bold;text-align:right;">${d.margin}%</td>
            </tr>
          </table>
        </td></tr>

        <!-- Leads -->
        <tr><td style="padding:24px 20px 0;">
          <h2 style="margin:0 0 12px;color:#fff;font-size:13px;letter-spacing:2px;text-transform:uppercase;">
            Leads
          </h2>
          <table width="100%" cellpadding="8" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
            <tr>
              <td style="color:#999;font-size:12px;">New This Week</td>
              <td style="color:#fff;font-size:14px;font-weight:bold;text-align:right;">${d.newLeads}</td>
            </tr>
            <tr>
              <td style="color:#999;font-size:12px;">Response Rate</td>
              <td style="color:${d.responseRate >= 50 ? '#4ade80' : '#fbbf24'};font-size:14px;font-weight:bold;text-align:right;">${d.responseRate}%</td>
            </tr>
          </table>
        </td></tr>

        <!-- Registrations & Rentals -->
        <tr><td style="padding:24px 20px 0;">
          <h2 style="margin:0 0 12px;color:#fff;font-size:13px;letter-spacing:2px;text-transform:uppercase;">
            Registrations & Rentals
          </h2>
          <table width="100%" cellpadding="8" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
            <tr>
              <td style="color:#999;font-size:12px;">Registrations In Progress</td>
              <td style="color:#fff;font-size:14px;font-weight:bold;text-align:right;">${d.activeRegs}</td>
            </tr>
            <tr>
              <td style="color:#999;font-size:12px;">Ready for Delivery</td>
              <td style="color:#d4af37;font-size:14px;font-weight:bold;text-align:right;">${d.readyForDelivery}</td>
            </tr>
            <tr>
              <td style="color:#999;font-size:12px;">Active Rentals</td>
              <td style="color:#fff;font-size:14px;font-weight:bold;text-align:right;">${d.activeRentals}</td>
            </tr>
            <tr>
              <td style="color:#999;font-size:12px;">Overdue Returns</td>
              <td style="color:${d.overdueRentals > 0 ? '#f87171' : '#4ade80'};font-size:14px;font-weight:bold;text-align:right;">${d.overdueRentals}</td>
            </tr>
            <tr>
              <td style="color:#999;font-size:12px;">Rental Revenue (MTD)</td>
              <td style="color:#d4af37;font-size:14px;font-weight:bold;text-align:right;">${fmt(d.rentalRevenue)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Top Referrer -->
        <tr><td style="padding:24px 20px 0;">
          <h2 style="margin:0 0 12px;color:#fff;font-size:13px;letter-spacing:2px;text-transform:uppercase;">
            Top Referrer
          </h2>
          <p style="margin:0;color:#d4af37;font-size:14px;font-weight:bold;">${d.topReferrerName}</p>
        </td></tr>

        <!-- Recommendations -->
        <tr><td style="padding:24px 20px 0;">
          <h2 style="margin:0 0 12px;color:#fff;font-size:13px;letter-spacing:2px;text-transform:uppercase;">
            Recommended Actions
          </h2>
          <table cellpadding="0" cellspacing="0">${recItems}</table>
        </td></tr>

        <!-- Stale Inventory -->
        <tr><td style="padding:24px 20px 0;">
          <h2 style="margin:0 0 12px;color:#fff;font-size:13px;letter-spacing:2px;text-transform:uppercase;">
            Stale Inventory (21+ Days)
          </h2>
          <table cellpadding="0" cellspacing="0">${staleItems}</table>
          ${d.staleVehicles.length > 5 ? `<p style="color:#666;font-size:11px;margin-top:4px;">+ ${d.staleVehicles.length - 5} more</p>` : ''}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:30px 20px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;">
          <p style="margin:0;color:#666;font-size:11px;">
            Triple J Auto Investment &mdash; 8774 Almeda Genoa Road, Houston, TX 77075
          </p>
          <p style="margin:4px 0 0;color:#444;font-size:10px;">
            This digest is sent every Sunday at 8 PM CT.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Telegram digest builder
// ---------------------------------------------------------------------------

interface TelegramDigestData {
  weekLabel: string;
  vehiclesAdded: number;
  vehiclesSold: number;
  avgDaysOnLot: number;
  grossRevenue: number;
  netProfit: number;
  margin: number;
  newLeads: number;
  responseRate: number;
  activeRentals: number;
  overdueRentals: number;
  rentalRevenue: number;
  topReferrerName: string;
  recommendations: string[];
  staleCount: number;
}

function buildTelegramDigest(d: TelegramDigestData): string {
  const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;
  const recs = d.recommendations.map(r => `\u2022 ${r}`).join('\n');

  return `\uD83D\uDCCA <b>WEEKLY DIGEST</b> \u2014 ${d.weekLabel}

<b>Sales & Revenue</b>
\u2022 Added: ${d.vehiclesAdded} | Sold: ${d.vehiclesSold}
\u2022 Avg Days on Lot: ${d.avgDaysOnLot}
\u2022 Gross: ${fmt(d.grossRevenue)} | Net: ${fmt(d.netProfit)} (${d.margin}%)

<b>Leads</b>
\u2022 New: ${d.newLeads} | Response Rate: ${d.responseRate}%

<b>Rentals</b>
\u2022 Active: ${d.activeRentals} | Overdue: ${d.overdueRentals}
\u2022 Revenue (MTD): ${fmt(d.rentalRevenue)}

<b>Top Referrer:</b> ${d.topReferrerName}
${d.staleCount > 0 ? `\u26A0\uFE0F <b>${d.staleCount} stale vehicle(s)</b> (21+ days on lot)` : '\u2705 Inventory is fresh'}

<b>Recommended Actions:</b>
${recs}`;
}
