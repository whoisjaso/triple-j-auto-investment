// Divine Chat - Supabase Edge Function
// Gemini AI proxy for the customer-facing chat widget.
// Protects GEMINI_API_KEY server-side. Streams responses with profile-adapted
// system prompts using the PCP (Perception, Context, Permission) framework.
//
// POST /functions/v1/divine-chat
// Body: { message, history, vehicleContext, language, identifiedProfile, sessionId }

import { GoogleGenAI } from 'npm:@google/genai@^1.30.0';

// ================================================================
// CORS
// ================================================================

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ================================================================
// RATE LIMITING (per-instance, in-memory)
// ================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10_000; // 10 seconds
const RATE_LIMIT_MAX = 3; // max 3 messages per 10 seconds per session

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();

  // Cleanup expired entries (every check)
  for (const [key, entry] of rateLimitMap) {
    if (entry.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(sessionId);

  if (!entry || entry.resetAt <= now) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

// ================================================================
// SYSTEM PROMPT BUILDER
// ================================================================

function buildPCPGuidance(profile: string): string {
  const pcpBase = `
CLOSING APPROACH - PCP (Perception, Context, Permission):
When the visitor shows interest, follow this natural sequence:

1. PERCEPTION: Reflect back what you understand about their situation.
   "It sounds like you're looking for [their stated need]..."
   DO NOT assume. Use THEIR words.

2. CONTEXT: Connect the vehicle to their situation.
   "This [vehicle] is a good fit because [specific reasons matching their need]..."
   Be specific. Use the vehicle data provided.

3. PERMISSION: Make the next step feel natural and pressure-free.
   "Many people in a similar situation find it helpful to [schedule a visit / call us].
   Would you like me to help with that?"
   NEVER pressure. NEVER use urgency tactics. The permission must feel genuine.
`;

  const profileAdaptation: Record<string, string> = {
    provider: `
PROFILE: PROVIDER (Family Decision-Maker)
- Emphasize: reliability, safety, value for the family
- Speak to: their responsibility and good judgment
- Permission frame: "You're making a smart choice for your family"
- Avoid: anything that sounds risky or impulsive`,
    skeptic: `
PROFILE: SKEPTIC (Trust-Building Required)
- Emphasize: transparency, honesty, AS-IS disclosure, inspection details
- Speak to: their intelligence in doing due diligence
- Permission frame: "We appreciate customers who ask tough questions"
- Avoid: anything that sounds like a sales pitch`,
    first_timer: `
PROFILE: FIRST-TIMER (New to Buying)
- Emphasize: simplicity, guidance, patience, education
- Speak to: the excitement of getting their first vehicle
- Permission frame: "Everyone starts somewhere, and you're doing great"
- Avoid: jargon, complex financing terms, overwhelming details`,
    struggler: `
PROFILE: STRUGGLER (Urgent Need, Limited Budget)
- Emphasize: practical solutions, flexible payments, understanding
- Speak to: their situation with empathy, not pity
- Permission frame: "We work with families in all kinds of situations"
- Avoid: anything condescending, upselling, suggesting they can't afford it`,
    unidentified: `
PROFILE: Not yet identified. Ask open-ended questions to understand their needs.
Focus on: "What brings you here today?" or "Tell me about what you're looking for."`,
  };

  return pcpBase + (profileAdaptation[profile] || profileAdaptation.unidentified);
}

function buildSystemPrompt(
  vehicle: Record<string, unknown>,
  language: string,
  profile: string,
): string {
  const langInstruction = language === 'es'
    ? 'RESPOND ENTIRELY IN SPANISH. The customer speaks Spanish.'
    : 'Respond in English.';

  const price = typeof vehicle.price === 'number'
    ? `$${vehicle.price.toLocaleString()}`
    : 'Contact for pricing';

  const mileage = typeof vehicle.mileage === 'number'
    ? `${vehicle.mileage.toLocaleString()} miles`
    : 'N/A';

  const diagnostics = Array.isArray(vehicle.diagnostics) && vehicle.diagnostics.length > 0
    ? vehicle.diagnostics.join(', ')
    : 'No issues reported, vehicle inspected';

  const rentalInfo =
    vehicle.listingType === 'rental_only' || vehicle.listingType === 'both'
      ? `\n- Also available for rent: $${vehicle.dailyRate}/day, $${vehicle.weeklyRate}/week`
      : '';

  return `You are the Triple J Auto Investment virtual assistant on the dealership website.
${langInstruction}

ABOUT THE DEALERSHIP:
- Triple J Auto Investment, 8774 Almeda Genoa Road, Houston, TX 77075
- Phone: (832) 400-9760
- Hours: Mon-Sat 9AM-6PM, Closed Sunday
- Buy Here Pay Here (BHPH) dealership serving Houston working families
- Price range: $3,000-$8,000 pre-owned vehicles
- Honest, transparent, no-pressure approach
- Dealer License: P171632

VEHICLE THE CUSTOMER IS VIEWING:
- ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}
- Price: ${price}
- Mileage: ${mileage}
- Status: ${vehicle.status || 'Available'}
- Condition Notes: ${diagnostics}
- Description: ${vehicle.description || 'Contact us for details'}${rentalInfo}

RULES:
1. ONLY discuss information you've been given above. NEVER invent features, history, or claims.
2. If asked something you don't know, say "I don't have that specific detail, but our team can help! Call (832) 400-9760 or I can help you schedule a visit."
3. Keep responses concise (2-4 sentences max). This is a chat, not an essay.
4. Be warm, helpful, and honest -- like a trusted neighbor.
5. If the customer mentions diagnostics/issues, acknowledge them honestly.
6. All vehicles are sold AS-IS. Be upfront about this when relevant.
7. Guide toward action: scheduling a visit, calling, or asking more questions.
8. NEVER discuss other dealerships, competitors, or vehicles not in our inventory.
9. NEVER make up financing terms. Say "We offer in-house financing. Our team can discuss specific terms when you visit."

${buildPCPGuidance(profile)}`;
}

// ================================================================
// MAIN HANDLER
// ================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Check API key
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured' }),
      { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await req.json();
    const { message, history, vehicleContext, language, identifiedProfile, sessionId } = body;

    // Validate message
    if (!message || typeof message !== 'string' || message.length < 1 || message.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Invalid message' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Rate limiting
    const rateLimitKey = sessionId || req.headers.get('x-client-info') || 'anonymous';
    if (isRateLimited(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: 'Too many messages. Please wait a moment.' }),
        { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Cap history to last 20 messages to prevent token abuse
    const cappedHistory = Array.isArray(history) ? history.slice(-20) : [];

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      vehicleContext || {},
      language || 'en',
      identifiedProfile || 'unidentified',
    );

    // Build contents array (history + new message)
    const contents = [
      ...cappedHistory.map((m: Record<string, unknown>) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.text || '').slice(0, 500) }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    // Call Gemini with streaming
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });

    // Stream response back to client
    const encoder = new TextEncoder();
    const responseBody = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
        } catch {
          // Stream error: send fallback message
          controller.enqueue(
            encoder.encode('\n\n[Chat temporarily unavailable. Call (832) 400-9760]'),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(responseBody, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Divine chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
