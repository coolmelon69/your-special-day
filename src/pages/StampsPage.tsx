import { Helmet } from "react-helmet-async";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Trash2, Loader2, Navigation, MapPin, Check } from "lucide-react";
import { Eyebrow, DisplayHeading, EditorialFigure, Pill, StatBlock } from "@/components/editorial";
import { cn } from "@/lib/utils";
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
import DistanceIndicator from "@/components/DistanceIndicator";

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

  // Derived progress for the editorial hero
  const completedStamps = itineraryState.filter((i) => i.isPast).length;
  const totalStamps = itineraryState.length;
  const nextStop = itineraryState.find((i) => !i.isPast);

  return (
    <>
      <Helmet>
        <title>Stamp Collection - Your Special Day</title>
        <meta name="description" content="View your collected adventure stamps" />
      </Helmet>

      <main className="overflow-x-hidden pt-16 md:pt-20">
        {/* Editorial hero */}
        <section className="py-14 md:py-24">
          <div className="container px-6 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Eyebrow no="Nº 01">The Itinerary</Eyebrow>
              <DisplayHeading className="mt-4">
                Every <em>stop</em> we make becomes <strong>a stamp</strong> we keep
                <span className="dot-accent">.</span>
              </DisplayHeading>
              <p className="text-lg text-muted-foreground max-w-[52ch] mt-6">
                Check in at each place along the way. Snap a memory, press the stamp, and
                watch the day fill in — every checkpoint unlocks a little reward.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <EditorialFigure
                src="/images/gallery/pic1.JPG"
                alt="A moment from your special day"
                dotGrid="tl"
                aspectClassName="aspect-square"
                annotate={
                  <>
                    {totalStamps} stops,
                    <br />
                    one day worth
                    <br />
                    keeping.
                  </>
                }
                caption="Your special day"
              >
                {/* floating keepsake card — live progress */}
                <div className="absolute right-3 -bottom-6 w-[15rem] bg-card border border-border rounded-2xl p-[18px] shadow-romantic hidden lg:block">
                  <Eyebrow className="mb-2.5">Today</Eyebrow>
                  <div className="flex items-baseline justify-between">
                    <span className="font-serif font-bold text-rose text-[40px] leading-none">
                      {completedStamps}
                      <span className="text-muted-foreground text-xl">/{totalStamps}</span>
                    </span>
                    <Pill variant="rose" icon={<Check />}>
                      Stamped
                    </Pill>
                  </div>
                  {nextStop && (
                    <p className="font-mono text-[11px] text-muted-foreground mt-2">
                      Next: {nextStop.title}, {nextStop.time}
                    </p>
                  )}
                </div>
              </EditorialFigure>
            </motion.div>
          </div>
        </section>

        {/* Progress stats */}
        <section className="py-12 md:py-16 border-t border-border">
          <div className="container px-6">
            <Eyebrow className="mb-10">By the day <span className="no">· so far</span></Eyebrow>
            <div className="grid sm:grid-cols-3 gap-10">
              <StatBlock
                value={completedStamps}
                unit={`/ ${totalStamps}`}
                label="stamps collected — keep going, the day's just warming up."
              />
              <StatBlock
                value={totalStamps - completedStamps}
                label="checkpoints still ahead of you today."
              />
              <StatBlock
                value={`${totalStamps ? Math.round((completedStamps / totalStamps) * 100) : 0}%`}
                label="of the day complete and stamped in."
              />
            </div>
          </div>
        </section>

        {/* Loading State */}
        {isLoadingStamps ? (
          <div className="min-h-[400px] flex items-center justify-center bg-background">
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="mx-auto mb-4 text-primary w-8 h-8 animate-spin" />
              <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">
                Loading your stamps…
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
                {/* Editorial modal card */}
                <div className="relative bg-card border border-border rounded-2xl p-6 md:p-7 shadow-romantic">
                  {/* Close button */}
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      setLocationError(null);
                    }}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Content */}
                  <div>
                    {(() => {
                      const eventIndex = itineraryState.findIndex(item =>
                        item.time === selectedEvent.time &&
                        item.title === selectedEvent.title
                      );
                      const currentItem = eventIndex >= 0 ? itineraryState[eventIndex] : selectedEvent;
                      const isSecretUncollected = currentItem.is_secret && !currentItem.isPast;

                      if (isSecretUncollected && currentItem.location) {
                        return (
                          <>
                            <div className="mb-4">
                              <DistanceIndicator
                                targetLat={currentItem.location.latitude}
                                targetLng={currentItem.location.longitude}
                                radius={currentItem.location.radius || 100}
                                onArrived={() => {
                                  if (eventIndex >= 0) {
                                    handleMarkAsDone(eventIndex);
                                  }
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <Pill variant="rose">{currentItem.time}</Pill>
                            </div>
                            <DisplayHeading as="h2" className="text-2xl md:text-3xl mb-3">
                              Mystery Stop
                            </DisplayHeading>
                            <p className="text-muted-foreground leading-relaxed mb-5">
                              Follow the indicator to discover this secret location!
                            </p>
                          </>
                        );
                      }

                      return (
                        <>
                          {/* Sprite preview or Evidence Image */}
                          {(() => {
                            const showImage = currentItem.isPast && currentItem.imageUrl;
                            const SpriteComponent = sprites[selectedEvent.sprite];

                      return (
                        <div className={cn(
                          "w-20 h-20 mb-4 rounded-xl border border-border bg-foreground/5 overflow-hidden",
                          showImage ? "" : "grid place-items-center"
                        )}>
                          {showImage ? (
                            <img
                              src={currentItem.imageUrl!}
                              alt={currentItem.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12">
                              <SpriteComponent isActive={currentItem.isActive} isPast={currentItem.isPast} />
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Time pill + location */}
                    <div className="flex items-center gap-2 mb-3">
                      <Pill variant="rose">{selectedEvent.time}</Pill>
                      {selectedEvent.location && (
                        <Pill variant="tag" icon={<MapPin />}>
                          Location set
                        </Pill>
                      )}
                    </div>

                    {/* Title */}
                    <DisplayHeading as="h2" className="text-2xl md:text-3xl mb-3">
                      {isSecretUncollected ? "Mystery Stop" : selectedEvent.title}
                    </DisplayHeading>

                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed mb-5">
                      {selectedEvent.description}
                    </p>

                    {/* Photos section */}
                    {checkpointPhotos.length > 0 && (
                      <div className="mb-5">
                        <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                          Memories ({checkpointPhotos.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {checkpointPhotos.slice(0, 6).map((photo) => (
                            <div
                              key={photo.id}
                              className="relative aspect-square rounded-lg border border-border bg-foreground/5 overflow-hidden group"
                            >
                              <img
                                src={photo.storageUrl || photo.src}
                                alt={photo.caption || "Memory"}
                                className="w-full h-full object-cover"
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
                                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:brightness-110 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-wait"
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
                              className="flex-1 px-4 py-3 text-sm font-medium rounded-[10px] border border-border text-foreground hover:border-foreground transition-all flex items-center justify-center gap-2"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <Navigation className="w-4 h-4" />
                              Navigate
                            </motion.button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="min-w-[11rem] border border-border bg-popover"
                          >
                            <DropdownMenuItem
                              onClick={() => handleOpenNavigate("google")}
                              className="text-sm cursor-pointer"
                            >
                              <MapPin className="w-4 h-4 mr-2" />
                              Open in Google Maps
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenNavigate("waze")}
                              className="text-sm cursor-pointer"
                            >
                              <Navigation className="w-4 h-4 mr-2" />
                              Open in Waze
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      <motion.button
                        onClick={() => setShowPhotoCapture(true)}
                        className="flex-1 px-4 py-3 text-sm font-medium rounded-[10px] border border-border text-foreground hover:border-foreground transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
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
                        className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
                      >
                        <p className="text-sm text-destructive text-center">
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
                          className={`w-full px-6 py-3 text-base font-medium rounded-[10px] border transition-all flex items-center justify-center gap-2 ${
                            isAlreadyDone
                              ? "bg-green-500 border-green-500 text-white cursor-default"
                              : isCheckingLocation
                              ? "bg-muted border-border text-muted-foreground cursor-wait"
                              : "bg-rose border-rose text-white hover:brightness-95"
                          }`}
                          whileHover={!isAlreadyDone && !isCheckingLocation ? { scale: 1.02 } : {}}
                          whileTap={!isAlreadyDone && !isCheckingLocation ? { scale: 0.97 } : {}}
                          disabled={isAlreadyDone || isCheckingLocation}
                        >
                          {isAlreadyDone
                            ? <><Check className="w-4 h-4" /> Completed</>
                            : isCheckingLocation
                            ? "Checking location…"
                            : hasLocation
                            ? "Check in (location required)"
                            : "Check in"}
                        </motion.button>
                      );
                    })()}
                        </>
                      );
                    })()}
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
