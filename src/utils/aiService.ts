export type PredictionType = "dateIdeas" | "compliments" | "hiddenQualities" | "halalFood";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
const API_TIMEOUT = 10000; // 10 seconds

const prompts: Record<PredictionType, string> = {
  dateIdeas: "Suggest exactly 5 creative, romantic, halal, and wallet-friendly date locations within 80km of KL.\n\nREQUIRED FORMAT (must follow exactly for EACH location):\n\n• Spot: [Location Name]\nActivity: [What to do]\nCost: [Price]\n\n• Spot: [Location Name]\nActivity: [What to do]\nCost: [Price]\n\n(Repeat for all 5 locations)\n\nRules:\n- Use bullet point (•) to start each location\n- Always include 'Spot:', 'Activity:', and 'Cost:' labels for each\n- Provide exactly 5 different locations\n- Keep each line under 5 words\n- No dashes, no conversational text\n- Only return the formatted bullet points",
  compliments: "Provide exactly one fun, romantic, or whimsical conversation starter for partners per response, ensuring only one question is displayed at a time to allow for deep discussion.",
  hiddenQualities: "Provide exactly one deep, introspective question per response designed to help an anxious-avoidant couple foster security and mutual understanding, displaying only the text of the question without any intro, numbering, or filler.",
  halalFood: "Suggest exactly 5 halal food places (restaurants, cafes, food stalls) within 80km of KL.\n\nREQUIRED FORMAT (must follow exactly for EACH location):\n\n• Spot: [Restaurant/Cafe Name]\nActivity: [Type of cuisine or specialty dish]\nCost: [Price range]\n\n• Spot: [Restaurant/Cafe Name]\nActivity: [Type of cuisine or specialty dish]\nCost: [Price range]\n\n(Repeat for all 5 locations)\n\nRules:\n- Use bullet point (•) to start each location\n- Always include 'Spot:', 'Activity:', and 'Cost:' labels for each\n- Provide exactly 5 different halal food places\n- Keep each line under 5 words\n- No dashes, no conversational text\n- Only return the formatted bullet points",
};

/**
 * Gets user's current location
 * @returns Promise<string | null> - Location name or null if failed
 */
async function getUserLocation(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );
          
          if (!response.ok) {
            resolve(null);
            return;
          }
          
          const data = await response.json();
          // Try to get city or state name
          const location = data.address?.city || 
                         data.address?.town || 
                         data.address?.state || 
                         data.address?.county ||
                         "your location";
          
          resolve(location);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error("[AI Service] Error getting location name:", error);
          }
          resolve(null);
        }
      },
      () => {
        // Location access denied or failed
        resolve(null);
      },
      {
        timeout: 5000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

/**
 * Generates a prediction using Groq AI API
 * @param type - The type of prediction to generate
 * @param location - Optional location override (for halalFood type)
 * @returns Promise<string | null> - The generated prediction or null if failed
 */
export async function generatePrediction(type: PredictionType, location?: string): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  // If no API key, return null to trigger fallback
  if (!apiKey || apiKey.trim() === "") {
    if (import.meta.env.DEV) {
      console.log("[AI Service] No API key found, will use preset predictions");
    }
    return null;
  }

  let prompt = prompts[type];
  
  // For halalFood, detect location and update prompt
  if (type === "halalFood") {
    let userLocation = location;
    
    // If no location provided, try to detect it
    if (!userLocation) {
      userLocation = await getUserLocation();
    }
    
    // Fallback to "your area" if location detection fails
    const locationText = userLocation || "your area";
    
    prompt = `Suggest exactly 5 halal food places (cafes, restaurants, and pizza places) within 80km of ${locationText}.\n\nREQUIRED FORMAT (must follow exactly for EACH location):\n\n• Spot: [Restaurant/Cafe/Pizza Place Name]\nActivity: [Type of cuisine or specialty dish]\nCost: [Price range]\n\n• Spot: [Restaurant/Cafe/Pizza Place Name]\nActivity: [Type of cuisine or specialty dish]\nCost: [Price range]\n\n(Repeat for all 5 locations)\n\nRules:\n- Use bullet point (•) to start each location\n- Always include 'Spot:', 'Activity:', and 'Cost:' labels for each\n- Provide exactly 5 different halal food places (mix of cafes, restaurants, and pizza places)\n- Keep each line under 5 words\n- No dashes, no conversational text\n- Only return the formatted bullet points`;
  }

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
        max_tokens: type === "dateIdeas" || type === "halalFood" ? 400 : 150,
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
