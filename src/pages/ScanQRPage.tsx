import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import QrScanner from "qr-scanner";
import { toast } from "@/hooks/use-toast";
import { useAdventure } from "@/contexts/AdventureContext";
import { redeemCoupon } from "@/utils/redeemCoupon";
import { claimMysteryGift, extractGiftCode } from "@/utils/mysteryGifts";
import { Helmet } from "react-helmet-async";

const ScanQRPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  /* A ref, not state: the scan callback closes over its scope once, so a state
     flag would still read `false` on every frame after the first hit. */
  const busyRef = useRef(false);
  const navigate = useNavigate();
  const { coupons, user, refreshCoupons } = useAdventure();
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

      /* Mystery Gift cards come first: they carry {"gift":"CODE"} or a bare
         code, neither of which the coupon parse below would recognise. A
         coupon QR falls straight through — extractGiftCode returns null for
         it. See src/utils/mysteryGiftCode.ts. */
      const giftCode = extractGiftCode(trimmedData);
      if (giftCode) {
        if (!user) {
          rejectScan("Not signed in", "Sign in on this device before opening a gift.");
          return;
        }

        const claim = await claimMysteryGift(giftCode);

        if (claim.status === "claimed") {
          await refreshCoupons();
          navigate("/gift-reveal", {
            state: { payload: claim.payload, id: claim.id },
          });
          return;
        }

        if (claim.status === "already") {
          rejectScan("Already opened", "This gift has already found its home.");
          return;
        }
        if (claim.status === "invalid") {
          rejectScan("Unknown card", "This code isn't one of ours.");
          return;
        }
        if (claim.status === "unauthenticated") {
          rejectScan("Not signed in", "Sign in on this device before opening a gift.");
          return;
        }
        rejectScan("Something went wrong", "Could not open this gift. Please try again.");
        return;
      }

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
    [navigate, refreshCoupons, rejectScan, user]
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
      {createPortal(
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

        {/* Instructions + the way out when the camera can't read the card */}
        <div className="absolute bottom-24 left-0 right-0 px-4 text-center">
          <p className="text-lg font-medium text-white">
            Position the QR code within the frame
          </p>
          <button
            type="button"
            onClick={() => {
              scannerRef.current?.destroy();
              scannerRef.current = null;
              navigate("/coupons?claim=1");
            }}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Keyboard className="h-4 w-4" aria-hidden="true" />
            Type the code instead
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>,
        document.body
      )}
    </>
  );
};

export default ScanQRPage;

