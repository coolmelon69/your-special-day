import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, AlertCircle } from "lucide-react";
import { compressImage } from "@/utils/photoProcessing";

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataURL: string) => void;
  checkpointTitle: string;
}

const PhotoCaptureModal = ({
  isOpen,
  onClose,
  onCapture,
  checkpointTitle,
}: PhotoCaptureModalProps) => {
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Prefer back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "Unable to access camera. Please check permissions or use file upload instead."
      );
      setMode("upload");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCapture = async () => {
    if (mode === "camera" && videoRef.current) {
      try {
        setIsCapturing(true);
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }
        ctx.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg", 0.9);
        onCapture(dataURL);
        stopCamera();
        onClose();
      } catch (err) {
        console.error("Error capturing photo:", err);
        setError("Failed to capture photo. Please try again.");
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    try {
      setIsCapturing(true);
      const dataURL = await compressImage(file);
      onCapture(dataURL);
      onClose();
    } catch (err) {
      console.error("Error processing file:", err);
      setError("Failed to process image. Please try again.");
    } finally {
      setIsCapturing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[hsl(0_0%_0%)] bg-opacity-70"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md"
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 20 }}
        >
          {/* Pixel border frame */}
          <div className="relative bg-[hsl(35_40%_85%)] border-4 border-[hsl(15_60%_50%)] p-1">
            {/* Inner border */}
            <div className="border-2 border-[hsl(30_50%_60%)] p-4">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-[hsl(0_60%_50%)] border-2 border-[hsl(0_50%_40%)] hover:bg-[hsl(0_60%_60%)] transition-colors"
              >
                <X className="w-4 h-4 text-[hsl(0_0%_100%)]" />
              </button>

              {/* Title */}
              <h3
                className="font-pixel text-sm md:text-base text-[hsl(15_70%_40%)] mb-4 text-center"
                style={{
                  textRendering: "optimizeSpeed",
                  WebkitFontSmoothing: "none",
                  MozOsxFontSmoothing: "unset",
                  fontSmooth: "never",
                  letterSpacing: "0.05em",
                }}
              >
                Capture Memory: {checkpointTitle}
              </h3>

              {/* Mode selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setMode("camera");
                    setError(null);
                  }}
                  className={`flex-1 px-4 py-2 font-pixel text-xs border-2 transition-all ${
                    mode === "camera"
                      ? "bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white"
                      : "bg-[hsl(35_30%_75%)] border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)]"
                  }`}
                >
                  <Camera className="w-4 h-4 mx-auto mb-1" />
                  Camera
                </button>
                <button
                  onClick={() => {
                    setMode("upload");
                    setError(null);
                  }}
                  className={`flex-1 px-4 py-2 font-pixel text-xs border-2 transition-all ${
                    mode === "upload"
                      ? "bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white"
                      : "bg-[hsl(35_30%_75%)] border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)]"
                  }`}
                >
                  <Upload className="w-4 h-4 mx-auto mb-1" />
                  Upload
                </button>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-[hsl(0_70%_50%)] border-2 border-[hsl(0_60%_40%)] rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
                  <p
                    className="font-pixel text-[8px] md:text-[10px] text-white"
                    style={{
                      textRendering: "optimizeSpeed",
                      WebkitFontSmoothing: "none",
                      MozOsxFontSmoothing: "unset",
                      fontSmooth: "never",
                    }}
                  >
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Camera preview */}
              {mode === "camera" && (
                <div className="mb-4 relative bg-[hsl(0_0%_0%)] rounded-lg overflow-hidden" style={{ imageRendering: "pixelated" }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto max-h-[400px] object-cover"
                    style={{ imageRendering: "pixelated" }}
                  />
                  {!stream && !error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white font-pixel text-xs">Loading camera...</div>
                    </div>
                  )}
                </div>
              )}

              {/* File upload */}
              {mode === "upload" && (
                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={handleFileButtonClick}
                    disabled={isCapturing}
                    className="w-full px-6 py-12 border-2 border-dashed border-[hsl(15_60%_50%)] bg-[hsl(35_30%_80%)] hover:bg-[hsl(35_30%_85%)] transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-[hsl(15_60%_50%)]" />
                    <p
                      className="font-pixel text-xs text-[hsl(15_60%_35%)]"
                      style={{
                        textRendering: "optimizeSpeed",
                        WebkitFontSmoothing: "none",
                        MozOsxFontSmoothing: "unset",
                        fontSmooth: "never",
                      }}
                    >
                      {isCapturing ? "Processing..." : "Click to select image"}
                    </p>
                  </button>
                </div>
              )}

              {/* Capture button */}
              {mode === "camera" && stream && (
                <motion.button
                  onClick={handleCapture}
                  disabled={isCapturing}
                  className="w-full px-6 py-3 font-pixel text-sm md:text-base rounded-lg border-2 bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait"
                  whileHover={!isCapturing ? { scale: 1.05 } : {}}
                  whileTap={!isCapturing ? { scale: 0.95 } : {}}
                >
                  {isCapturing ? "Capturing..." : "Capture Photo"}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoCaptureModal;

