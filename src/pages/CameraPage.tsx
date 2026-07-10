import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { saveCameraPhoto, getUndevelopedPhotosCount } from '@/utils/adminStorage';
import { toast } from 'sonner';

const CameraPage = () => {
  const [undevelopedCount, setUndevelopedCount] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    fetchCount();
  }, []);

  const fetchCount = async () => {
    const count = await getUndevelopedPhotosCount();
    setUndevelopedCount(count);
  };

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          await saveCameraPhoto(dataUrl);
          toast.success("Photo captured!");
          fetchCount();
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error capturing photo:", error);
      toast.error("Failed to capture photo");
    } finally {
      setIsCapturing(false);
      // Reset input so the same file can be selected again if needed
      event.target.value = '';
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
          <div className="absolute inset-0 bg-zinc-900/50"></div>
          <div className="w-16 h-16 border-2 border-white/20 rounded-full flex items-center justify-center z-10">
            <Camera className="w-8 h-8 text-white/50" />
          </div>
          {/* Viewfinder corners */}
          <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-white/30"></div>
          <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-white/30"></div>
          <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-white/30"></div>
          <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-white/30"></div>
        </div>
      </div>

      <div className="mt-8 mb-12 flex justify-center">
        <div className="relative">
          <Button 
            size="lg" 
            className="w-20 h-20 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-transform active:scale-95 flex items-center justify-center"
            disabled={isCapturing}
          >
            <Camera className="w-8 h-8" />
          </Button>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" 
            onChange={handleCapture}
            disabled={isCapturing}
          />
        </div>
      </div>
    </div>
  );
};

export default CameraPage;
