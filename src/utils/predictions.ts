import type { PredictionType } from "@/utils/aiService";

export const dateIdeas = [
  "A sunset picnic at Putrajaya Lake with halal snacks and drinks",
  "Stargazing at KL Tower Sky Deck followed by halal dinner at KLCC",
  "Cooking together a romantic halal dinner at home, then watching a movie",
  "A morning hike at Bukit Broga, Semenyih followed by halal brunch at a local café",
  "A visit to Islamic Arts Museum Malaysia, then halal lunch at nearby restaurants",
  "A day at Thean Hou Temple and KL Bird Park, with halal food at Jalan Alor",
  "A picnic at Taman Botani Negara Shah Alam with halal snacks and board games",
  "A day exploring Batu Caves, then halal lunch at nearby restaurants",
  "A visit to KLCC Park and Aquaria KLCC, followed by halal dinner at Suria KLCC",
  "A morning walk at KL Forest Eco Park, then halal breakfast at a nearby mamak",
  "A day trip to Genting Highlands (within 80km), enjoy the cool weather and halal food",
  "A visit to Sunway Lagoon, then halal dinner at Sunway Pyramid",
  "A romantic evening at KL Tower with halal dinner at Atmosphere 360",
  "A day at FRIM Kepong for nature walk, then halal lunch at nearby restaurants",
  "A visit to Central Market KL and Petaling Street, followed by halal street food",
];

export const compliments = [
  "Your smile lights up my world every single day",
  "You have the most beautiful and kind heart",
  "Your kindness inspires me to be a better person",
  "The way you laugh makes everything better",
  "You have an incredible ability to make others feel special",
  "Your creativity and imagination amaze me",
  "You bring so much joy and light into my life",
  "Your strength and resilience inspire me",
  "You have the most wonderful sense of humor",
  "Your compassion and empathy are truly beautiful",
  "You make ordinary moments feel magical",
  "Your intelligence and wisdom always impress me",
  "You have a way of making everything feel right",
  "Your presence alone makes my day brighter",
  "You are more beautiful than words can express",
];

export const hiddenQualities = [
  "You have an incredible sense of humor that brightens every room",
  "Your creativity knows no bounds and inspires everyone around you",
  "You make everyone feel special and valued",
  "You have a natural gift for making people feel comfortable",
  "Your intuition and wisdom guide you beautifully through life",
  "You have a rare ability to find beauty in the simplest things",
  "Your positive energy is contagious and uplifting",
  "You possess an inner strength that's truly admirable",
  "You have a magical way of turning ordinary moments into memories",
  "Your empathy and understanding make you an amazing friend",
  "You have a unique perspective that always brings fresh insights",
  "Your passion for life is inspiring and infectious",
  "You have a gift for making others feel heard and understood",
  "Your gentle spirit brings peace to those around you",
  "You have an extraordinary ability to see the best in people",
];

export const halalFood = [
  "Nasi Lemak at Village Park Restaurant, Bangsar",
  "Roti Canai at Restoran Yut Kee, KL",
  "Satay at Haji Samuri, Ampang",
  "Biryani at Al-Amin Restaurant, KLCC",
  "Mee Goreng at Mamak Corner, Petaling Street",
  "Ayam Percik at Bijan Restaurant, KL",
  "Laksa at Laksa Shack, Bangsar",
  "Rendang at Seri Melayu Restaurant, KL",
  "Char Kuey Teow at Weng Heong Restaurant, Petaling Street",
  "Nasi Kandar at Pelita Nasi Kandar, KL",
  "Murtabak at Al-Amar Express, Pavilion KL",
  "Sup Tulang at Restoran Hameediyah, KL",
  "Roti John at Zainal Abidin, KL",
  "Nasi Kerabu at Kelantan Delights, KL",
  "Cendol at SS2 Cendol, Petaling Jaya",
];

const PREDICTIONS: Record<PredictionType, string[]> = {
  dateIdeas,
  compliments,
  hiddenQualities,
  halalFood,
};

const KNOWN_LOCATIONS: Record<string, string> = {
  "Putrajaya Lake": "Putrajaya Lake",
  "KL Tower": "KL Tower",
  "Bukit Broga": "Bukit Broga, Semenyih",
  "Batu Caves": "Batu Caves",
  "Genting": "Genting Highlands",
  "Sunway": "Sunway Lagoon",
  "Central Market": "Central Market KL",
  "Petaling Street": "Petaling Street",
  "FRIM": "FRIM Kepong",
  "Taman Botani": "Taman Botani Negara Shah Alam",
};

const LOCATION_PATTERNS = [
  /at\s+([^,]+?)(?:\s+with|\s+followed|\s+then|$)/i,
  /to\s+([^,]+?)(?:\s+with|\s+followed|\s+then|$)/i,
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Park|Lake|Tower|Temple|Garden|Museum|Beach|Caves|Highlands|KLCC|KL Tower|Sky Deck)/i,
  /(Putrajaya|Semenyih|Bukit Broga|Batu Caves|Genting|Sunway|KLCC|Central Market|Petaling Street|FRIM|Taman Botani)/i,
];

// Turn one free-text preset idea into a "• Spot/Activity/Cost" block.
const presetIdeaToEntry = (idea: string): string => {
  let spot = "";
  let activity = idea;

  for (const pattern of LOCATION_PATTERNS) {
    const match = idea.match(pattern);
    if (match) {
      spot = match[1].trim();
      const spotIndex = idea.toLowerCase().indexOf(spot.toLowerCase());
      if (spotIndex > 0) {
        activity = idea.substring(0, spotIndex).trim().replace(/^(a|an|the)\s+/i, "").trim();
      }
      break;
    }
  }

  if (!spot) {
    for (const [key, location] of Object.entries(KNOWN_LOCATIONS)) {
      if (idea.includes(key)) {
        spot = location;
        break;
      }
    }
  }

  if (!spot) {
    const meaningfulWords = idea
      .split(/\s+/)
      .filter((w) => !/^(a|an|the|at|to|with|and|or)$/i.test(w));
    spot = meaningfulWords.slice(0, 3).join(" ") || "KL Area";
  }

  let cost = "RM 10-50";
  if (idea.toLowerCase().includes("free") || idea.toLowerCase().includes("no cost")) {
    cost = "Free";
  } else if (idea.match(/rm\s*\d+/i)) {
    const costMatch = idea.match(/rm\s*(\d+)/i);
    cost = costMatch ? `RM ${costMatch[1]}` : "RM 10-50";
  }

  activity = activity.replace(/^(a|an|the)\s+/i, "").trim();
  if (!activity || activity.length < 5) {
    activity = idea.split(/\s+at\s+|\s+to\s+/i)[0]?.trim() || "Enjoy romantic time together";
  }

  return `• Spot: ${spot}\nActivity: ${activity}\nCost: ${cost}`;
};

export const getPresetPrediction = (type: PredictionType): string => {
  const array = PREDICTIONS[type];

  // Location-based types return 5 structured entries.
  if (type === "dateIdeas" || type === "halalFood") {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5).map(presetIdeaToEntry).join("\n\n");
  }

  return array[Math.floor(Math.random() * array.length)];
};
