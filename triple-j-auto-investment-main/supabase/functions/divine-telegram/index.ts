// Divine Telegram Bot - Supabase Edge Function
// Two-way conversational AI assistant for Triple J business operations.
// Receives Telegram webhook updates, queries Supabase for business data,
// uses Gemini AI to formulate answers, sends response back via Telegram.
//
// Setup: Set Telegram webhook to point to this function's URL.

import { createClient } from 'npm:@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const ALLOWED_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ---------------------------------------------------------------------------
// Telegram API helpers
// ---------------------------------------------------------------------------

async function sendReply(chatId: number, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
}

async function sendTyping(chatId: number): Promise<void> {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  });
}

// ---------------------------------------------------------------------------
// Business data fetchers
// ---------------------------------------------------------------------------

async function getBusinessSnapshot(): Promise<string> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const [
    allVehicles,
    soldThisWeek,
    draftVehicles,
    leads,
    activeRentals,
    registrations,
    recentSold,
  ] = await Promise.all([
    supabase.from('vehicles').select('id, make, model, year, price, cost, status, mileage, cost_towing, cost_mechanical, cost_cosmetic, cost_other, date_added, sold_price, sold_date, purchase_price, market_estimate, vin, intake_source'),
    supabase.from('vehicles').select('id, make, model, year, sold_price, cost, cost_towing, cost_mechanical, cost_cosmetic, cost_other, sold_date').eq('status', 'Sold').gte('sold_date', weekAgo),
    supabase.from('vehicles').select('id, make, model, year, price, cost, vin, date_added').eq('status', 'Draft'),
    supabase.from('leads').select('id, name, status, date, phone').gte('date', new Date(now.getTime() - 30 * 86400000).toISOString()),
    supabase.from('rental_bookings').select('id, booking_id, status, end_date, total_cost, vehicle_id, customer_id').in('status', ['active', 'overdue', 'reserved']),
    supabase.from('registrations').select('id, customer_name, current_stage, vehicle_id'),
    supabase.from('vehicles').select('id, make, model, year, sold_price, cost, cost_towing, cost_mechanical, cost_cosmetic, cost_other').eq('status', 'Sold').order('sold_date', { ascending: false }).limit(10),
  ]);

  const vehicles = allVehicles.data || [];
  const available = vehicles.filter(v => v.status === 'Available');
  const drafts = draftVehicles.data || [];
  const sold = soldThisWeek.data || [];
  const allLeads = leads.data || [];
  const rentals = activeRentals.data || [];
  const regs = registrations.data || [];
  const recent = recentSold.data || [];

  // Compute financials for sold vehicles
  const soldFinancials = recent.map(v => {
    const totalCost = (v.cost || 0) + (v.cost_towing || 0) + (v.cost_mechanical || 0) + (v.cost_cosmetic || 0) + (v.cost_other || 0);
    const profit = (v.sold_price || 0) - totalCost;
    return `${v.year} ${v.make} ${v.model}: sold $${v.sold_price || 0}, cost $${totalCost}, profit $${profit}`;
  });

  // Inventory value
  const totalInventoryValue = available.reduce((s, v) => s + (v.price || 0), 0);
  const totalInventoryCost = available.reduce((s, v) => s + (v.cost || 0) + (v.cost_towing || 0) + (v.cost_mechanical || 0) + (v.cost_cosmetic || 0) + (v.cost_other || 0), 0);

  // Stale vehicles (21+ days)
  const stale = available.filter(v => {
    if (!v.date_added) return false;
    return Math.floor((now.getTime() - new Date(v.date_added).getTime()) / 86400000) >= 21;
  });

  // Best margin vehicles
  const margins = available.map(v => {
    const totalCost = (v.cost || 0) + (v.cost_towing || 0) + (v.cost_mechanical || 0) + (v.cost_cosmetic || 0) + (v.cost_other || 0);
    return { label: `${v.year} ${v.make} ${v.model}`, price: v.price, cost: totalCost, margin: (v.price || 0) - totalCost };
  }).sort((a, b) => b.margin - a.margin);

  // Lead stats
  const newLeads = allLeads.filter(l => l.status === 'New').length;
  const contactedLeads = allLeads.filter(l => ['Contacted', 'Engaged', 'Scheduled'].includes(l.status)).length;

  // Overdue rentals
  const overdueRentals = rentals.filter(r => r.status === 'overdue');

  // Pending registrations
  const pendingRegs = regs.filter(r => !['sticker_delivered', 'rejected'].includes(r.current_stage));

  return `BUSINESS DATA SNAPSHOT (as of ${now.toLocaleDateString('en-US')}):

INVENTORY:
- Available vehicles: ${available.length}
- Draft vehicles (pending review): ${drafts.length}
- Total inventory list value: $${totalInventoryValue.toLocaleString()}
- Total inventory cost: $${totalInventoryCost.toLocaleString()}
- Potential gross profit: $${(totalInventoryValue - totalInventoryCost).toLocaleString()}
- Stale inventory (21+ days): ${stale.length} vehicles
${stale.length > 0 ? 'Stale: ' + stale.map(v => `${v.year} ${v.make} ${v.model} ($${v.price})`).join(', ') : ''}

AVAILABLE VEHICLES:
${available.map(v => `- ${v.year} ${v.make} ${v.model}: $${v.price || 0} (cost: $${v.cost || 0}, mileage: ${v.mileage || 'N/A'})`).join('\n')}

DRAFT VEHICLES (awaiting review):
${drafts.length > 0 ? drafts.map(v => `- ${v.year} ${v.make} ${v.model}: VIN ${v.vin}, cost $${v.cost || 0}`).join('\n') : 'None'}

TOP MARGIN VEHICLES:
${margins.slice(0, 5).map((v, i) => `${i + 1}. ${v.label}: list $${v.price}, cost $${v.cost}, margin $${v.margin}`).join('\n')}

SOLD THIS WEEK: ${sold.length} vehicles
${soldFinancials.length > 0 ? soldFinancials.join('\n') : 'None this week'}

RECENT SALES (last 10):
${recent.length > 0 ? soldFinancials.join('\n') : 'No recent sales'}

LEADS (last 30 days): ${allLeads.length} total, ${newLeads} new, ${contactedLeads} contacted

RENTALS: ${rentals.length} active/reserved, ${overdueRentals.length} overdue
${overdueRentals.length > 0 ? 'OVERDUE: ' + overdueRentals.map(r => `Booking ${r.booking_id} (status: ${r.status})`).join(', ') : ''}

REGISTRATIONS: ${pendingRegs.length} in progress
${pendingRegs.map(r => `- ${r.customer_name}: stage ${r.current_stage}`).join('\n')}`;
}

