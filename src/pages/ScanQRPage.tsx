import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import QrScanner from "qr-scanner";
import { toast } from "@/hooks/use-toast";
import { useAdventure } from "@/contexts/AdventureContext";
import { redeemCoupon } from "@/utils/redeemCoupon";
import { Helmet } from "react-helmet-async";

const ScanQRPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  /* A ref, not state: the scan callback closes over its scope once, so a state
     flag would still read `false` on every frame after the first hit. */
  const busyRef = useRef(false);
  const navigate = useNavigate();
  const { coupons, user } = useAdventure();
  const totalCouponsRef = useRef(coupons.length);
  totalCouponsRef.current = coupons.length;

  /** Show the problem, then hand the camera back so they can try again. */
  const rejectScan = useCallback((title: string, description: string) => {
    toast({ variant: "destructive", title, description });
    window.setTimeout(() => {
      busyRef.current = false;
      scannerRef.current?.start().catch((error) => {
        console.error("Error restarting QR scanner:", error);
      });
    }, 2000);
  }, []);

  const handleQRScan = useCallback(
    async (qrData: string) => {
      const trimmedData = qrData.trim();

      let parsedData: { code?: string; couponId?: number; title?: string };
      try {
        parsedData = JSON.parse(trimmedData);
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "Data:", trimmedData);
        rejectScan("Invalid QR code", "This QR code is not a valid coupon code.");
        return;
      }

      const couponId = parsedData.couponId;
      if (typeof couponId !== "number") {
        rejectScan("Invalid coupon", "This QR code does not contain a valid coupon ID.");
        return;
      }

      if (!user) {
        rejectScan("Not signed in", "Sign in on this device before redeeming a coupon.");
        return;
      }

      const result = await redeemCoupon(couponId, totalCouponsRef.current);

      if (result.status === "error") {
        rejectScan("Redemption failed", "Unable to redeem coupon. Please try again.");
        return;
      }

      if (result.status === "already") {
        rejectScan("Already Used!", "This coupon has already been redeemed.");
        return;
      }

      navigate("/redemption-success", {
        state: { couponTitle: parsedData.title || "Coupon", couponId },
      });
    },
    [navigate, rejectScan, user]
  );

  const handleScanRef = useRef(handleQRScan);
  handleScanRef.current = handleQRScan;

  useEffect(() => {
    if (!videoRef.current) return;
    let cancelled = false;

    const startScanner = async () => {
      try {
        if (!(await QrScanner.hasCamera())) {
          toast({
            variant: "destructive",
            title: "Camera not available",
            description: "Your device doesn't have a camera or camera access is not supported.",
          });
          navigate("/coupons");
          return;
        }
        if (cancelled) return;

        const qrScanner = new QrScanner(
          videoRef.current!,
          async (result) => {
            if (busyRef.current) return;
            busyRef.current = true;
            // Stop first so a second frame can't fire while the write is in flight.
            qrScanner.stop();
            await handleScanRef.current(result.data);
          },
          {
            highlightScanRegion: false,
            highlightCodeOutline: false,
          }
        );

        scannerRef.current = qrScanner;
        await qrScanner.start();
        if (cancelled) qrScanner.stop();
      } catch (error) {
        console.error("Error starting QR scanner:", error);
        toast({
          variant: "destructive",
          title: "Camera error",
          description: "Unable to access camera. Please check permissions and try again.",
        });
        navigate("/coupons");
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
    // Mounts the camera once. The scan handler is reached through a ref so a
    // re-render never tears the video stream down mid-scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    scannerRef.current?.destroy();
    scannerRef.current = null;
    navigate("/coupons");
  };

  return (
    <>
      <Helmet>
        <title>Scan QR Code - Your Special Day</title>
      </Helmet>
      <div className="fixed inset-0 z-50 bg-black">
        {/* Camera Video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Viewfinder with transparent center */}
        <div className="absolute inset-0">
          {/* Dark overlay sections to create square cutout */}
          {/* Top section */}
          <div className="absolute top-0 left-0 right-0 h-[calc((100vh-256px)/2)] md:h-[calc((100vh-320px)/2)] bg-black/60" />
          {/* Bottom section */}
          <div className="absolute bottom-0 left-0 right-0 h-[calc((100vh-256px)/2)] md:h-[calc((100vh-320px)/2)] bg-black/60" />
          {/* Left section */}
          <div className="absolute top-[calc((100vh-256px)/2)] md:top-[calc((100vh-320px)/2)] left-0 w-[calc((100vw-256px)/2)] md:w-[calc((100vw-320px)/2)] h-64 md:h-80 bg-black/60" />
          {/* Right section */}
          <div className="absolute top-[calc((100vh-256px)/2)] md:top-[calc((100vh-320px)/2)] right-0 w-[calc((100vw-256px)/2)] md:w-[calc((100vw-320px)/2)] h-64 md:h-80 bg-black/60" />

          {/* Viewfinder frame */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 z-10">
            {/* Pulsating border */}
            <motion.div
              className="absolute inset-0 border-4 border-white rounded-lg"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Corner indicators */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-32 left-0 right-0 text-center px-4">
          <p className="text-white text-lg font-medium">
            Position the QR code within the frame
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </>
  );
};

export default ScanQRPage;

