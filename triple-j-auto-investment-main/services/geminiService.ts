
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
