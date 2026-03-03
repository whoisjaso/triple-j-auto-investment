import { createClient } from 'npm:@supabase/supabase-js@2';

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
// Gemini AI Content Generation (server-side — uses fetch, not browser SDK)
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
// Market Estimate + Slug (replicated from browser-side utils)
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
  // Target ~40-50% gross margin for BHPH (covers reconditioning buffer + profit)
  const markup = purchasePrice < 3000 ? 1.50 : 1.40;
  return Math.round((purchasePrice * markup) / 100) * 100;
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
    const suggestedPrice = suggestListingPrice(cost);
    const marketEst = estimateMarketValue(suggestedPrice, vinData.year, mileage);

    // -----------------------------------------------------------------------
    // 3. AI content generation (parallel)
    // -----------------------------------------------------------------------
    const [description, headline, story] = await Promise.all([
      generateDescription(vinData.make, vinData.model, vinData.year),
      generateHeadline(vinData.make, vinData.model, vinData.year, vinData.bodyClass),
      generateStory(vinData.make, vinData.model, vinData.year, mileage),
    ]);

    // -----------------------------------------------------------------------
    // 4. Insert as Draft
    // -----------------------------------------------------------------------
    const { data: inserted, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        vin: vin.toUpperCase(),
        make: vinData.make,
        model: vinData.model,
        year: vinData.year,
        mileage: mileage,
        price: suggestedPrice,
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
        market_estimate: marketEst,
        intake_source: source || 'manheim_email',
        purchase_price: cost,
        suggested_price: suggestedPrice,
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
    // 5. Generate slug (needs the ID from insert) and update
    // -----------------------------------------------------------------------
    const slug = generateSlug(vinData.year, vinData.make, vinData.model, inserted.id);
    await supabase.from('vehicles').update({ slug }).eq('id', inserted.id);

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
          suggestedPrice,
          marketEstimate: marketEst,
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
