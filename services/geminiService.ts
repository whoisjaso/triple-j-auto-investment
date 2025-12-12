
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY not found in environment");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateVehicleDescription = async (make: string, model: string, year: number, diagnostics: string[] = []): Promise<string> => {
  const ai = getClient();
  if (!ai) return "System Error: AI Client not initialized.";

  try {
    const diagContext = diagnostics.length > 0 
      ? `SPECIFIC CONDITION NOTES (Must be acknowledged but reframed as 'Battle Scars' or 'Operational Reality'): ${diagnostics.join(', ')}`
      : "CONDITION: Verified Operational Status. No major anomalies reported.";

    const prompt = `
      Task: Generate a 'Sovereign Asset' description for a ${year} ${make} ${model}.

      BRAND DOCTRINE (TRIPLE J AUTO INVESTMENT):
      - We do not sell cars; we allocate instruments of power.
      - Identity precedes results. The vehicle is a psychological anchor for the owner's dominion.
      - Avoid standard dealer clichés ("mint condition", "runs great", "luxury").
      - Use language of: Authority, Precision, Legacy, Kinetic Energy, Fortress, Sanctuary.

      REALITY PROTOCOL (Use these facts):
      ${diagContext}

      INSTRUCTIONS:
      1. Analyze the specific archetype of the ${make} ${model}.
      2. If there are diagnostic issues (e.g. scratches, wear), do not apologize. Frame them as "Evidence of utility" or "Marks of experience." If pristine, frame it as "Uncompromised purity."
      3. Length: 2-3 sentences. Maximum 40 words.
      4. Tone: Cold, sophisticated, inevitable. Subconscious cues of high status.
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
      ### 🛡️ PROFIT VECTOR ANALYSIS
      (Analyze what is working. Be specific about Make/Model/Year or Strategy. Mention ROI.)

      ### ⚠️ EFFICIENCY LEAKAGE (CRITICAL)
      (Identify the specific expense column—Towing, Mech, or Cosmetic—that is statistically too high. Name the specific cars that dragged us down and the specific dollar amount lost to friction.)

      ### ⚔️ TACTICAL DIRECTIVE
      (1 ruthless, bold command to the owner. Max 20 words. e.g., "STOP BUYING HIGH-MILEAGE RANGE ROVERS. MECHANICAL COSTS ARE UNSUSTAINABLE.")
      
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
