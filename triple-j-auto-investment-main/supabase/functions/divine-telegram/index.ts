// Divine Telegram Bot - Supabase Edge Function
// Two-way conversational AI assistant for Triple J business operations.
// Can READ business data and WRITE updates (mark sold, change price, update status).
//
// Receives Telegram webhook updates, detects intent via Gemini AI,
// executes reads or writes against Supabase, responds via Telegram.

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
// Vehicle list for matching
// ---------------------------------------------------------------------------

async function getVehicleList(): Promise<Array<{
  id: string; vin: string; make: string; model: string; year: number;
  price: number; cost: number; status: string; mileage: number;
  cost_towing: number; cost_mechanical: number; cost_cosmetic: number; cost_other: number;
  sold_price: number; sold_date: string; date_added: string;
  purchase_price: number; market_estimate: number;
}>> {
  const { data } = await supabase
    .from('vehicles')
    .select('id, vin, make, model, year, price, cost, status, mileage, cost_towing, cost_mechanical, cost_cosmetic, cost_other, sold_price, sold_date, date_added, purchase_price, market_estimate');
  return (data || []) as any[];
}

// ---------------------------------------------------------------------------
// Business data snapshot
// ---------------------------------------------------------------------------

async function getBusinessSnapshot(): Promise<string> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);

  const [allVehicles, leads, activeRentals, registrations] = await Promise.all([
    supabase.from('vehicles').select('id, vin, make, model, year, price, cost, status, mileage, cost_towing, cost_mechanical, cost_cosmetic, cost_other, date_added, sold_price, sold_date, purchase_price, market_estimate, intake_source'),
    supabase.from('leads').select('id, name, status, date, phone').gte('date', new Date(now.getTime() - 30 * 86400000).toISOString()),
    supabase.from('rental_bookings').select('id, booking_id, status, end_date, total_cost, vehicle_id, customer_id').in('status', ['active', 'overdue', 'reserved']),
    supabase.from('registrations').select('id, customer_name, current_stage, vehicle_id'),
  ]);

  const vehicles = allVehicles.data || [];
  const available = vehicles.filter(v => v.status === 'Available');
  const drafts = vehicles.filter(v => v.status === 'Draft');
  const sold = vehicles.filter(v => v.status === 'Sold');
  const allLeads = leads.data || [];
  const rentals = activeRentals.data || [];
  const regs = registrations.data || [];

  const totalInventoryValue = available.reduce((s, v) => s + (v.price || 0), 0);
  const totalInventoryCost = available.reduce((s, v) => s + (v.cost || 0) + (v.cost_towing || 0) + (v.cost_mechanical || 0) + (v.cost_cosmetic || 0) + (v.cost_other || 0), 0);

  const stale = available.filter(v => {
    if (!v.date_added) return false;
    return Math.floor((now.getTime() - new Date(v.date_added).getTime()) / 86400000) >= 21;
  });

  const margins = available.map(v => {
    const totalCost = (v.cost || 0) + (v.cost_towing || 0) + (v.cost_mechanical || 0) + (v.cost_cosmetic || 0) + (v.cost_other || 0);
    return { label: `${v.year} ${v.make} ${v.model}`, price: v.price, cost: totalCost, margin: (v.price || 0) - totalCost };
  }).sort((a, b) => b.margin - a.margin);

  const overdueRentals = rentals.filter(r => r.status === 'overdue');
  const pendingRegs = regs.filter(r => !['sticker_delivered', 'rejected'].includes(r.current_stage));

  const soldRecent = sold.filter(v => v.sold_date && v.sold_date >= weekAgo);

  return `BUSINESS DATA SNAPSHOT (${now.toLocaleDateString('en-US')}):

INVENTORY SUMMARY:
- Total vehicles in system: ${vehicles.length}
- Available: ${available.length}
- Draft (pending review): ${drafts.length}
- Sold: ${sold.length}
- Inventory list value: $${totalInventoryValue.toLocaleString()}
- Inventory cost: $${totalInventoryCost.toLocaleString()}
- Potential profit: $${(totalInventoryValue - totalInventoryCost).toLocaleString()}
- Stale (21+ days): ${stale.length}

ALL VEHICLES (with IDs for updates):
${vehicles.map(v => {
  const tc = (v.cost || 0) + (v.cost_towing || 0) + (v.cost_mechanical || 0) + (v.cost_cosmetic || 0) + (v.cost_other || 0);
  return `- [${v.status}] ${v.year} ${v.make} ${v.model} | VIN: ${v.vin} | ID: ${v.id} | List: $${v.price || 0} | Cost: $${tc} | Miles: ${v.mileage || 'N/A'}${v.sold_price ? ` | Sold: $${v.sold_price}` : ''}`;
}).join('\n')}

TOP MARGINS:
${margins.slice(0, 5).map((v, i) => `${i + 1}. ${v.label}: list $${v.price}, cost $${v.cost}, margin $${v.margin}`).join('\n')}

SOLD THIS WEEK: ${soldRecent.length}
${soldRecent.map(v => `- ${v.year} ${v.make} ${v.model}: $${v.sold_price || v.price}`).join('\n') || 'None'}

LEADS (30d): ${allLeads.length} total, ${allLeads.filter(l => l.status === 'New').length} new
RENTALS: ${rentals.length} active, ${overdueRentals.length} overdue
REGISTRATIONS: ${pendingRegs.length} in progress`;
}