// ---------------------------------------------------------------------------
// Gemini AI
// ---------------------------------------------------------------------------

async function askGemini(question: string, businessData: string): Promise<string> {
  const systemPrompt = `You are Divine, the AI business assistant for Triple J Auto Investment, a Houston BHPH (Buy Here Pay Here) auto dealership at 8774 Almeda Genoa Road, Houston, TX 77075. Phone: (832) 400-9760.

You are speaking with the business owner/manager via Telegram. Be concise, direct, and helpful. Use the business data provided to answer questions accurately.

RULES:
1. Answer based ONLY on the data provided. Never make up numbers.
2. Keep responses concise - this is Telegram, not email.
3. Use bullet points and formatting for readability.
4. When discussing money, always use $ formatting.
5. If asked about something not in the data, say so honestly.
6. Proactively flag concerns: overdue rentals, stale inventory, hot leads.
7. When giving recommendations, explain your reasoning briefly.
8. You can do math on the data (margins, averages, totals).

${businessData}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: question }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response. Try rephrasing your question.';
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

async function handleCommand(command: string, chatId: number): Promise<string | null> {
  switch (command) {
    case '/start':
      return `Hey! I'm <b>Divine</b>, your Triple J business assistant.

Ask me anything about the business:
- "How many vehicles do we have?"
- "What's our best margin vehicle?"
- "Show me overdue rentals"
- "Weekly sales summary"
- "Which leads need follow-up?"
- "What did we spend at auction?"

Or just ask in plain English. I have access to your full business data.`;

    case '/status':
    case '/dashboard': {
      const data = await getBusinessSnapshot();
      const lines = data.split('\n').slice(0, 3);
      // Quick summary
      const snap = await getBusinessSnapshot();
      return await askGemini('Give me a quick 5-line business status dashboard. Include: vehicles available, draft count, weekly sales, active rentals, and any urgent alerts.', snap);
    }

    case '/inventory':
      return await askGemini('List all available vehicles with prices, sorted by price. Keep it compact.', await getBusinessSnapshot());

    case '/drafts':
      return await askGemini('List all draft vehicles awaiting review. Include VIN and cost.', await getBusinessSnapshot());

    case '/margins':
      return await askGemini('Show me the top 5 vehicles by profit margin. Include cost, list price, and margin amount.', await getBusinessSnapshot());

    case '/leads':
      return await askGemini('Give me a lead summary: how many new, contacted, cold. Any hot leads I should focus on?', await getBusinessSnapshot());

    case '/rentals':
      return await askGemini('Show me all active and overdue rentals with details.', await getBusinessSnapshot());

    case '/help':
      return `<b>Divine Commands:</b>

/status - Quick business dashboard
/inventory - Available vehicles
/drafts - Draft vehicles to review
/margins - Top profit margin vehicles
/leads - Lead pipeline summary
/rentals - Active & overdue rentals
/help - This message

Or just type any question in plain English!`;

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main webhook handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('OK', { status: 200 });
  }

  try {
    const update = await req.json();
    const message = update.message;

    if (!message || !message.text || !message.chat) {
      return new Response('OK', { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    // Security: only respond to allowed chat
    if (String(chatId) !== String(ALLOWED_CHAT_ID)) {
      await sendReply(chatId, 'Unauthorized. This bot is private to Triple J Auto Investment.');
      return new Response('OK', { status: 200 });
    }

    // Show typing indicator
    await sendTyping(chatId);

    // Check for commands
    const commandText = text.split(' ')[0].toLowerCase().split('@')[0];
    const commandResponse = await handleCommand(commandText, chatId);
    if (commandResponse) {
      await sendReply(chatId, commandResponse);
      return new Response('OK', { status: 200 });
    }

    // Free-form question -> query business data + Gemini
    const businessData = await getBusinessSnapshot();
    const aiResponse = await askGemini(text, businessData);

    // Telegram has a 4096 char limit per message
    if (aiResponse.length > 4000) {
      const parts = aiResponse.match(/.{1,4000}/gs) || [aiResponse];
      for (const part of parts) {
        await sendReply(chatId, part);
      }
    } else {
      await sendReply(chatId, aiResponse);
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('[divine-telegram] Error:', err);
    return new Response('OK', { status: 200 });
  }
});
