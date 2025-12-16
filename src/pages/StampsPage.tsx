import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera } from "lucide-react";
import StampCollectionSection from "@/components/StampCollectionSection";
import Footer from "@/components/Footer";
import { useAdventure } from "@/contexts/AdventureContext";
import { sprites, type ItineraryItem, checkLocation, type Photo as PhotoType } from "@/components/TimelineSection";
import { playStampSound } from "@/utils/sound";
import PhotoCaptureModal from "@/components/PhotoCaptureModal";
import PhotoEditor from "@/components/PhotoEditor";

const StampsPage = () => {
  const { itineraryState, resetProgress, setItineraryState, addPhoto, getPhotosByCheckpoint } = useAdventure();
  const [selectedEvent, setSelectedEvent] = useState<ItineraryItem | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [capturedPhotoSrc, setCapturedPhotoSrc] = useState<string>("");
  const [checkpointPhotos, setCheckpointPhotos] = useState<PhotoType[]>([]);

  // Load photos for selected checkpoint
  useEffect(() => {
    if (selectedEvent) {
      const checkpointId = `${selectedEvent.time}-${selectedEvent.title}`;
      getPhotosByCheckpoint(checkpointId).then(setCheckpointPhotos);
    }
  }, [selectedEvent, getPhotosByCheckpoint]);

  const handleMarkAsDone = (eventIndex: number) => {
    const item = itineraryState[eventIndex];
    
    // If no location is set for this item, allow marking as done without location check
    if (!item.location) {
      setItineraryState(prev => {
        const updated = [...prev];
        updated[eventIndex] = { ...updated[eventIndex], isPast: true, isActive: false };
        // If this was the active event, activate the next one
        if (updated[eventIndex].isActive) {
          const nextIndex = eventIndex + 1;
          if (nextIndex < updated.length) {
            updated[nextIndex] = { ...updated[nextIndex], isActive: true };
          }
        }
        return updated;
      });
      setSelectedEvent(null);
      setLocationError(null);
      // Play stamp sound on successful check-in
      playStampSound();
      return;
    }

    // IMPORTANT: Call checkLocation directly from click handler (not async)
    // This ensures the user gesture chain is preserved for iOS Safari and Chrome
    setIsCheckingLocation(true);
    setLocationError(null);

    // Call checkLocation synchronously to preserve user gesture for permission prompt
    checkLocation(item.location).then((locationResult) => {
      if (!locationResult.isAtLocation) {
        setIsCheckingLocation(false);
        if (locationResult.distance !== undefined) {
          setLocationError(
            `You are ${locationResult.distance}m away from the location. Please go to ${item.title} location to check in.`
          );
        } else {
          setLocationError(locationResult.error || "Unable to verify your location. Please try again.");
        }
        return;
      }

      // Location check passed, mark as done
      setIsCheckingLocation(false);
      setLocationError(null);
      setItineraryState(prev => {
        const updated = [...prev];
        updated[eventIndex] = { ...updated[eventIndex], isPast: true, isActive: false };
        // If this was the active event, activate the next one
        if (updated[eventIndex].isActive) {
          const nextIndex = eventIndex + 1;
          if (nextIndex < updated.length) {
            updated[nextIndex] = { ...updated[nextIndex], isActive: true };
          }
        }
        return updated;
      });
      setSelectedEvent(null);
      // Play stamp sound on successful check-in
      playStampSound();
    });
  };

  const handleStampClick = (item: ItineraryItem) => {
    // Clear any previous errors when clicking a new stamp
    setLocationError(null);
    setSelectedEvent(item);
  };

  const handlePhotoCapture = (dataURL: string) => {
    setCapturedPhotoSrc(dataURL);
    setShowPhotoCapture(false);
    setShowPhotoEditor(true);
  };

  const handlePhotoSave = async (photoData: Omit<PhotoType, "id" | "timestamp">) => {
    try {
      await addPhoto(photoData.checkpointId, photoData);
      if (selectedEvent) {
        const checkpointId = `${selectedEvent.time}-${selectedEvent.title}`;
        const photos = await getPhotosByCheckpoint(checkpointId);
        setCheckpointPhotos(photos);
      }
      setShowPhotoEditor(false);
      setCapturedPhotoSrc("");
    } catch (error) {
      console.error("Error saving photo:", error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Stamp Collection - Your Special Day</title>
        <meta name="description" content="View your collected adventure stamps" />
      </Helmet>
      
      <main className="overflow-x-hidden pt-16 md:pt-20">
        {/* Page Header */}
        <section className="py-12 md:py-20 bg-gradient-romantic">
          <div className="container px-6">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="text-gradient-romantic">Stamp Collection</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                Collect stamps as you complete each adventure! Each stamp represents a special moment from your special day.
              </p>
            </motion.div>
          </div>
        </section>

        <StampCollectionSection 
          itineraryState={itineraryState}
          onStampClick={handleStampClick}
          onResetProgress={resetProgress}
          sprites={sprites}
        />

        {/* Pixel Modal */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-[hsl(0_0%_0%)] bg-opacity-70"
                onClick={() => {
                  setSelectedEvent(null);
                  setLocationError(null);
                }}
              />
              
              {/* Modal */}
              <motion.div
                className="relative w-full max-w-md"
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
              >
                {/* Pixel border frame - Pasar Seni theme */}
                <div className="relative bg-[hsl(35_40%_85%)] border-4 border-[hsl(15_60%_50%)] p-1" style={{ imageRendering: "pixelated" }}>
                  {/* Inner border */}
                  <div className="border-2 border-[hsl(30_50%_60%)] p-4">
                    {/* Close button */}
                    <button
                      onClick={() => {
                        setSelectedEvent(null);
                        setLocationError(null);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-[hsl(0_60%_50%)] border-2 border-[hsl(0_50%_40%)] hover:bg-[hsl(0_60%_60%)] transition-colors"
                    >
                      <X className="w-4 h-4 text-[hsl(0_0%_100%)]" />
                    </button>

                    {/* Content */}
                    <div className="text-center">
                      {/* Sprite preview */}
                      <div className="w-16 h-16 mx-auto mb-4">
                        {(() => {
                          const eventIndex = itineraryState.findIndex(item => 
                            item.time === selectedEvent.time && 
                            item.title === selectedEvent.title
                          );
                          const currentItem = eventIndex >= 0 ? itineraryState[eventIndex] : selectedEvent;
                          const SpriteComponent = sprites[selectedEvent.sprite];
                          return <SpriteComponent isActive={currentItem.isActive} isPast={currentItem.isPast} />;
                        })()}
                      </div>

                      {/* Time badge */}
                      <div className="inline-block bg-[hsl(var(--primary))] px-3 py-1 mb-3">
                        <span className="font-pixel text-[10px] text-[hsl(var(--primary-foreground))]">
                          {selectedEvent.time}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 
                        className="font-pixel text-sm md:text-base text-[hsl(15_70%_40%)] mb-4"
                        style={{ 
                          textRendering: "optimizeSpeed",
                          WebkitFontSmoothing: "none",
                          MozOsxFontSmoothing: "unset",
                          fontSmooth: "never",
                          letterSpacing: "0.05em"
                        }}
                      >
                        {selectedEvent.title}
                      </h3>

                      {/* Description */}
                      <p 
                        className="font-pixel text-[8px] md:text-[10px] text-[hsl(15_60%_35%)] leading-relaxed mb-4"
                        style={{ 
                          textRendering: "optimizeSpeed",
                          WebkitFontSmoothing: "none",
                          MozOsxFontSmoothing: "unset",
                          fontSmooth: "never",
                          letterSpacing: "0.05em"
                        }}
                      >
                        {selectedEvent.description}
                      </p>

                      {/* Photos section */}
                      {checkpointPhotos.length > 0 && (
                        <div className="mb-4">
                          <p
                            className="font-pixel text-[8px] md:text-[10px] text-[hsl(15_60%_35%)] mb-2"
                            style={{ textRendering: "optimizeSpeed" }}
                          >
                            Memories ({checkpointPhotos.length})
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {checkpointPhotos.slice(0, 6).map((photo) => (
                              <div
                                key={photo.id}
                                className="relative aspect-square bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] overflow-hidden"
                              >
                                <img
                                  src={photo.src}
                                  alt={photo.caption || "Memory"}
                                  className="w-full h-full object-cover"
                                  style={{ imageRendering: "pixelated" }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Photo button */}
                      <motion.button
                        onClick={() => setShowPhotoCapture(true)}
                        className="w-full mb-4 px-4 py-2 font-pixel text-xs md:text-sm rounded-lg border-2 bg-[hsl(200_60%_55%)] border-[hsl(200_50%_45%)] text-white hover:bg-[hsl(200_60%_60%)] transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Camera className="w-4 h-4" />
                        Add Photo
                      </motion.button>

                      {/* Location error message */}
                      {locationError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 p-3 bg-[hsl(0_70%_50%)] border-2 border-[hsl(0_60%_40%)] rounded-lg"
                        >
                          <p 
                            className="font-pixel text-[8px] md:text-[10px] text-white text-center"
                            style={{ 
                              textRendering: "optimizeSpeed",
                              WebkitFontSmoothing: "none",
                              MozOsxFontSmoothing: "unset",
                              fontSmooth: "never",
                            }}
                          >
                            {locationError}
                          </p>
                        </motion.div>
                      )}

                      {/* Done button */}
                      {(() => {
                        const eventIndex = itineraryState.findIndex(item => 
                          item.time === selectedEvent.time && 
                          item.title === selectedEvent.title
                        );
                        const isAlreadyDone = eventIndex >= 0 && itineraryState[eventIndex].isPast;
                        const hasLocation = eventIndex >= 0 && itineraryState[eventIndex].location;
                        
                        return (
                          <motion.button
                            onClick={() => {
                              if (eventIndex >= 0 && !isAlreadyDone) {
                                handleMarkAsDone(eventIndex);
                              } else {
                                setSelectedEvent(null);
                              }
                            }}
                            className={`w-full px-6 py-3 font-pixel text-sm md:text-base rounded-lg border-2 transition-all ${
                              isAlreadyDone
                                ? "bg-[hsl(120_50%_50%)] border-[hsl(120_40%_40%)] text-white cursor-default"
                                : isCheckingLocation
                                ? "bg-[hsl(30_50%_60%)] border-[hsl(30_40%_50%)] text-white cursor-wait"
                                : "bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] hover:scale-105 active:scale-95"
                            }`}
                            whileHover={!isAlreadyDone && !isCheckingLocation ? { scale: 1.05 } : {}}
                            whileTap={!isAlreadyDone && !isCheckingLocation ? { scale: 0.95 } : {}}
                            disabled={isAlreadyDone || isCheckingLocation}
                          >
                            {isAlreadyDone 
                              ? "✓ Completed" 
                              : isCheckingLocation 
                              ? "Checking Location..." 
                              : hasLocation
                              ? "check in (Location Required)"
                              : "check in"}
                          </motion.button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo Capture Modal */}
        {selectedEvent && (
          <PhotoCaptureModal
            isOpen={showPhotoCapture}
            onClose={() => setShowPhotoCapture(false)}
            onCapture={handlePhotoCapture}
            checkpointTitle={selectedEvent.title}
          />
        )}

        {/* Photo Editor */}
        {selectedEvent && capturedPhotoSrc && (
          <PhotoEditor
            photoSrc={capturedPhotoSrc}
            checkpointId={`${selectedEvent.time}-${selectedEvent.title}`}
            onSave={handlePhotoSave}
            onClose={() => {
              setShowPhotoEditor(false);
              setCapturedPhotoSrc("");
            }}
          />
        )}

        <Footer />
      </main>
    </>
  );
};

export default StampsPage;
