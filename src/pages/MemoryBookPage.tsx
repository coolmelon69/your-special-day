import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, BookOpen, Trash2, X, Calendar, MapPin, Images } from "lucide-react";
import { useAdventure } from "@/contexts/AdventureContext";
import { generateMemoryBookPages, generateMemoryBookHTML, downloadMemoryBook } from "@/utils/memoryBookGenerator";
import type { MemoryBookPage } from "@/utils/memoryBookGenerator";
import type { Photo } from "@/components/TimelineSection";
import { useLocation } from "react-router-dom";
import { loadCouponAchievements } from "@/utils/supabaseSync";
import TimeCapsule from "@/components/TimeCapsule";

const ACHIEVEMENT_STORAGE_KEY = "coupon-achievements";

function convertCouponId(id: number | string): number {
  if (typeof id === "number") return id;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return 10000 + Math.abs(hash);
}

const MemoryBookPage = () => {
  const { getAllPhotos, itineraryState, deletePhoto, refreshPhotos, reloadPhotosFromCloud, user, coupons } = useAdventure();
  const location = useLocation();
  const [pages, setPages] = useState<MemoryBookPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ photo: Photo; page: MemoryBookPage } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadMemoryBook = async () => {
    setIsLoading(true);
    try {
      if (user) {
        await reloadPhotosFromCloud();
      }
      const photos = await getAllPhotos();
      const memoryPages = generateMemoryBookPages(photos, itineraryState);
      setPages(memoryPages);
    } catch (error) {
      console.error("Error loading memory book:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname === "/memory-book") {
      loadMemoryBook();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, itineraryState, user]);

  const handleDeletePhoto = async (photoId: string, closeModalAfterDelete = false) => {
    if (!window.confirm("Are you sure you want to delete this photo? This cannot be undone.")) {
      return;
    }
    setDeletingPhotoId(photoId);
    try {
      await deletePhoto(photoId);
      await refreshPhotos();
      await loadMemoryBook();
      if (closeModalAfterDelete) {
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo. Please try again.");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const stampsCompleted = itineraryState.filter((item) => item.isPast).length;
      const stampsTotal = itineraryState.length;
      let couponsRedeemed = 0;
      let redeemedCouponIds: number[] = [];
      if (user) {
        const remote = await loadCouponAchievements();
        redeemedCouponIds = remote?.data?.redeemedCouponIds ?? [];
        couponsRedeemed = redeemedCouponIds.length;
      }
      const redeemedCouponTitles = redeemedCouponIds.map((rid) => {
        const coupon = coupons.find((c) => convertCouponId(c.id) === rid);
        return coupon ? coupon.title : "Treasure claimed";
      });
      const displayCouponsRedeemed = redeemedCouponTitles.filter((t) => t !== "Treasure claimed").length;
      const stats = { stampsCompleted, stampsTotal, couponsRedeemed, redeemedCouponTitles, displayCouponsRedeemed };
      const html = await generateMemoryBookHTML(pages, stats);
      downloadMemoryBook(html);
    } catch (error) {
      console.error("Error generating memory book:", error);
      alert("Failed to generate memory book. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePhotoClick = (photo: Photo, page: MemoryBookPage) => {
    setSelectedPhoto({ photo, page });
  };

  const handleCloseModal = () => {
    setSelectedPhoto(null);
  };

  useEffect(() => {
    if (!selectedPhoto) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedPhoto(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedPhoto]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BookOpen className="mx-auto mb-4 text-primary animate-pulse-soft" size={40} />
          <p className="font-serif text-xl text-muted-foreground font-light">Loading memories…</p>
        </motion.div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <>
        <Helmet>
          <title>Memory Book — Your Special Day</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-background pt-20 px-4">
          <motion.div
            className="text-center max-w-md mx-auto bg-card border border-border rounded-2xl p-12 shadow-lavender"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Images className="text-primary" size={28} />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
              No Memories Yet.
            </h2>
            <p className="font-sans font-light text-muted-foreground leading-relaxed">
              Start capturing photos at stamps to build your memory book — every adventure deserves a page.
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  const totalPhotos = pages.reduce((sum, page) => sum + page.photos.length, 0);

  return (
    <>
      <Helmet>
        <title>Memory Book — Your Special Day</title>
      </Helmet>

      <main className="min-h-screen bg-background pt-20 pb-24">
        <div className="container px-4 md:px-6 py-12">

          {/* Page header */}
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono-caption text-primary/70 mb-4">our story</p>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold text-foreground mb-3">
              Memory <span className="text-gradient-romantic">Book</span>
            </h1>
            <p className="font-sans font-light text-muted-foreground text-lg mb-8">
              {totalPhotos} {totalPhotos === 1 ? "memory" : "memories"} captured together
            </p>

            <motion.button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-full font-sans font-medium text-sm shadow-romantic hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!isDownloading ? { y: -2 } : {}}
              whileTap={!isDownloading ? { scale: 0.98 } : {}}
            >
              <Download size={16} />
              {isDownloading ? "Generating…" : "Download Memory Book"}
            </motion.button>
          </motion.div>

          {/* Memory pages */}
          <div className="space-y-10 max-w-4xl mx-auto">
            {pages.map((page, pageIndex) => (
              <motion.div
                key={`${page.checkpoint.time}-${page.checkpoint.title}`}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-lavender"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pageIndex * 0.08, duration: 0.5 }}
              >
                {/* Chapter header */}
                <div className="px-6 md:px-8 py-6 border-b border-border bg-accent/40">
                  <span className="font-mono-caption text-primary/60 mb-2 block">
                    {page.checkpoint.time}
                  </span>
                  <h2 className="font-serif text-xl md:text-2xl font-semibold text-foreground mb-1">
                    {page.checkpoint.title}
                  </h2>
                  <p className="font-sans font-light text-sm text-muted-foreground leading-relaxed">
                    {page.checkpoint.description}
                  </p>
                </div>

                {/* Photos grid */}
                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 items-start">
                    {page.photos.map((photo, photoIndex) => (
                      <motion.div
                        key={photo.id}
                        className="relative group rounded-xl overflow-hidden border border-border bg-accent/30 hover:border-primary/40 hover:shadow-romantic transition-all duration-200 cursor-pointer"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: pageIndex * 0.08 + photoIndex * 0.04 }}
                        whileHover={{ y: -2 }}
                        onClick={() => handlePhotoClick(photo, page)}
                      >
                        {/* Delete button */}
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id, false); }}
                          disabled={deletingPhotoId === photo.id}
                          className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Delete photo"
                        >
                          <Trash2 size={12} />
                        </motion.button>

                        <img
                          src={photo.storageUrl || photo.src}
                          alt={photo.caption || "Memory"}
                          className="w-full h-auto block"
                        />
                        {photo.caption && (
                          <p className="font-mono-caption text-primary/70 text-center px-2 py-2">
                            {photo.caption}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Time Capsule */}
        <div className="max-w-4xl mx-auto mt-4">
          <TimeCapsule />
        </div>

        {/* Photo Detail Modal */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            >
              <motion.div
                className="relative bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-glow"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-accent/40">
                  <div>
                    <span className="font-mono-caption text-primary/60 block">
                      {selectedPhoto.page.checkpoint.time}
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {selectedPhoto.page.checkpoint.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => handleDeletePhoto(selectedPhoto.photo.id, true)}
                      disabled={deletingPhotoId === selectedPhoto.photo.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm font-sans font-medium hover:bg-destructive hover:text-destructive-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </motion.button>
                    <motion.button
                      onClick={handleCloseModal}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={18} />
                    </motion.button>
                  </div>
                </div>

                {/* Image */}
                <div className="p-6 md:p-8">
                  <img
                    src={selectedPhoto.photo.storageUrl || selectedPhoto.photo.src}
                    alt={selectedPhoto.photo.caption || "Memory"}
                    className="w-full h-auto object-contain max-h-[55vh] mx-auto rounded-xl"
                  />

                  {/* Details */}
                  <div className="mt-6 space-y-3">
                    {selectedPhoto.photo.caption && (
                      <div className="bg-accent/50 border border-border rounded-xl px-4 py-3">
                        <p className="font-serif text-base text-foreground/90 italic">
                          "{selectedPhoto.photo.caption}"
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-sans font-light">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} />
                        {selectedPhoto.page.checkpoint.description}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {formatTimestamp(selectedPhoto.photo.timestamp)}
                      </span>
                    </div>

                    {selectedPhoto.photo.filter && selectedPhoto.photo.filter !== "none" && (
                      <p className="font-mono-caption text-muted-foreground">
                        filter: {selectedPhoto.photo.filter}
                        {selectedPhoto.photo.filterIntensity !== undefined &&
                          selectedPhoto.photo.filterIntensity !== 100 &&
                          ` · ${selectedPhoto.photo.filterIntensity}%`}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
};

export default MemoryBookPage;
