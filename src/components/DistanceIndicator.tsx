import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, NavigationOff, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DistanceIndicatorProps {
  targetLat: number;
  targetLng: number;
  radius: number; // in meters
  onArrived?: () => void;
}

// Haversine formula to calculate distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const DistanceIndicator: React.FC<DistanceIndicatorProps> = ({ targetLat, targetLng, radius, onArrived }) => {
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const currentDistance = getDistance(latitude, longitude, targetLat, targetLng);
        setDistance(currentDistance);

        if (currentDistance <= radius && !hasArrived) {
          setHasArrived(true);
          setTimeout(() => {
            onArrived?.();
          }, 2500);
        }
      },
      (err) => {
        setIsLocating(false);
        setError(err.message || "Failed to get location. Please enable GPS permissions.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [targetLat, targetLng, radius, hasArrived, onArrived]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-xl border border-border bg-foreground/5 min-h-[240px]">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <NavigationOff className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-medium text-foreground mb-1">Location Unavailable</h3>
          <p className="text-sm text-muted-foreground max-w-[250px]">{error}</p>
        </div>
      </div>
    );
  }

  if (isLocating || distance === null) {
    return (
      <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-border bg-foreground/5 min-h-[240px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">
          Locating...
        </p>
      </div>
    );
  }

  // Determine styling and animation based on distance
  let colorClass = "border-muted";
  let pulseDuration = 3;
  let textColorClass = "text-muted-foreground";
  
  if (hasArrived || distance <= radius) {
    colorClass = "border-rose bg-rose";
    pulseDuration = 1;
    textColorClass = "text-white";
  } else if (distance < 100) {
    colorClass = "border-primary";
    pulseDuration = 1.5;
    textColorClass = "text-primary";
  } else if (distance < 500) {
    colorClass = "border-secondary";
    pulseDuration = 2;
    textColorClass = "text-secondary";
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[240px] p-6 rounded-xl overflow-hidden bg-background border border-border shadow-sm">
      {/* Background ripples */}
      {!hasArrived && (
        <>
          <motion.div
            className={cn("absolute rounded-full border-2", colorClass)}
            style={{ width: "100px", height: "100px", opacity: 0.1 }}
            animate={{
              scale: [1, 2.5],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: pulseDuration,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.div
            className={cn("absolute rounded-full border-2", colorClass)}
            style={{ width: "100px", height: "100px", opacity: 0.1 }}
            animate={{
              scale: [1, 2.5],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: pulseDuration,
              repeat: Infinity,
              ease: "easeOut",
              delay: pulseDuration / 2,
            }}
          />
        </>
      )}

      {/* Center Circle */}
      <motion.div
        className={cn(
          "relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg border-[3px] bg-background",
          colorClass,
          hasArrived && "bg-rose border-rose text-white"
        )}
        animate={hasArrived ? {
          scale: [1, 1.2, 1],
          transition: { duration: 0.5 }
        } : {}}
      >
        {hasArrived ? (
          <>
            <CheckCircle2 className="w-8 h-8 mb-1" />
            <span className="font-bold text-xs uppercase tracking-wider">Arrived</span>
          </>
        ) : (
          <>
            <MapPin className={cn("w-6 h-6 mb-1", textColorClass)} />
            <div className="flex flex-col items-center">
              <span className={cn("font-bold text-lg leading-none", textColorClass)}>
                {distance < 1000 ? Math.round(distance) : (distance / 1000).toFixed(1)}
              </span>
              <span className={cn("text-[10px] uppercase font-mono tracking-wider opacity-70", textColorClass)}>
                {distance < 1000 ? "meters" : "km"}
              </span>
            </div>
          </>
        )}
      </motion.div>

      {/* Text label underneath */}
      <div className="mt-6 text-center z-10">
        <h3 className="font-semibold text-lg text-foreground">
          {hasArrived ? "You've arrived!" : "Secret Location"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
          {hasArrived 
            ? "You've successfully reached the secret destination." 
            : "Follow the distance indicator to find your next stop."}
        </p>
      </div>
    </div>
  );
};

export default DistanceIndicator;
