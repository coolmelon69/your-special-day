export type PredictionType = "dateIdeas" | "compliments" | "hiddenQualities";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
const API_TIMEOUT = 10000; // 10 seconds

const prompts: Record<PredictionType, string> = {
  dateIdeas: "Suggest exactly 5 creative, romantic, halal, and wallet-friendly date locations within 80km of KL.\n\nREQUIRED FORMAT (must follow exactly for EACH location):\n\n• Spot: [Location Name]\nActivity: [What to do]\nCost: [Price]\n\n• Spot: [Location Name]\nActivity: [What to do]\nCost: [Price]\n\n(Repeat for all 5 locations)\n\nRules:\n- Use bullet point (•) to start each location\n- Always include 'Spot:', 'Activity:', and 'Cost:' labels for each\n- Provide exactly 5 different locations\n- Keep each line under 5 words\n- No dashes, no conversational text\n- Only return the formatted bullet points",
  compliments: "Write a heartfelt, genuine compliment about someone special.\n\nConstraints:\n\nStrictly one sentence only.\nKeep it under 20 words.\nFocus on a specific impact they have on others (avoid generic adjectives).\n\nRespond with the compliment only.",
  hiddenQualities: "Reveal a positive hidden quality or trait about someone special. Make it insightful and genuine. Respond with only the quality description, no additional text.",
};

/**
 * Generates a prediction using Groq AI API
 * @param type - The type of prediction to generate
 * @returns Promise<string | null> - The generated prediction or null if failed
 */
export async function generatePrediction(type: PredictionType): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  // If no API key, return null to trigger fallback
  if (!apiKey || apiKey.trim() === "") {
    if (import.meta.env.DEV) {
      console.log("[AI Service] No API key found, will use preset predictions");
    }
    return null;
  }

  const prompt = prompts[type];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: type === "dateIdeas" ? 400 : 150,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (import.meta.env.DEV) {
        console.error("[AI Service] API error:", response.status, errorData);
      }
      return null;
    }

    const data = await response.json();
    const prediction = data.choices?.[0]?.message?.content?.trim();

    if (!prediction) {
      if (import.meta.env.DEV) {
        console.error("[AI Service] No prediction in response:", data);
      }
      return null;
    }

    return prediction;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      if (import.meta.env.DEV) {
        console.warn("[AI Service] Request timeout");
      }
    } else if (import.meta.env.DEV) {
      console.error("[AI Service] Error:", error);
    }
    return null;
  }
}
