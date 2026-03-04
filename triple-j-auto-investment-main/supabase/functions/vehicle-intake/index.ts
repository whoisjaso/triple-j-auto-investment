import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendTelegram } from '../_shared/telegram.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// ---------------------------------------------------------------------------
// NHTSA VIN Decode
// ---------------------------------------------------------------------------
interface VinData {
  make: string;
  model: string;
  year: number;
  bodyClass: string;
  trim: string;
  engineCylinders: string;
  fuelType: string;
  driveType: string;
  transmissionStyle: string;
}

async function decodeVin(vin: string): Promise<VinData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    const raw = data?.Results?.[0];
    if (!raw || !raw.Make) return null;

    return {
      make: raw.Make || '',
      model: raw.Model || '',
      year: parseInt(raw.ModelYear) || 0,
      bodyClass: raw.BodyClass || '',
      trim: raw.Trim || '',
      engineCylinders: raw.EngineCylinders || '',
      fuelType: raw.FuelTypePrimary || '',
      driveType: raw.DriveType || '',
      transmissionStyle: raw.TransmissionStyle || '',
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Gemini AI Content Generation
// ---------------------------------------------------------------------------
function cleanJson(text: string): string {
  return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
}

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function generateDescription(make: string, model: string, year: number): Promise<string> {
  const prompt = `Write a helpful, honest 2-3 sentence listing description (max 40 words) for a ${year} ${make} ${model} at Triple J Auto Investment, a family-friendly Houston dealership selling reliable pre-owned vehicles in the $3K-$8K range. Focus on practical benefits. Tone: warm, straightforward.`;
  try {
    return (await callGemini(prompt)).trim() || `${year} ${make} ${model} — reliable and ready for its next owner.`;
  } catch {
    return `${year} ${make} ${model} — reliable and ready for its next owner.`;
  }
}

async function generateHeadline(make: string, model: string, year: number, bodyClass: string): Promise<{ en: string; es: string }> {
  const fallback = { en: `${year} ${make} ${model}`, es: `${year} ${make} ${model}` };
  const prompt = `Generate a bilingual identity-first headline for a ${year} ${make} ${model} (${bodyClass}) at a Houston BHPH dealership. Format: "[Identity Label] | [2-3 punchy words]." Max 15 words. Return ONLY valid JSON: {"en": "...", "es": "..."}`;
  try {
    const raw = await callGemini(prompt);
    return JSON.parse(cleanJson(raw)) as { en: string; es: string };
  } catch {
    return fallback;
  }
}

async function generateStory(make: string, model: string, year: number, mileage: number): Promise<{ en: string; es: string }> {
  const fallback = {
    en: `This ${year} ${make} ${model} is available at Triple J Auto Investment. Contact us to learn more.`,
    es: `Este ${year} ${make} ${model} esta disponible en Triple J Auto Investment. Contactenos para mas informacion.`,
  };
  const prompt = `Write a bilingual 3-5 sentence honest vehicle story for a ${year} ${make} ${model} with ${mileage || 'unknown'} miles at Triple J Auto Investment, a Houston BHPH dealership. Include ideal owner, strengths, condition transparency. Do NOT fabricate history. Return ONLY valid JSON: {"en": "...", "es": "..."}`;
  try {
    const raw = await callGemini(prompt);
    return JSON.parse(cleanJson(raw)) as { en: string; es: string };
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// AI Deal Analysis (NEW)
// ---------------------------------------------------------------------------
interface DealAnalysis {
  marketValue: number;
  profitPotential: 'HIGH' | 'MEDIUM' | 'LOW';
  profitStars: string;
  riskFlags: string[];
  recommendation: string;
  suggestedListPrice: number;
  estimatedMargin: number;
}

async function analyzeDeal(
  vinData: VinData,
  purchasePrice: number,
  mileage: number,
  similarCount: number,
): Promise<DealAnalysis> {
  const fallback: DealAnalysis = {
    marketValue: estimateMarketValue(suggestListingPrice(purchasePrice), vinData.year, mileage),
    profitPotential: 'MEDIUM',
    profitStars: '\u2605\u2605\u2606',
    riskFlags: [],
    recommendation: 'Standard BHPH markup applies.',
    suggestedListPrice: suggestListingPrice(purchasePrice),
    estimatedMargin: suggestListingPrice(purchasePrice) - purchasePrice,
  };

  try {
    const prompt = `You are a used car dealer analyst for a Houston BHPH dealership (Triple J Auto Investment) that buys at auction and sells in the $3K-$12K range.

Analyze this vehicle acquisition:
- Vehicle: ${vinData.year} ${vinData.make} ${vinData.model} ${vinData.trim || ''}
- Body: ${vinData.bodyClass}, Engine: ${vinData.engineCylinders}cyl ${vinData.fuelType}, ${vinData.driveType}
- Purchase Price: $${purchasePrice}
- Mileage: ${mileage || 'Unknown'}
- Similar vehicles already in inventory: ${similarCount}

Return ONLY valid JSON (no markdown):
{
  "marketValue": <estimated retail market value in dollars>,
  "profitPotential": "HIGH" or "MEDIUM" or "LOW",
  "riskFlags": [<array of short risk strings, empty if none>],
  "recommendation": "<1-2 sentence dealer recommendation>",
  "suggestedListPrice": <your suggested listing price>
}

Consider: age, mileage, brand reliability, parts availability, Houston market demand, BHPH customer base, reconditioning costs (~$500-$1500 typical). HIGH = 50%+ margin after costs, MEDIUM = 25-50%, LOW = <25%.`;

    const raw = await callGemini(prompt);
    const parsed = JSON.parse(cleanJson(raw));

    const potential = parsed.profitPotential || 'MEDIUM';
    const stars = potential === 'HIGH' ? '\u2605\u2605\u2605' : potential === 'MEDIUM' ? '\u2605\u2605\u2606' : '\u2605\u2606\u2606';

    return {
      marketValue: parsed.marketValue || fallback.marketValue,
      profitPotential: potential,
      profitStars: stars,
      riskFlags: parsed.riskFlags || [],
      recommendation: parsed.recommendation || fallback.recommendation,
      suggestedListPrice: parsed.suggestedListPrice || fallback.suggestedListPrice,
      estimatedMargin: (parsed.suggestedListPrice || fallback.suggestedListPrice) - purchasePrice,
    };
  } catch (err) {
    console.error('[vehicle-intake] AI deal analysis failed, using fallback:', err);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Market Estimate + Slug
// ---------------------------------------------------------------------------
function estimateMarketValue(price: number, year: number, mileage: number): number {
  const age = new Date().getFullYear() - year;
  let multiplier = 1.20;
  if (age > 10) multiplier = 1.12;
  else if (age > 7) multiplier = 1.15;

  let estimate = price * multiplier;
  if (mileage > 150000) estimate = price * 1.10;
  else if (mileage > 120000) estimate *= 0.95;

  return Math.round(estimate / 100) * 100;
}

function generateSlug(year: number, make: string, model: string, id: string): string {
  const base = `${year}-${make}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base}-${id.slice(0, 6)}`;
}

function suggestListingPrice(purchasePrice: number): number {
  const markup = purchasePrice < 3000 ? 1.50 : 1.40;
  return Math.round((purchasePrice * markup) / 100) * 100;
}

// ---------------------------------------------------------------------------
// Telegram Notification
// ---------------------------------------------------------------------------
async function notifyNewVehicle(
  vinData: VinData,
  vin: string,
  cost: number,
  mileage: number,
  analysis: DealAnalysis,
  source: string,
  similarCount: number,
): Promise<void> {
  const flags = analysis.riskFlags.length > 0
    ? analysis.riskFlags.map(f => `\u26A0\uFE0F ${f}`).join('\n')
    : '\u2705 None';

  const similarNote = similarCount > 0
    ? `\n\u26A0\uFE0F <b>Note:</b> You have ${similarCount} similar ${vinData.make} ${vinData.model}(s) in inventory`
    : '';

  const message = `\uD83D\uDE97 <b>NEW VEHICLE INTAKE</b>

<b>${vinData.year} ${vinData.make} ${vinData.model}${vinData.trim ? ' ' + vinData.trim : ''}</b>
VIN: <code>${vin}</code>
${vinData.bodyClass} \u2022 ${vinData.engineCylinders}cyl ${vinData.fuelType} \u2022 ${vinData.driveType}
${mileage > 0 ? `Mileage: ${mileage.toLocaleString()} mi` : 'Mileage: Unknown'}
Source: ${source === 'manheim_email' ? 'Manheim Auction' : source}

\uD83D\uDCB0 <b>DEAL ANALYSIS (AI)</b>
\u2022 Purchase: $${cost.toLocaleString()}
\u2022 Market Value: ~$${analysis.marketValue.toLocaleString()}
\u2022 Suggested List: $${analysis.suggestedListPrice.toLocaleString()}
\u2022 Profit Potential: ${analysis.profitStars} ${analysis.profitPotential}
\u2022 Est. Margin: $${analysis.estimatedMargin.toLocaleString()}

\uD83D\uDCA1 <b>AI Recommendation:</b>
${analysis.recommendation}

\u26A0\uFE0F <b>Risk Flags:</b>
${flags}${similarNote}

\uD83D\uDCCB Status: <b>Draft</b> — Review in admin panel`;

  try {
    await sendTelegram(message, 'HTML');
  } catch (err) {
    console.error('[vehicle-intake] Telegram notification failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  try {
    const { vin, purchasePrice, source, mileage: inputMileage } = await req.json();

    if (!vin || typeof vin !== 'string' || vin.length !== 17) {
      return new Response(
        JSON.stringify({ error: 'Valid 17-character VIN required' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // -----------------------------------------------------------------------
    // 1. Check for duplicate VIN
    // -----------------------------------------------------------------------
    const { data: existing } = await supabase
      .from('vehicles')
      .select('id')
      .eq('vin', vin.toUpperCase())
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Vehicle with this VIN already exists', vehicleId: existing.id }),
        { status: 409, headers: CORS_HEADERS }
      );
    }

    // -----------------------------------------------------------------------
    // 2. NHTSA VIN decode
    // -----------------------------------------------------------------------
    const vinData = await decodeVin(vin);
    if (!vinData || !vinData.make) {
      return new Response(
        JSON.stringify({ error: 'VIN decode failed — could not identify vehicle' }),
        { status: 422, headers: CORS_HEADERS }
      );
    }

    const cost = parseFloat(String(purchasePrice)) || 0;
    const mileage = parseInt(String(inputMileage)) || 0;

    // -----------------------------------------------------------------------
    // 3. Check for similar vehicles already in inventory
    // -----------------------------------------------------------------------
    const { count: similarCount } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('make', vinData.make)
      .eq('model', vinData.model)
      .in('status', ['Available', 'Draft']);

    // -----------------------------------------------------------------------
    // 4. AI content generation + deal analysis (parallel)
    // -----------------------------------------------------------------------
    const [description, headline, story, dealAnalysis] = await Promise.all([
      generateDescription(vinData.make, vinData.model, vinData.year),
      generateHeadline(vinData.make, vinData.model, vinData.year, vinData.bodyClass),
      generateStory(vinData.make, vinData.model, vinData.year, mileage),
      analyzeDeal(vinData, cost, mileage, similarCount || 0),
    ]);

    // -----------------------------------------------------------------------
    // 5. Insert as Draft
    // -----------------------------------------------------------------------
    const { data: inserted, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        vin: vin.toUpperCase(),
        make: vinData.make,
        model: vinData.model,
        year: vinData.year,
        mileage: mileage,
        price: dealAnalysis.suggestedListPrice,
        cost: cost,
        status: 'Draft',
        description: description,
        image_url: '',
        gallery: [],
        diagnostics: [],
        date_added: new Date().toISOString().split('T')[0],
        identity_headline: headline.en,
        identity_headline_es: headline.es,
        vehicle_story: story.en,
        vehicle_story_es: story.es,
        is_verified: false,
        market_estimate: dealAnalysis.marketValue,
        intake_source: source || 'manheim_email',
        purchase_price: cost,
        suggested_price: dealAnalysis.suggestedListPrice,
        intake_at: new Date().toISOString(),
      })
      .select('id, slug')
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: `Insert failed: ${insertError.message}` }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // -----------------------------------------------------------------------
    // 6. Generate slug and update
    // -----------------------------------------------------------------------
    const slug = generateSlug(vinData.year, vinData.make, vinData.model, inserted.id);
    await supabase.from('vehicles').update({ slug }).eq('id', inserted.id);

    // -----------------------------------------------------------------------
    // 7. Telegram notification (fire-and-forget)
    // -----------------------------------------------------------------------
    notifyNewVehicle(vinData, vin.toUpperCase(), cost, mileage, dealAnalysis, source || 'manheim_email', similarCount || 0);

    return new Response(
      JSON.stringify({
        success: true,
        vehicleId: inserted.id,
        slug,
        vehicle: {
          vin: vin.toUpperCase(),
          year: vinData.year,
          make: vinData.make,
          model: vinData.model,
          suggestedPrice: dealAnalysis.suggestedListPrice,
          marketEstimate: dealAnalysis.marketValue,
        },
        dealAnalysis: {
          profitPotential: dealAnalysis.profitPotential,
          marketValue: dealAnalysis.marketValue,
          estimatedMargin: dealAnalysis.estimatedMargin,
          riskFlags: dealAnalysis.riskFlags,
          recommendation: dealAnalysis.recommendation,
        },
      }),
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
});
