import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { fetchPlace } from "@/utils/googlePlaces";

interface LocationCardProps {
  spot: string;
  activity: string;
  cost: string;
  searchUrl: string;
  imageUrl: string | null;
  locationName: string;
  onImageUpdate: (url: string) => void;
  onPlaceIdUpdate?: (locationName: string, placeId: string) => void;
}

const LocationCard = ({
  spot,
  activity,
  cost,
  searchUrl,
  imageUrl,
  locationName,
  onImageUpdate,
  onPlaceIdUpdate,
}: LocationCardProps) => {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(imageUrl || null);
  const [isLoading, setIsLoading] = useState(!imageUrl);

  // Sync when a parent-provided URL arrives later.
  useEffect(() => {
    if (imageUrl) {
      setCurrentImageUrl(imageUrl);
      setIsLoading(false);
    }
  }, [imageUrl]);

  // Resolve a Google photo for this location if we don't already have one.
  useEffect(() => {
    let cancelled = false;

    const resolvePhoto = async () => {
      const { photoUrl, placeId } = await fetchPlace(locationName);
      if (cancelled) return;
      if (placeId) onPlaceIdUpdate?.(locationName, placeId);
      if (photoUrl) {
        setCurrentImageUrl(photoUrl);
        onImageUpdate(photoUrl);
      }
      setIsLoading(false);
    };

    if (!imageUrl) {
      resolvePhoto();
    } else {
      // Verify the supplied URL still loads; re-fetch fresh if it fails.
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        setCurrentImageUrl(imageUrl);
        setIsLoading(false);
      };
      img.onerror = () => {
        if (cancelled) return;
        setIsLoading(true);
        resolvePhoto();
      };
      img.src = imageUrl;
    }

    return () => {
      cancelled = true;
    };
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
        {isLoading ? (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30 flex items-center justify-center">
            <span className="text-2xl animate-pulse">📍</span>
          </div>
        ) : currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt={`${spot} location`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            onError={() => setCurrentImageUrl(null)}
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

export default LocationCard;
