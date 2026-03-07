
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY not found in environment");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/** Strip markdown code fences that Gemini sometimes wraps around JSON responses. */
function cleanJsonResponse(text: string): string {
  return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
}

export const generateVehicleDescription = async (make: string, model: string, year: number, diagnostics: string[] = []): Promise<string> => {
  const ai = getClient();
  if (!ai) return "System Error: AI Client not initialized.";

  try {
    const diagContext = diagnostics.length > 0
      ? `CONDITION NOTES (mention honestly): ${diagnostics.join(', ')}`
      : "CONDITION: No major issues reported. Vehicle has been inspected.";

    const prompt = `
      Task: Write a helpful, honest description for a ${year} ${make} ${model} listing at Triple J Auto Investment, a family-friendly Houston dealership.

      ABOUT THE DEALERSHIP:
      - We sell reliable pre-owned vehicles in the $3K-$8K price range for working families.
      - We value honesty, transparency, and building trust with our community.
      - We are straightforward -- no pressure, no gimmicks.

      VEHICLE CONDITION:
      ${diagContext}

      INSTRUCTIONS:
      1. Focus on practical benefits: fuel economy, reliability, space, safety features, value.
      2. If there are condition issues, mention them honestly but briefly. Do not hide problems.
      3. If the vehicle is in good shape, highlight what makes it a solid choice.
      4. Length: 2-3 sentences. Maximum 40 words.
      5. Tone: Warm, helpful, and straightforward. Like a trusted neighbor giving advice.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, 
      }
    });

    return response.text || "Description unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Description generation failed.";
  }
};

export const analyzeFinancialPerformance = async (financialData: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Financial AI unavailable.";

  try {
    const prompt = `
      You are the "Sovereign CFO" (Chief Financial Officer) for Triple J Auto Investment.
      Your goal is to maximize Net Yield and eliminate inefficiency with ruthless precision.

      DATA PROVIDED (Ledger of Sold Assets):
      ${financialData}

      YOUR MISSION (ULTRA-THINK MODE):
      1. **Forensic Cost Vector Audit**: Analyze Acquisition vs Towing vs Mechanical vs Cosmetic vs Other.
      2. **Pattern Recognition**: Identify EXACTLY why we lost money or had low margins on specific units. (e.g., "Mechanical overruns on European models are destroying 15% of net profit").
      3. **Profitability Correlations**: Which specific models or strategies (e.g. "Quick flips", "high mileage") are yielding the highest ROI?
      4. **Strategic Directive**: Give me a bulletproof, high-level command to fix the leak.

      OUTPUT FORMAT (Markdown):
      ### PROFIT VECTOR ANALYSIS
      (Analyze what is working. Be specific about Make/Model/Year or Strategy. Mention ROI.)

      ### EFFICIENCY LEAKAGE (CRITICAL)
      (Identify the specific expense column—Towing, Mech, or Cosmetic—that is statistically too high. Name the specific cars that dragged us down and the specific dollar amount lost to friction.)

      ### TACTICAL DIRECTIVE
      (1 ruthless, bold command to the owner. Max 20 words. e.g., "STOP BUYING HIGH-MILEAGE RANGE ROVERS. MECHANICAL COSTS ARE UNSUSTAINABLE.")

      IMPORTANT: Do NOT use any emojis or special characters in your response. Keep it clean text and markdown only.
      
      Tone: Cold, Mathematical, High-Frequency Trading style. No fluff. Pure Signal.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4096 }, // Increased for deeper analysis
      }
    });

    return response.text || "Financial analysis unavailable.";
  } catch (error) {
    console.error("Financial Analysis Error", error);
    return "Unable to compute financial strategy.";
  }
};

