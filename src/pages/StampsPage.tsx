import { Helmet } from "react-helmet-async";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Trash2, Loader2, Navigation, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "react-router-dom";
import StampCollectionSection from "@/components/StampCollectionSection";
import Footer from "@/components/Footer";
import { useAdventure } from "@/contexts/AdventureContext";
import { sprites, type ItineraryItem, checkLocation, type Photo as PhotoType } from "@/components/TimelineSection";
import { playStampSound } from "@/utils/sound";
import PhotoCaptureModal from "@/components/PhotoCaptureModal";
import PhotoEditor from "@/components/PhotoEditor";
import { syncCheckpointPhoto, syncSingleStamp } from "@/utils/supabaseSync";
import { uploadPhotoToStorage } from "@/utils/photoUpload";

const StampsPage = () => {
  const location = useLocation();
  const { itineraryState, resetProgress, setItineraryState, addPhoto, upsertPhoto, getPhotosByCheckpoint, deletePhoto, reloadStampsFromCloud, user } = useAdventure();
  const [isLoadingStamps, setIsLoadingStamps] = useState(false);
  const hasLoadedOnMountRef = useRef(false);
  const [selectedEvent, setSelectedEvent] = useState<ItineraryItem | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [capturedPhotoSrc, setCapturedPhotoSrc] = useState<string>("");
  const [checkpointPhotos, setCheckpointPhotos] = useState<PhotoType[]>([]);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  // Reload stamps data from Supabase when navigating to this page
  // This ensures fresh data every time the user visits the Stamps page
  const previousPathnameRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only reload if user is authenticated and we're on the stamps route
    if (location.pathname === "/stamps" && user) {
      const isNavigatingToStamps = previousPathnameRef.current !== "/stamps";
      previousPathnameRef.current = location.pathname;

      const loadFreshData = async () => {
        // On initial mount, reload silently (don't show loading spinner)
        if (!hasLoadedOnMountRef.current) {
          hasLoadedOnMountRef.current = true;
          try {
            console.log("Loading fresh stamps data on initial mount...");
            await reloadStampsFromCloud();
          } catch (error) {
            console.error("Error loading stamps on mount:", error);
          }
          return;
        }

        // For subsequent navigations TO this page, show loading and reload fresh data
        if (isNavigatingToStamps) {
          setIsLoadingStamps(true);
          try {
            console.log("Reloading stamps from Supabase on navigation...");
            await reloadStampsFromCloud();
            console.log("Stamps reloaded successfully");
          } catch (error) {
            console.error("Error reloading stamps:", error);
          } finally {
            setIsLoadingStamps(false);
          }
        }
      };

      loadFreshData();
    } else {
      // Track pathname even when not on stamps page
      previousPathnameRef.current = location.pathname;
    }
  }, [location.pathname, user, reloadStampsFromCloud]);

  // Load photos for selected checkpoint
  useEffect(() => {
    if (selectedEvent) {
      const checkpointId = `${selectedEvent.time}-${selectedEvent.title}`;
      getPhotosByCheckpoint(checkpointId).then(setCheckpointPhotos);
    }
  }, [selectedEvent, getPhotosByCheckpoint]);

  const handleMarkAsDone = async (eventIndex: number) => {
    const item = itineraryState[eventIndex];
    
    // Helper function to update state and sync
    const updateStampAndSync = async (updatedItem: ItineraryItem) => {
      // Update local state first
      setItineraryState(prev => {
        const updated = [...prev];
        const wasActive = prev[eventIndex].isActive; // Check state BEFORE modification
        updated[eventIndex] = updatedItem;
        // If this was the active event, activate the next one
        if (wasActive) {
          const nextIndex = eventIndex + 1;
          if (nextIndex < updated.length) {
            updated[nextIndex] = { ...updated[nextIndex], isActive: true };
          }
        }
        return updated;
      });

      // Immediately sync to Supabase (like coupons do)
      try {
        const success = await syncSingleStamp(updatedItem);
        if (success) {
          console.log(`Stamp ${updatedItem.title} synced successfully to Supabase`);
        } else {
          console.warn(`Failed to sync stamp ${updatedItem.title} to Supabase`);
        }
      } catch (error) {
        console.error(`Error syncing stamp ${updatedItem.title}:`, error);
        // Non-blocking: continue even if sync fails (the debounced sync in context will retry)
      }
    };

    // If no location is set for this item, allow marking as done without location check
    if (!item.location) {
      const now = new Date().toISOString();
      const updatedItem = { 
        ...item, 
        isPast: true, 
        isActive: false,
        checkedAt: now // Set timestamp immediately so it shows in UI right away
      };
      await updateStampAndSync(updatedItem);
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
    checkLocation(item.location).then(async (locationResult) => {
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

      // Location check passed, mark as done and sync
      setIsCheckingLocation(false);
      setLocationError(null);
      const now = new Date().toISOString();
      const updatedItem = { 
        ...item, 
        isPast: true, 
        isActive: false,
        checkedAt: now // Set timestamp immediately so it shows in UI right away
      };
      await updateStampAndSync(updatedItem);
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
      // Generate unique photo ID
      const photoId = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const stampKey = `${selectedEvent?.time || ""}-${selectedEvent?.title || ""}`;
      const timestamp = Date.now();
      
      // Upload photo to Supabase Storage if user is authenticated
      let storageUrl: string | undefined = undefined;
      if (user && photoData.src) {
        try {
          console.log("Uploading photo to Supabase Storage...");
          const uploadedUrl = await uploadPhotoToStorage(photoData.src, stampKey, photoId);
          if (uploadedUrl) {
            storageUrl = uploadedUrl;
            console.log("Photo uploaded successfully:", uploadedUrl);
          } else {
            console.warn("Photo upload failed, saving locally only");
          }
        } catch (uploadError) {
          console.error("Error uploading photo:", uploadError);
          // Continue with local save even if upload fails
        }
      }

      // Create a stable Photo object (same id across devices via Supabase metadata)
      const photoToSave: PhotoType = {
        ...photoData,
        id: photoId,
        timestamp,
        storageUrl,
      };

      // Save locally with stable ID (upsert to avoid collisions)
      await upsertPhoto(photoToSave);

      // Sync photo metadata to Supabase for cross-device Memory Book
      if (user && storageUrl) {
        try {
          await syncCheckpointPhoto(photoToSave);
        } catch (err) {
          console.warn("Failed to sync checkpoint photo metadata:", err);
        }
      }
      
      // If this is the first photo for this stamp and we have a storage URL,
      // update the stamp's image_url in the database
      if (selectedEvent && storageUrl && user) {
        try {
          const eventIndex = itineraryState.findIndex(item => 
            item.time === selectedEvent.time && 
            item.title === selectedEvent.title
          );
          
          if (eventIndex >= 0) {
            const currentItem = itineraryState[eventIndex];
            // Only update if stamp doesn't already have an image_url
            if (!currentItem.imageUrl) {
              const updatedItem = {
                ...currentItem,
                imageUrl: storageUrl,
              };
              await syncSingleStamp(updatedItem);
              // Update local state
              setItineraryState(prev => {
                const updated = [...prev];
                updated[eventIndex] = updatedItem;
                return updated;
              });
            }
          }
        } catch (error) {
          console.error("Error updating stamp image_url:", error);
          // Non-blocking: photo is already saved locally
        }
      }
      
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

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    try {
      setDeletingPhotoId(photoId);
      await deletePhoto(photoId);
      if (selectedEvent) {
        const checkpointId = `${selectedEvent.time}-${selectedEvent.title}`;
        const photos = await getPhotosByCheckpoint(checkpointId);
        setCheckpointPhotos(photos);
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo. Please try again.");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleOpenNavigate = (app: "google" | "waze") => {
    if (!selectedEvent?.location) return;
    const { latitude, longitude } = selectedEvent.location;
    const url =
      app === "google"
        ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        : `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    window.open(url, "_blank");
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
                Collect stamps as you complete each adventure to unlock coupons as rewards!
              </p>
            </motion.div>
          </div>
        </section>

        {/* Loading State */}
        {isLoadingStamps ? (
          <div className="min-h-[400px] flex items-center justify-center bg-[hsl(35_40%_85%)]">
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="mx-auto mb-4 text-[hsl(15_70%_40%)] w-8 h-8 animate-spin" />
              <p className="font-pixel text-sm md:text-base text-[hsl(15_60%_35%)]">
                Loading your stamps...
              </p>
            </motion.div>
          </div>
        ) : (
          <StampCollectionSection 
            itineraryState={itineraryState}
            onStampClick={handleStampClick}
            sprites={sprites}
          />
        )}

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
                      {/* Sprite preview or Evidence Image */}
                      <div className="w-16 h-16 mx-auto mb-4">
                        {(() => {
                          const eventIndex = itineraryState.findIndex(item => 
                            item.time === selectedEvent.time && 
                            item.title === selectedEvent.title
                          );
                          const currentItem = eventIndex >= 0 ? itineraryState[eventIndex] : selectedEvent;
                          const SpriteComponent = sprites[selectedEvent.sprite];
                          
                          // Show evidence image if available and stamp is completed
                          if (currentItem.isPast && currentItem.imageUrl) {
                            return (
                              <img
                                src={currentItem.imageUrl}
                                alt={currentItem.title}
                                className="w-full h-full object-cover rounded border-2 border-[hsl(15_70%_55%)]"
                                style={{ imageRendering: "pixelated" }}
                                onError={(e) => {
                                  // Fallback to sprite if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            );
                          }
                          
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
                                className="relative aspect-square bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] overflow-hidden group"
                              >
                                <img
                                  src={photo.storageUrl || photo.src}
                                  alt={photo.caption || "Memory"}
                                  className="w-full h-full object-cover"
                                  style={{ imageRendering: "pixelated" }}
                                  onError={(e) => {
                                    // Fallback to local src if storage URL fails
                                    const target = e.target as HTMLImageElement;
                                    if (photo.storageUrl && target.src !== photo.src) {
                                      target.src = photo.src;
                                    }
                                  }}
                                />
                                {/* Delete button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePhoto(photo.id);
                                  }}
                                  disabled={deletingPhotoId === photo.id}
                                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-[hsl(0_70%_50%)] border-2 border-[hsl(0_60%_40%)] text-white hover:bg-[hsl(0_70%_60%)] transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-wait"
                                  title="Delete photo"
                                >
                                  {deletingPhotoId === photo.id ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Photo and Navigate buttons - side by side */}
                      <div className="flex gap-2 mb-4">
                        {/* Navigate dropdown - only show if location exists */}
                        {selectedEvent.location && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <motion.button
                                className="flex-1 px-4 py-3 md:py-4 font-pixel text-xs md:text-sm rounded-lg border-2 bg-[hsl(280_60%_55%)] border-[hsl(280_50%_45%)] text-white hover:bg-[hsl(280_60%_60%)] transition-all flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Navigation className="w-4 h-4" />
                                Navigate
                              </motion.button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="min-w-[11rem] border-2 border-[hsl(30_50%_60%)] bg-[hsl(35_45%_92%)]"
                            >
                              <DropdownMenuItem
                                onClick={() => handleOpenNavigate("google")}
                                className="font-pixel text-xs cursor-pointer focus:bg-[hsl(280_40%_90%)]"
                              >
                                <MapPin className="w-4 h-4 mr-2" />
                                Open in Google Maps
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenNavigate("waze")}
                                className="font-pixel text-xs cursor-pointer focus:bg-[hsl(280_40%_90%)]"
                              >
                                <Navigation className="w-4 h-4 mr-2" />
                                Open in Waze
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        <motion.button
                          onClick={() => setShowPhotoCapture(true)}
                          className="flex-1 px-4 py-3 md:py-4 font-pixel text-xs md:text-sm rounded-lg border-2 bg-[hsl(200_60%_55%)] border-[hsl(200_50%_45%)] text-white hover:bg-[hsl(200_60%_60%)] transition-all flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Camera className="w-4 h-4" />
                          Add Photo
                        </motion.button>
                      </div>

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
