
import { GoogleGenAI } from "@google/genai";

export async function summarizeResource(title, description) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Title: ${title}. Description: ${description}.`,
      config: {
        systemInstruction: "You are an academic assistant for Nigerian tertiary students. Summarize why this study resource is useful in 2 short points.",
      }
    });
    return response.text || "AI summary unavailable.";
  } catch (error) {
    console.error("AI Error:", error);
    return "AI insight currently unavailable.";
  }
}