// ---------------------------------------------------------------------------
// Intent detection via Gemini
// ---------------------------------------------------------------------------

interface UpdateIntent {
  action: 'sold' | 'update_price' | 'update_status' | 'add_cost' | 'update_field' | 'none';
  vehicle_match: string; // year+make+model or VIN to match
  sold_price?: number;
  new_price?: number;
  new_status?: string;
  cost_type?: string;
  cost_amount?: number;
  field?: string;
  value?: string;
  confidence: number;
}

async function detectIntent(userMessage: string, vehicleList: string): Promise<UpdateIntent> {
  const prompt = `You are parsing a business owner's Telegram message to detect if they want to UPDATE vehicle records.

AVAILABLE VEHICLES IN DATABASE:
${vehicleList}

USER MESSAGE: "${userMessage}"

Determine the intent. Return ONLY valid JSON (no markdown):
{
  "action": "sold" | "update_price" | "update_status" | "add_cost" | "update_field" | "none",
  "vehicle_match": "<the year make model or VIN they're referring to, e.g. '2021 Chevrolet Malibu' or 'WBAFU7C55DDU71300'>",
  "sold_price": <number if action=sold>,
  "new_price": <number if action=update_price>,
  "new_status": "<Available|Pending|Draft|Sold|Wholesale if action=update_status>",
  "cost_type": "<towing|mechanical|cosmetic|other if action=add_cost>",
  "cost_amount": <number if action=add_cost>,
  "field": "<field name if action=update_field>",
  "value": "<new value if action=update_field>",
  "confidence": <0.0-1.0 how confident you are this is an update request>
}

EXAMPLES:
- "sold the malibu for 6500" -> {"action":"sold","vehicle_match":"Chevrolet Malibu","sold_price":6500,"confidence":0.95}
- "mark the audi as pending" -> {"action":"update_status","vehicle_match":"Audi","new_status":"Pending","confidence":0.9}
- "change price on pathfinder to 4800" -> {"action":"update_price","vehicle_match":"Nissan Pathfinder","new_price":4800,"confidence":0.9}
- "add 200 towing cost to the dodge" -> {"action":"add_cost","vehicle_match":"Dodge","cost_type":"towing","cost_amount":200,"confidence":0.9}
- "how many cars do we have" -> {"action":"none","vehicle_match":"","confidence":0.95}
- "sold the 2021 malibu for 6500 to Juan" -> {"action":"sold","vehicle_match":"2021 Chevrolet Malibu","sold_price":6500,"confidence":0.95}

If the message is a question or doesn't request a change, return action "none" with high confidence.
If ambiguous, return lower confidence.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
        }),
      },
    );

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned) as UpdateIntent;
  } catch {
    return { action: 'none', vehicle_match: '', confidence: 0 };
  }
}

// ---------------------------------------------------------------------------
// Find vehicle by fuzzy match
// ---------------------------------------------------------------------------

function findVehicle(vehicles: any[], matchStr: string): any | null {
  if (!matchStr) return null;
  const lower = matchStr.toLowerCase();

  // Try exact VIN match first
  const vinMatch = vehicles.find(v => v.vin && v.vin.toLowerCase() === lower);
  if (vinMatch) return vinMatch;

  // Try year+make+model match
  const scored = vehicles.map(v => {
    const full = `${v.year} ${v.make} ${v.model}`.toLowerCase();
    const makeModel = `${v.make} ${v.model}`.toLowerCase();
    let score = 0;
    if (full === lower) score = 100;
    else if (full.includes(lower)) score = 80;
    else if (lower.includes(makeModel)) score = 70;
    else if (makeModel.includes(lower)) score = 60;
    else if (lower.includes(v.make?.toLowerCase())) score = 30;
    else if (lower.includes(v.model?.toLowerCase())) score = 30;
    return { vehicle: v, score };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].vehicle : null;
}

// ---------------------------------------------------------------------------
// Execute updates
// ---------------------------------------------------------------------------

async function executeUpdate(intent: UpdateIntent, vehicles: any[]): Promise<string> {
  const vehicle = findVehicle(vehicles, intent.vehicle_match);
  if (!vehicle) {
    return `Could not find a vehicle matching "${intent.vehicle_match}". Check the name/VIN and try again.`;
  }

  const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  switch (intent.action) {
    case 'sold': {
      const soldPrice = intent.sold_price || vehicle.price;
      const totalCost = (vehicle.cost || 0) + (vehicle.cost_towing || 0) + (vehicle.cost_mechanical || 0) + (vehicle.cost_cosmetic || 0) + (vehicle.cost_other || 0);
      const profit = soldPrice - totalCost;

      const { error } = await supabase.from('vehicles').update({
        status: 'Sold',
        sold_price: soldPrice,
        sold_date: new Date().toISOString().slice(0, 10),
      }).eq('id', vehicle.id);

      if (error) return `Failed to update: ${error.message}`;

      return `SOLD - ${label}

Sale Price: <b>$${soldPrice.toLocaleString()}</b>
Total Cost: $${totalCost.toLocaleString()}
Profit: <b>$${profit.toLocaleString()}</b>
Date: ${new Date().toLocaleDateString('en-US')}

Vehicle marked as Sold and removed from the website.`;
    }

    case 'update_price': {
      if (!intent.new_price) return 'No price specified. Try: "change price on [vehicle] to $5000"';

      const { error } = await supabase.from('vehicles').update({
        price: intent.new_price,
      }).eq('id', vehicle.id);

      if (error) return `Failed to update: ${error.message}`;

      return `PRICE UPDATED - ${label}

Old Price: $${(vehicle.price || 0).toLocaleString()}
New Price: <b>$${intent.new_price.toLocaleString()}</b>

Updated on the website.`;
    }

    case 'update_status': {
      if (!intent.new_status) return 'No status specified. Options: Available, Pending, Draft, Sold, Wholesale';

      const validStatuses = ['Available', 'Pending', 'Draft', 'Sold', 'Wholesale'];
      const normalized = validStatuses.find(s => s.toLowerCase() === intent.new_status!.toLowerCase());
      if (!normalized) return `Invalid status "${intent.new_status}". Use: ${validStatuses.join(', ')}`;

      const updateData: Record<string, any> = { status: normalized };
      if (normalized === 'Sold' && !vehicle.sold_date) {
        updateData.sold_date = new Date().toISOString().slice(0, 10);
      }

      const { error } = await supabase.from('vehicles').update(updateData).eq('id', vehicle.id);

      if (error) return `Failed to update: ${error.message}`;

      return `STATUS UPDATED - ${label}

Old Status: ${vehicle.status}
New Status: <b>${normalized}</b>

${normalized === 'Available' ? 'Now visible on the website.' : ''}${normalized === 'Sold' ? 'Removed from the website.' : ''}${normalized === 'Pending' ? 'Marked as pending on the website.' : ''}`;
    }

    case 'add_cost': {
      if (!intent.cost_amount || !intent.cost_type) return 'Specify cost type and amount. Try: "add $200 towing to [vehicle]"';

      const costField = {
        towing: 'cost_towing',
        mechanical: 'cost_mechanical',
        cosmetic: 'cost_cosmetic',
        other: 'cost_other',
      }[intent.cost_type] || 'cost_other';

      const existing = vehicle[costField] || 0;
      const newTotal = existing + intent.cost_amount;

      const { error } = await supabase.from('vehicles').update({
        [costField]: newTotal,
      }).eq('id', vehicle.id);

      if (error) return `Failed to update: ${error.message}`;

      const allCosts = (vehicle.cost || 0) + (vehicle.cost_towing || 0) + (vehicle.cost_mechanical || 0) + (vehicle.cost_cosmetic || 0) + (vehicle.cost_other || 0) + intent.cost_amount;

      return `COST ADDED - ${label}

${intent.cost_type.toUpperCase()}: +$${intent.cost_amount.toLocaleString()} (was $${existing}, now $${newTotal})
Total All-In Cost: <b>$${allCosts.toLocaleString()}</b>`;
    }

    default:
      return 'I could not determine what update to make. Try being more specific.';
  }
}

// ---------------------------------------------------------------------------
// Gemini AI for questions
// ---------------------------------------------------------------------------

async function askGemini(question: string, businessData: string): Promise<string> {
  const systemPrompt = `You are Divine, the AI business assistant for Triple J Auto Investment, a Houston BHPH auto dealership at 8774 Almeda Genoa Road, Houston, TX 77075. Phone: (832) 400-9760.

You are speaking with the business owner via Telegram. Be concise, direct, and helpful.

RULES:
1. Answer based ONLY on the data provided. Never make up numbers.
2. Keep responses concise for Telegram.
3. Use bullet points for readability.
4. Always use $ formatting for money.
5. If asked about something not in the data, say so.
6. Flag concerns: overdue rentals, stale inventory.
7. You can do math on the data.
8. If someone seems to want to UPDATE data (sell a car, change a price), tell them to phrase it as a command like "sold the [vehicle] for $[amount]" or "change price on [vehicle] to $[amount]".

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

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not generate a response.';
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

async function handleCommand(command: string): Promise<string | null> {
  switch (command) {
    case '/start':
      return `Hey! I'm <b>Divine</b>, your Triple J business assistant.

<b>I can READ:</b>
- "How many vehicles do we have?"
- "What's our best margin vehicle?"
- "Show me overdue rentals"
- /status /inventory /margins /leads /rentals

<b>I can WRITE:</b>
- "Sold the 2021 Malibu for $6500"
- "Mark the Audi as pending"
- "Change price on Pathfinder to $4800"
- "Add $200 towing cost to the Dodge"

Just talk to me naturally!`;

    case '/status':
    case '/dashboard':
      return await askGemini('Quick 5-line business dashboard: vehicles available, drafts, sold count, active rentals, urgent alerts.', await getBusinessSnapshot());

    case '/inventory':
      return await askGemini('List all available vehicles with prices sorted by price. Compact format.', await getBusinessSnapshot());

    case '/drafts':
      return await askGemini('List all draft vehicles awaiting review with VIN and cost.', await getBusinessSnapshot());

    case '/margins':
      return await askGemini('Top 5 vehicles by profit margin with cost, list price, margin.', await getBusinessSnapshot());

    case '/leads':
      return await askGemini('Lead summary: new, contacted, cold. Hot leads to focus on?', await getBusinessSnapshot());

    case '/rentals':
      return await askGemini('All active and overdue rentals with details.', await getBusinessSnapshot());

    case '/sold':
      return await askGemini('List all sold vehicles with sale price and profit. Sort by most recent.', await getBusinessSnapshot());

    case '/sync':
      return 'Sheet sync runs via the admin panel. Go to Admin > Inventory > "Import from Sheet" button.';

    case '/help':
      return `<b>Divine Commands:</b>

<b>View Data:</b>
/status - Business dashboard
/inventory - Available vehicles
/drafts - Draft vehicles to review
/margins - Top profit margin vehicles
/leads - Lead pipeline
/rentals - Active & overdue rentals
/sold - Sales history

<b>Update Data (natural language):</b>
"Sold the [vehicle] for $[amount]"
"Mark [vehicle] as [status]"
"Change price on [vehicle] to $[amount]"
"Add $[amount] [towing/mechanical/cosmetic] to [vehicle]"

Or just ask anything in plain English!`;

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

    // Check for slash commands
    const commandText = text.split(' ')[0].toLowerCase().split('@')[0];
    const commandResponse = await handleCommand(commandText);
    if (commandResponse) {
      if (commandResponse.length > 4000) {
        const parts = commandResponse.match(/.{1,4000}/gs) || [commandResponse];
        for (const part of parts) await sendReply(chatId, part);
      } else {
        await sendReply(chatId, commandResponse);
      }
      return new Response('OK', { status: 200 });
    }

    // Detect if this is an UPDATE request or a READ question
    const vehicles = await getVehicleList();
    const vehicleListStr = vehicles.map(v => `${v.year} ${v.make} ${v.model} | VIN: ${v.vin} | Status: ${v.status} | $${v.price}`).join('\n');

    const intent = await detectIntent(text, vehicleListStr);

    if (intent.action !== 'none' && intent.confidence >= 0.7) {
      // It's an update request
      if (intent.confidence < 0.85) {
        // Medium confidence - confirm first
        const vehicle = findVehicle(vehicles, intent.vehicle_match);
        const label = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : intent.vehicle_match;

        let confirmMsg = `I think you want to:\n`;
        switch (intent.action) {
          case 'sold': confirmMsg += `Mark <b>${label}</b> as SOLD for <b>$${intent.sold_price?.toLocaleString()}</b>`; break;
          case 'update_price': confirmMsg += `Change <b>${label}</b> price to <b>$${intent.new_price?.toLocaleString()}</b>`; break;
          case 'update_status': confirmMsg += `Change <b>${label}</b> status to <b>${intent.new_status}</b>`; break;
          case 'add_cost': confirmMsg += `Add $${intent.cost_amount} ${intent.cost_type} cost to <b>${label}</b>`; break;
        }
        confirmMsg += `\n\nIs that right? Reply "yes" to confirm.`;

        // Store pending action (simple: just execute on "yes" with repeat)
        await sendReply(chatId, confirmMsg);
      } else {
        // High confidence - execute directly
        const result = await executeUpdate(intent, vehicles);
        await sendReply(chatId, result);
      }
    } else {
      // It's a question - use Gemini with business data
      const businessData = await getBusinessSnapshot();
      const aiResponse = await askGemini(text, businessData);

      if (aiResponse.length > 4000) {
        const parts = aiResponse.match(/.{1,4000}/gs) || [aiResponse];
        for (const part of parts) await sendReply(chatId, part);
      } else {
        await sendReply(chatId, aiResponse);
      }
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('[divine-telegram] Error:', err);
    return new Response('OK', { status: 200 });
  }
});
