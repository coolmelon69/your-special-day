import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import QrScanner from "qr-scanner";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabaseClient";
import { Helmet } from "react-helmet-async";

const ScanQRPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    const startScanner = async () => {
      try {
        // Check if QR Scanner is supported
        if (!QrScanner.hasCamera()) {
          toast({
            variant: "destructive",
            title: "Camera not available",
            description: "Your device doesn't have a camera or camera access is not supported.",
          });
          navigate("/coupons");
          return;
        }

        // Create QR scanner instance
        const qrScanner = new QrScanner(
          videoRef.current!,
          async (result) => {
            if (hasScanned) return; // Prevent multiple scans
            setHasScanned(true);
            await handleQRScan(result);
          },
          {
            highlightScanRegion: false,
            highlightCodeOutline: false,
          }
        );

        scannerRef.current = qrScanner;
        await qrScanner.start();
        setIsScanning(true);
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
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      setIsScanning(false);
    };
  }, [hasScanned, navigate]);

  const handleQRScan = async (qrData: string) => {
    try {
      // Stop scanner immediately to prevent multiple scans
      if (scannerRef.current) {
        scannerRef.current.stop();
      }

      // Parse QR code data (format: JSON string with { code, couponId, title })
      let parsedData: { code?: string; couponId?: number; title?: string };
      try {
        parsedData = JSON.parse(qrData);
      } catch (parseError) {
        toast({
          variant: "destructive",
          title: "Invalid QR code",
          description: "This QR code is not a valid coupon code.",
        });
        // Restart scanner after a delay
        setTimeout(() => {
          setHasScanned(false);
          scannerRef.current?.start();
        }, 2000);
        return;
      }

      const couponId = parsedData.couponId;
      if (!couponId) {
        toast({
          variant: "destructive",
          title: "Invalid coupon",
          description: "This QR code does not contain a valid coupon ID.",
        });
        setTimeout(() => {
          setHasScanned(false);
          scannerRef.current?.start();
        }, 2000);
        return;
      }

      // Update coupon in Supabase
      if (!supabase) {
        toast({
          variant: "destructive",
          title: "Database error",
          description: "Unable to connect to database. Please try again later.",
        });
        setTimeout(() => {
          setHasScanned(false);
          scannerRef.current?.start();
        }, 2000);
        return;
      }

      const { data, error } = await supabase
        .from("coupons")
        .update({
          is_redeemed: true,
          redeemed_at: new Date().toISOString(),
        })
        .eq("id", couponId)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        toast({
          variant: "destructive",
          title: "Redemption failed",
          description: "Unable to redeem coupon. Please try again.",
        });
        setTimeout(() => {
          setHasScanned(false);
          scannerRef.current?.start();
        }, 2000);
        return;
      }

      // Check if coupon was already redeemed
      if (data && data.length > 0 && data[0].is_redeemed) {
        // Check if it was just redeemed now or was already redeemed
        const redeemedAt = new Date(data[0].redeemed_at);
        const now = new Date();
        const timeDiff = now.getTime() - redeemedAt.getTime();

        // If redeemed more than 1 second ago, it was already redeemed
        if (timeDiff > 1000) {
          toast({
            variant: "destructive",
            title: "Already Used!",
            description: "This coupon has already been redeemed.",
          });
          setTimeout(() => {
            setHasScanned(false);
            scannerRef.current?.start();
          }, 2000);
          return;
        }
      }

      // Success! Navigate to success page with coupon title
      navigate("/redemption-success", {
        state: { couponTitle: parsedData.title || "Coupon" },
      });
    } catch (error) {
      console.error("Error processing QR scan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      setTimeout(() => {
        setHasScanned(false);
        scannerRef.current?.start();
      }, 2000);
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
    }
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

