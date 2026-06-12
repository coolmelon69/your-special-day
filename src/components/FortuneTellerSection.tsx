import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";
import { generatePrediction, type PredictionType } from "@/utils/aiService";
import { getPresetPrediction } from "@/utils/predictions";
import { parseLocationEntries } from "@/utils/parseLocations";
import { getLocationShareUrl } from "@/utils/googlePlaces";
import LocationCard from "./LocationCard";
import CrystalBall from "./CrystalBall";

const isLocationType = (type: PredictionType | null) =>
  type === "dateIdeas" || type === "halalFood";

const PREDICTION_TABS = [
  { type: "dateIdeas" as PredictionType, label: "Date Ideas", icon: "💕" },
  { type: "halalFood" as PredictionType, label: "Foodies", icon: "🍽️" },
  { type: "compliments" as PredictionType, label: "Fun Questions!", icon: "✨" },
  { type: "hiddenQualities" as PredictionType, label: "Deep Talks", icon: "🗣️" },
];

const FortuneTellerSection = () => {
  const [selectedType, setSelectedType] = useState<PredictionType | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<string>("");
  const [isRevealing, setIsRevealing] = useState(false);
  const [locationImages, setLocationImages] = useState<Record<string, string>>({});
  const [locationPlaceIds, setLocationPlaceIds] = useState<Record<string, string>>({});

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

  const handleImageUpdate = useCallback((locationName: string, url: string) => {
    setLocationImages((prev) => ({ ...prev, [locationName]: url }));
  }, []);

  const handlePlaceIdUpdate = useCallback((name: string, placeId: string) => {
    setLocationPlaceIds((prev) => ({ ...prev, [name]: placeId }));
  }, []);

  // Render a prediction string. Location types parse into LocationCards and
  // return null when nothing parses (signals the caller to use a preset).
  const formatPrediction = (
    prediction: string,
    type: PredictionType | null
  ): React.ReactNode => {
    if (isLocationType(type)) {
      const entries = parseLocationEntries(prediction);
      if (entries.length === 0) return null;

      return (
        <div className="space-y-4">
          {entries.map(({ spot, activity, cost }, index) => (
            <LocationCard
              key={`entry-${index}`}
              spot={spot}
              activity={activity}
              cost={cost}
              searchUrl={getLocationShareUrl(spot, locationPlaceIds[spot])}
              imageUrl={locationImages[spot] ?? null}
              locationName={spot}
              onImageUpdate={(url) => handleImageUpdate(spot, url)}
              onPlaceIdUpdate={handlePlaceIdUpdate}
            />
          ))}
        </div>
      );
    }

    // Bullet-style list for other types.
    if (prediction.includes("•") || (prediction.includes("-") && prediction.split("-").length > 2)) {
      const lines = prediction
        .split(/[•\n-]/)
        .filter((line) => line.trim() && !line.match(/^(Spot|Activity|Cost):/i));
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

    return <div className="whitespace-pre-line leading-relaxed">{prediction}</div>;
  };

  // Shared flow for both initial select and "Get New Prediction".
  const runPrediction = async (type: PredictionType) => {
    setIsRevealing(true);
    setCurrentPrediction("");

    const aiPrediction = await generateAIPrediction(type);

    const fallbackToPreset = () => {
      setTimeout(() => {
        setCurrentPrediction(getPresetPrediction(type));
        setIsRevealing(false);
      }, 800);
    };

    if (!aiPrediction) {
      fallbackToPreset();
      return;
    }

    // Location types must parse into structured cards; otherwise fall back.
    if (isLocationType(type) && formatPrediction(aiPrediction, type) === null) {
      fallbackToPreset();
      return;
    }

    setCurrentPrediction(aiPrediction);
    setIsRevealing(false);
  };

  const handleTypeSelect = (type: PredictionType) => {
    setSelectedType(type);
    runPrediction(type);
  };

  const handleNewPrediction = () => {
    if (selectedType) runPrediction(selectedType);
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
              scale: 0.5 + (i % 3) * 0.2,
            }}
            animate={{
              rotate: [0, 360],
              scale: [0.5 + (i % 3) * 0.2, 0.6 + (i % 3) * 0.2, 0.5 + (i % 3) * 0.2],
            }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
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
          <CrystalBall />

          {/* Prediction Type Selector */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {PREDICTION_TABS.map(({ type, label, icon }) => (
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
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
