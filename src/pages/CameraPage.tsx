import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { saveCameraPhoto, getUndevelopedPhotosCount } from '@/utils/adminStorage';
import { toast } from 'sonner';

const CameraPage = () => {
  const [undevelopedCount, setUndevelopedCount] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSnapped, setHasSnapped] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchCount();
    
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Camera permission denied or unavailable");
      }
    };
    
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const fetchCount = async () => {
    const count = await getUndevelopedPhotosCount();
    setUndevelopedCount(count);
  };

  const handleCapture = async () => {
    if (!videoRef.current || error) return;

    setIsCapturing(true);
    setHasSnapped(true);
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50]);
    }

    setTimeout(() => {
      setHasSnapped(false);
    }, 300);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        await saveCameraPhoto(dataUrl);
        toast.success("Photo captured!");
        fetchCount();
      }
    } catch (err) {
      console.error("Error capturing photo:", err);
      toast.error("Failed to capture photo");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-black text-white p-4">
      <div className="flex justify-between items-center mb-8 mt-4">
        <h1 className="text-2xl font-bold">Disposable Camera</h1>
        <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-full">
          <ImageIcon className="w-4 h-4" />
          <span className="font-medium">{undevelopedCount}</span>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center relative">
        {/* Minimal viewfinder */}
        <div className="w-full max-w-sm aspect-[3/4] border-2 border-zinc-700 rounded-xl flex items-center justify-center relative overflow-hidden">
          {error ? (
            <div className="absolute inset-0 bg-zinc-900/50 flex flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
              <p className="text-sm text-zinc-400">{error}</p>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover" 
              />
              <div 
                className="absolute inset-0 bg-white z-20 transition-opacity duration-300" 
                style={{ opacity: hasSnapped ? 1 : 0, pointerEvents: 'none' }} 
              />
            </>
          )}
          
          <div className="w-16 h-16 border-2 border-white/20 rounded-full flex items-center justify-center z-10 absolute pointer-events-none">
            <Camera className="w-8 h-8 text-white/50" />
          </div>
          {/* Viewfinder corners */}
          <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-white/30 pointer-events-none"></div>
          <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-white/30 pointer-events-none"></div>
          <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-white/30 pointer-events-none"></div>
          <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-white/30 pointer-events-none"></div>
        </div>
      </div>

      <div className="mt-8 mb-12 flex justify-center">
        <div className="relative">
          <Button 
            size="lg" 
            className="w-20 h-20 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-transform active:scale-95 flex items-center justify-center"
            disabled={isCapturing || !!error}
            onClick={handleCapture}
          >
            <Camera className="w-8 h-8" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;
