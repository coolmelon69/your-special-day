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
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
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
          <div className="relative bg-surface border-4 border-primary p-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-lg">
            {/* Inner border */}
            <div className="border-2 border-primary/20 p-4 rounded-md">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-muted/20 border border-border hover:bg-muted/50 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-foreground/70 hover:text-foreground" />
              </button>

              {/* Title */}
              <h3
                className="font-serif text-xl md:text-2xl text-primary font-semibold mb-4 text-center"
                style={{
                  letterSpacing: "0.02em",
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
                  className={`flex-1 px-4 py-2 font-medium text-sm rounded-md border transition-all ${
                    mode === "camera"
                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                      : "bg-surface border-border text-foreground hover:bg-muted/50"
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
                  className={`flex-1 px-4 py-2 font-medium text-sm rounded-md border transition-all ${
                    mode === "upload"
                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                      : "bg-surface border-border text-foreground hover:bg-muted/50"
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
                  className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs md:text-sm font-medium">
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Camera preview */}
              {mode === "camera" && (
                <div className="mb-4 relative bg-black rounded-lg overflow-hidden border border-border shadow-inner" style={{ imageRendering: "pixelated" }}>
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
                      <div className="text-white/70 font-medium text-sm">Loading camera...</div>
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
                    className="w-full px-6 py-12 border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-3 text-primary/70" />
                    <p className="font-medium text-sm text-primary/80">
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
                  className="w-full px-6 py-3 font-medium text-sm md:text-base rounded-lg bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-wait"
                  whileHover={!isCapturing ? { scale: 1.02 } : {}}
                  whileTap={!isCapturing ? { scale: 0.98 } : {}}
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