export const generateIdentityHeadline = async (
  make: string,
  model: string,
  year: number,
  bodyType?: string,
  diagnostics: string[] = []
): Promise<{ en: string; es: string }> => {
  const fallback = { en: `${year} ${make} ${model}`, es: `${year} ${make} ${model}` };
  const ai = getClient();
  if (!ai) return fallback;

  try {
    const diagContext = diagnostics.length > 0
      ? `CONDITION NOTES (factor into word choice -- e.g. "Project-Ready" instead of "Family-Ready" if issues exist): ${diagnostics.join(', ')}`
      : 'CONDITION: No major issues reported.';

    const bodyContext = bodyType ? `Body type: ${bodyType}.` : '';

    const prompt = `
      Task: Generate a bilingual identity-first headline for a ${year} ${make} ${model} listing at Triple J Auto Investment, a Houston BHPH dealership.

      ${bodyContext}
      ${diagContext}

      HEADLINE RULES:
      1. Format: "[Identity Label] | [2-3 punchy descriptive words]."
      2. Lead with WHO this car is for, not what it is.
      3. Maximum 15 words total.
      4. Warm, aspirational but honest tone.
      5. If diagnostics mention issues, acknowledge in word choice (e.g., "Project-Ready" instead of "Family-Ready").
      6. Examples:
         - "Family-Ready Sedan | Reliable. Clean. Ready for Your Next Chapter."
         - "Weekend Warrior | Tough. Capable. Built for Adventure."
         - "Daily Driver | Efficient. Dependable. Your Everyday Companion."
         - "First Car Ready | Safe. Simple. Perfect for New Drivers."

      Return ONLY valid JSON (no markdown, no explanation):
      {"en": "English headline", "es": "Spanish headline"}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 },
      }
    });

    const raw = response.text || '';
    const cleaned = cleanJsonResponse(raw);
    const parsed = JSON.parse(cleaned) as { en: string; es: string };
    return { en: parsed.en || fallback.en, es: parsed.es || fallback.es };
  } catch (error) {
    console.error("Identity Headline Generation Error:", error);
    return fallback;
  }
};

export const generateVehicleStory = async (
  make: string,
  model: string,
  year: number,
  mileage: number,
  diagnostics: string[] = [],
  description: string = ''
): Promise<{ en: string; es: string }> => {
  const fallback = {
    en: `This ${year} ${make} ${model} is available at Triple J Auto Investment. Contact us to learn more.`,
    es: `Este ${year} ${make} ${model} esta disponible en Triple J Auto Investment. Contactenos para mas informacion.`
  };
  const ai = getClient();
  if (!ai) return fallback;

  try {
    const diagContext = diagnostics.length > 0
      ? `KNOWN ISSUES (disclose honestly): ${diagnostics.join(', ')}`
      : 'No known issues reported. Vehicle has been inspected.';

    const descContext = description
      ? `EXISTING DESCRIPTION FOR CONTEXT: ${description}`
      : '';

    const prompt = `
      Task: Write a bilingual honest vehicle story for a ${year} ${make} ${model} with ${mileage.toLocaleString()} miles, listed at Triple J Auto Investment, a Houston BHPH dealership.

      ${diagContext}
      ${descContext}

      STORY RULES:
      1. Write a 3-5 sentence honest story about this vehicle.
      2. Include: what type of owner this car is ideal for, its strengths, and any condition notes.
      3. If diagnostics list any issues, disclose them honestly but frame them as known and transparent ("We noticed X and want you to know upfront").
      4. If no issues, highlight reliability and value.
      5. Tone: warm, transparent, trustworthy. Like a neighbor giving honest advice.
      6. DO NOT fabricate history (no "one-owner" claims, no "garage-kept" unless stated in diagnostics).
      7. End with a forward-looking statement about the vehicle's next chapter.

      Return ONLY valid JSON (no markdown, no explanation):
      {"en": "English story", "es": "Spanish story"}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 },
      }
    });

    const raw = response.text || '';
    const cleaned = cleanJsonResponse(raw);
    const parsed = JSON.parse(cleaned) as { en: string; es: string };
    return { en: parsed.en || fallback.en, es: parsed.es || fallback.es };
  } catch (error) {
    console.error("Vehicle Story Generation Error:", error);
    return fallback;
  }
};
