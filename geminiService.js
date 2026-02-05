
import { GoogleGenAI } from "@google/genai";

export async function summarizeResource(title, description) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Resource Title: ${title}. Description: ${description}.`,
      config: {
        systemInstruction: "You are an academic assistant for Nigerian students. Summarize why this study resource might be helpful in 2 short bullet points. Keep it very encouraging and relevant to Nigerian university context.",
      }
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini summary error:", error);
    return "AI insight currently unavailable.";
  }
}
