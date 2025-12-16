import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, ExternalLink } from "lucide-react";
import { generatePrediction, type PredictionType } from "@/utils/aiService";

interface LocationCardProps {
  spot: string;
  activity: string;
  cost: string;
  searchUrl: string;
  imageUrl: string;
  locationName: string;
  onImageUpdate: (url: string) => void;
}

const LocationCard = ({ spot, activity, cost, searchUrl, imageUrl, locationName, onImageUpdate }: LocationCardProps) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [imageError, setImageError] = useState(false);

  // Update image URL if prop changes
  useEffect(() => {
    setCurrentImageUrl(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    // Try to fetch Google Maps photo
    const fetchGooglePhoto = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        return;
      }

      try {
        const searchQuery = encodeURIComponent(`${locationName} Malaysia`);
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&key=${apiKey}`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
          return;
        }

        const searchData = await searchResponse.json();
        
        if (searchData.results && searchData.results.length > 0) {
          const place = searchData.results[0];
          if (place.photos && place.photos.length > 0) {
            const photoReference = place.photos[0].photo_reference;
            const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&maxheight=200&photo_reference=${photoReference}&key=${apiKey}`;
            setCurrentImageUrl(photoUrl);
            onImageUpdate(photoUrl);
          }
        }
      } catch (error) {
        // Silently fail, keep fallback image
      }
    };

    fetchGooglePhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationName]);

  return (
    <motion.a
      href={searchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block mb-6 last:mb-0 bg-accent/30 rounded-xl border border-border/50 hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer group overflow-hidden"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Location Image */}
      <div className="relative w-full h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
        {!imageError ? (
          <img
            src={currentImageUrl}
            alt={`${spot} location`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            onError={() => {
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30 flex items-center justify-center">
            <span className="text-4xl">📍</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      </div>
      
      {/* Card Content */}
      <div className="p-4 space-y-2.5">
        <div className="font-semibold text-lg text-primary flex items-center gap-2">
          <span>📍</span>
          <span className="flex-1">{spot}</span>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
        {activity && (
          <div className="text-foreground/90 text-base flex items-center gap-2">
            <span>✨</span>
            <span>{activity}</span>
          </div>
        )}
        {cost && (
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            <span>💰</span>
            <span>{cost}</span>
          </div>
        )}
      </div>
    </motion.a>
  );
};

const dateIdeas = [
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

const compliments = [
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

const hiddenQualities = [
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

const FortuneTellerSection = () => {
  const [selectedType, setSelectedType] = useState<PredictionType | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<string>("");
  const [isRevealing, setIsRevealing] = useState(false);
  const [locationImages, setLocationImages] = useState<Record<string, string>>({});

  const getPresetPrediction = (type: PredictionType): string => {
    const predictions = {
      dateIdeas,
      compliments,
      hiddenQualities,
    };
    const array = predictions[type];
    
    // For date ideas, return 5 random locations in the required format
    if (type === "dateIdeas") {
      // Shuffle array and pick 5 unique items
      const shuffled = [...array].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 5);
      
      // Format as structured bullet points
      return selected.map((idea, index) => {
        // Parse the preset idea to extract location name, activity, and cost
        let spot = "";
        let activity = idea;
        let cost = "Free";
        
        // Extract location names from common patterns in preset ideas
        const locationPatterns = [
          /at\s+([^,]+?)(?:\s+with|\s+followed|\s+then|$)/i,
          /to\s+([^,]+?)(?:\s+with|\s+followed|\s+then|$)/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Park|Lake|Tower|Temple|Garden|Museum|Beach|Caves|Highlands|KLCC|KL Tower|Sky Deck)/i,
          /(Putrajaya|Semenyih|Bukit Broga|Batu Caves|Genting|Sunway|KLCC|Central Market|Petaling Street|FRIM|Taman Botani)/i,
        ];
        
        for (const pattern of locationPatterns) {
          const match = idea.match(pattern);
          if (match) {
            spot = match[1].trim();
            // Extract activity (everything before the location)
            const spotIndex = idea.toLowerCase().indexOf(spot.toLowerCase());
            if (spotIndex > 0) {
              activity = idea.substring(0, spotIndex).trim();
              // Clean up activity
              activity = activity.replace(/^(a|an|the)\s+/i, "").trim();
            }
            break;
          }
        }
        
        // If no location found, try to extract from known preset formats
        if (!spot) {
          const knownLocations: Record<string, string> = {
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
          
          for (const [key, location] of Object.entries(knownLocations)) {
            if (idea.includes(key)) {
              spot = location;
              break;
            }
          }
        }
        
        // Fallback: extract first meaningful words as spot
        if (!spot) {
          const words = idea.split(/\s+/);
          // Skip articles and common words
          const meaningfulWords = words.filter(w => !/^(a|an|the|at|to|with|and|or)$/i.test(w));
          spot = meaningfulWords.slice(0, 3).join(" ") || "KL Area";
        }
        
        // Determine cost based on keywords
        if (idea.toLowerCase().includes("free") || idea.toLowerCase().includes("no cost")) {
          cost = "Free";
        } else if (idea.match(/rm\s*\d+/i)) {
          const costMatch = idea.match(/rm\s*(\d+)/i);
          cost = costMatch ? `RM ${costMatch[1]}` : "RM 10-50";
        } else {
          cost = "RM 10-50";
        }
        
        // Clean up activity text
        activity = activity.replace(/^(a|an|the)\s+/i, "").trim();
        if (!activity || activity.length < 5) {
          activity = idea.split(/\s+at\s+|\s+to\s+/i)[0]?.trim() || "Enjoy romantic time together";
        }
        
        return `• Spot: ${spot}\nActivity: ${activity}\nCost: ${cost}`;
      }).join("\n\n");
    }
    
    return array[Math.floor(Math.random() * array.length)];
  };

  const generateAIPrediction = async (type: PredictionType): Promise<string | null> => {
    try {
      return await generatePrediction(type);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[FortuneTeller] Error generating AI prediction:", error);
      }
      return null;
    }
  };

  const getLocationSearchUrl = (locationName: string): string => {
    // Create Google Maps search URL for the location in Malaysia
    const searchQuery = encodeURIComponent(`${locationName} Malaysia`);
    return `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
  };

  const fetchGoogleMapsPhoto = async (locationName: string): Promise<string | null> => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    
    // If no API key, return null to use fallback
    if (!apiKey || apiKey.trim() === "") {
      return null;
    }

    try {
      // Step 1: Search for the place using Text Search
      const searchQuery = encodeURIComponent(`${locationName} Malaysia`);
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&key=${apiKey}`;
      
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        return null;
      }

      const searchData = await searchResponse.json();
      
      // Get the first result's photo reference
      if (searchData.results && searchData.results.length > 0) {
        const place = searchData.results[0];
        if (place.photos && place.photos.length > 0) {
          const photoReference = place.photos[0].photo_reference;
          // Step 2: Get the photo URL
          return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&maxheight=200&photo_reference=${photoReference}&key=${apiKey}`;
        }
      }
      
      return null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[FortuneTeller] Error fetching Google Maps photo:", error);
      }
      return null;
    }
  };

  const getLocationImageUrl = (locationName: string, index: number): string => {
    // Check if we already have the image cached
    if (locationImages[locationName]) {
      return locationImages[locationName];
    }

    // Return fallback immediately, then fetch Google Maps photo in background
    const seed = locationName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const fallbackUrl = `https://picsum.photos/seed/${seed + index}/400/200`;
    
    // Fetch Google Maps photo in background and update if successful
    fetchGoogleMapsPhoto(locationName).then((googlePhotoUrl) => {
      if (googlePhotoUrl) {
        setLocationImages(prev => ({ ...prev, [locationName]: googlePhotoUrl }));
      }
    }).catch(() => {
      // Silently fail, fallback already set
    });
    
    return fallbackUrl;
  };

  const handleImageUpdate = useCallback((locationName: string, url: string) => {
    setLocationImages(prev => ({ ...prev, [locationName]: url }));
  }, []);

  const formatPrediction = (prediction: string, type: PredictionType | null): React.ReactNode => {
    // For date ideas, format structured bullet points nicely
    if (type === "dateIdeas") {
      // Try to parse structured format first
      if (prediction.includes("Spot:") || prediction.includes("spot:")) {
        // Handle both single-line and multi-line formats
        // Split by bullet points first, then process each entry
        const entries = prediction.split(/[•\n](?=\s*Spot:)/i).filter(e => e.trim());
        const formattedEntries: React.ReactNode[] = [];
        
        entries.forEach((entry, entryIndex) => {
          const trimmed = entry.trim();
          
          // Extract Spot (case insensitive) - handle various formats
          let spotMatch = trimmed.match(/Spot:\s*([^\n\-]*?)(?:\s+Activity:|$)/i);
          if (!spotMatch) {
            // Try alternative format: "Spot: Name - description"
            spotMatch = trimmed.match(/Spot:\s*([^\-]*?)(?:\s*[-–—]|Activity:|$)/i);
          }
          const spot = spotMatch ? spotMatch[1].trim() : "";
          
          // Extract Activity - handle various formats
          let activityMatch = trimmed.match(/Activity:\s*([^\n\-]*?)(?:\s+Cost:|$)/i);
          if (!activityMatch) {
            // Try dash-separated format: "Spot: Name - Activity description - Cost"
            const dashParts = trimmed.split(/[-–—]/);
            if (dashParts.length >= 2 && spot) {
              // Second part is usually activity
              activityMatch = [null, dashParts[1]?.trim()];
            }
          }
          const activity = activityMatch ? (activityMatch[1] || activityMatch[0] || "").trim() : "";
          
          // Extract Cost - handle various formats
          let costMatch = trimmed.match(/Cost:\s*([^\n\-]*?)(?:\s+Spot:|$)/i);
          if (!costMatch) {
            // Try dash-separated format
            const dashParts = trimmed.split(/[-–—]/);
            if (dashParts.length >= 3) {
              // Last part is usually cost
              const lastPart = dashParts[dashParts.length - 1]?.trim();
              if (lastPart && (lastPart.toLowerCase().includes("cost") || lastPart.toLowerCase().includes("free") || lastPart.match(/\d/))) {
                costMatch = [null, lastPart.replace(/cost:\s*/i, "").trim()];
              }
            }
          }
          const cost = costMatch ? (costMatch[1] || costMatch[0] || "").trim() : "";
          
          // Only add if we have at least a spot name
          if (spot && spot.length > 2) {
            const searchUrl = getLocationSearchUrl(spot);
            const imageUrl = getLocationImageUrl(spot, entryIndex);
            
            formattedEntries.push(
              <LocationCard
                key={`entry-${entryIndex}`}
                spot={spot}
                activity={activity}
                cost={cost}
                searchUrl={searchUrl}
                imageUrl={imageUrl}
                locationName={spot}
                onImageUpdate={(url) => handleImageUpdate(spot, url)}
              />
            );
          }
        });
        
        if (formattedEntries.length > 0) {
          return <div className="space-y-4">{formattedEntries}</div>;
        }
      }
      
      // Fallback: Try to parse dash-separated format
      if (prediction.includes("•") && prediction.includes("Spot:")) {
        // Parse format like: "• Spot: Name - Activity - Cost"
        const lines = prediction.split(/[•\n]/).filter(line => line.trim() && line.toLowerCase().includes("spot"));
        const formattedEntries: React.ReactNode[] = [];
        
        lines.forEach((line, entryIndex) => {
          const trimmed = line.trim();
          // Extract spot name (everything after "Spot:" until dash or end)
          const spotMatch = trimmed.match(/Spot:\s*([^\-–—]*?)(?:\s*[-–—]|$)/i);
          const spot = spotMatch ? spotMatch[1].trim() : "";
          
          if (spot && spot.length > 2) {
            // Split by dashes to get activity and cost
            const parts = trimmed.split(/[-–—]/).map(p => p.trim());
            let activity = "";
            let cost = "";
            
            // Find activity (usually second part)
            if (parts.length > 1) {
              activity = parts[1]?.replace(/Activity:\s*/i, "").trim() || "";
            }
            
            // Find cost (usually last part)
            if (parts.length > 2) {
              cost = parts[parts.length - 1]?.replace(/Cost:\s*/i, "").trim() || "";
            } else if (parts.length === 2 && parts[1]?.toLowerCase().includes("free")) {
              cost = parts[1].trim();
            }
            
            const searchUrl = getLocationSearchUrl(spot);
            const imageUrl = getLocationImageUrl(spot, entryIndex);
            
            formattedEntries.push(
              <LocationCard
                key={`entry-${entryIndex}`}
                spot={spot}
                activity={activity}
                cost={cost}
                searchUrl={searchUrl}
                imageUrl={imageUrl}
                locationName={spot}
                onImageUpdate={(url) => handleImageUpdate(spot, url)}
              />
            );
          }
        });
        
        if (formattedEntries.length > 0) {
          return <div className="space-y-4">{formattedEntries}</div>;
        }
      }
      
      // If we can't parse it properly, return null to trigger preset fallback
      // Don't show unformatted text
      return null;
    }
    
    // For other types, check if there are bullet points and format them
    if (prediction.includes("•") || (prediction.includes("-") && prediction.split("-").length > 2)) {
      const lines = prediction.split(/[•\n-]/).filter(line => line.trim() && !line.match(/^(Spot|Activity|Cost):/i));
      if (lines.length > 0) {
        return (
          <div className="space-y-3 text-left">
            {lines.map((line, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-primary mt-1 text-xl">•</span>
                <span className="text-base leading-relaxed">{line.trim()}</span>
              </div>
            ))}
          </div>
        );
      }
    }
    
    // Default: return as is with proper line breaks
    return (
      <div className="whitespace-pre-line leading-relaxed">
        {prediction}
      </div>
    );
  };

  const handleTypeSelect = async (type: PredictionType) => {
    setSelectedType(type);
    setIsRevealing(true);
    setCurrentPrediction("");

    // Try AI first, then fallback to preset
    const aiPrediction = await generateAIPrediction(type);
    
    if (aiPrediction) {
      // Check if we can format it properly (for date ideas, must be structured)
      if (type === "dateIdeas") {
        const formatted = formatPrediction(aiPrediction, type);
        // If formatted returns null, it means parsing failed - use preset
        if (formatted === null) {
          setTimeout(() => {
            const prediction = getPresetPrediction(type);
            setCurrentPrediction(prediction);
            setIsRevealing(false);
          }, 800);
          return;
        }
      }
      // Successfully formatted or not a date idea, use AI prediction
      setCurrentPrediction(aiPrediction);
      setIsRevealing(false);
    } else {
      // Fallback to preset with shorter delay
      setTimeout(() => {
        const prediction = getPresetPrediction(type);
        setCurrentPrediction(prediction);
        setIsRevealing(false);
      }, 800);
    }
  };

  const handleNewPrediction = async () => {
    if (!selectedType) return;

    setIsRevealing(true);
    setCurrentPrediction("");

    // Try AI first, then fallback to preset
    const aiPrediction = await generateAIPrediction(selectedType);

    if (aiPrediction) {
      // Check if we can format it properly (for date ideas, must be structured)
      if (selectedType === "dateIdeas") {
        const formatted = formatPrediction(aiPrediction, selectedType);
        // If formatted returns null, it means parsing failed - use preset
        if (formatted === null) {
          setTimeout(() => {
            const prediction = getPresetPrediction(selectedType);
            setCurrentPrediction(prediction);
            setIsRevealing(false);
          }, 800);
          return;
        }
      }
      // Successfully formatted or not a date idea, use AI prediction
      setCurrentPrediction(aiPrediction);
      setIsRevealing(false);
    } else {
      // Fallback to preset with shorter delay
      setTimeout(() => {
        const prediction = getPresetPrediction(selectedType);
        setCurrentPrediction(prediction);
        setIsRevealing(false);
      }, 800);
    }
  };

  return (
    <section id="fortune-teller" className="py-20 md:py-32 bg-gradient-romantic relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/10"
            initial={{ 
              x: `${10 + i * 12}%`, 
              y: `${20 + (i % 3) * 30}%`,
              scale: 0.5 + (i % 3) * 0.2
            }}
            animate={{ 
              rotate: [0, 360],
              scale: [0.5 + (i % 3) * 0.2, 0.6 + (i % 3) * 0.2, 0.5 + (i % 3) * 0.2]
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles size={24 + i * 4} />
          </motion.div>
        ))}
      </div>

      <div className="container px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Wand2 className="mx-auto mb-4 text-primary" size={36} />
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Crystal Ball <span className="text-gradient-romantic">Fortune Teller</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Ask the crystal ball for romantic predictions, date ideas, or hidden qualities
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Crystal Ball Container */}
          <motion.div
            className="flex justify-center mb-12"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative">
              {/* Outer glow */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  background: "radial-gradient(circle, hsl(340 65% 75% / 0.4), transparent 70%)",
                  filter: "blur(20px)",
                }}
              />

              {/* Crystal Ball */}
              <motion.div
                className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden cursor-pointer"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(200, 150, 255, 0.2), rgba(150, 100, 255, 0.4), rgba(100, 50, 200, 0.6))",
                  boxShadow: `
                    inset 0 0 50px rgba(255, 255, 255, 0.3),
                    inset -20px -20px 60px rgba(100, 50, 200, 0.4),
                    0 0 80px hsl(340 65% 65% / 0.5),
                    0 20px 60px rgba(0, 0, 0, 0.3)
                  `,
                }}
              >
                {/* Inner shine */}
                <div
                  className="absolute top-0 left-0 w-full h-full"
                  style={{
                    background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent 50%)",
                  }}
                />

                {/* Sparkle particles inside crystal ball */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-white"
                    style={{
                      width: `${2 + Math.random() * 4}px`,
                      height: `${2 + Math.random() * 4}px`,
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: "easeInOut",
                    }}
                  />
                ))}

                {/* Mystical mist effect */}
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    background: [
                      "radial-gradient(circle at 20% 30%, rgba(200, 150, 255, 0.2), transparent 60%)",
                      "radial-gradient(circle at 80% 70%, rgba(150, 100, 255, 0.2), transparent 60%)",
                      "radial-gradient(circle at 20% 30%, rgba(200, 150, 255, 0.2), transparent 60%)",
                    ],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>

              {/* Floating sparkles around crystal ball */}
              {[...Array(20)].map((_, i) => {
                const angle = (i / 20) * Math.PI * 2;
                const radius = 140 + Math.random() * 40;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-white"
                    style={{
                      width: `${3 + Math.random() * 3}px`,
                      height: `${3 + Math.random() * 3}px`,
                      left: "50%",
                      top: "50%",
                      x: x,
                      y: y,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 3,
                      ease: "easeInOut",
                    }}
                  />
                );
              })}
            </div>
          </motion.div>

          {/* Prediction Type Selector */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {[
              { type: "dateIdeas" as PredictionType, label: "Date Ideas", icon: "💕" },
              { type: "compliments" as PredictionType, label: "Compliments", icon: "✨" },
              { type: "hiddenQualities" as PredictionType, label: "Hidden Qualities", icon: "🌟" },
            ].map(({ type, label, icon }) => (
              <motion.button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className={`px-6 py-3 rounded-full font-medium text-lg transition-all ${
                  selectedType === type
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "bg-card text-foreground hover:bg-accent hover:scale-105"
                }`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="mr-2">{icon}</span>
                {label}
              </motion.button>
            ))}
          </motion.div>

          {/* Prediction Display Area */}
          <motion.div
            className="min-h-[200px] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence mode="wait">
              {isRevealing ? (
                <motion.div
                  key="revealing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="inline-block mb-4"
                  >
                    <Sparkles className="text-primary" size={48} />
                  </motion.div>
                  <p className="font-serif text-xl text-muted-foreground">
                    The crystal ball is reading your future...
                  </p>
                </motion.div>
              ) : currentPrediction ? (
                <motion.div
                  key="prediction"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center max-w-2xl mx-auto"
                >
                  <div className="bg-card rounded-3xl p-8 md:p-12 shadow-xl border border-border relative overflow-hidden">
                    {/* Decorative sparkles */}
                    <div className="absolute top-4 right-4">
                      <Sparkles className="text-primary/20" size={24} />
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <Sparkles className="text-primary/20" size={20} />
                    </div>

                    <div className="relative z-10">
                      <motion.div
                        className={`mb-6 ${
                          selectedType === "dateIdeas"
                            ? "text-left"
                            : "font-serif text-xl md:text-2xl leading-relaxed text-foreground text-center"
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {formatPrediction(currentPrediction, selectedType)}
                      </motion.div>

                      <motion.button
                        onClick={handleNewPrediction}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:shadow-lg transition-all"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Wand2 size={18} />
                        Get New Prediction
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <p className="font-serif text-xl text-muted-foreground">
                    Choose a prediction type above to begin
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FortuneTellerSection;
