import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, AlertCircle, X, Trash2, ArrowLeft, Upload } from 'lucide-react';
import { saveCameraPhoto, getUndevelopedPhotosCount, getAllCameraPhotos, deleteCameraPhoto, markCameraPhotoDeveloped, type CameraPhoto } from '@/utils/adminStorage';
import { useAdventure } from '@/contexts/AdventureContext';
import { checkpointKey } from '@/utils/memoryBookGenerator';
import { uploadPhotoToStorage } from '@/utils/photoUpload';
import { syncCheckpointPhoto } from '@/utils/supabaseSync';
import type { Photo } from '@/components/TimelineSection';
import { toast } from 'sonner';

const CameraPage = () => {
  const navigate = useNavigate();
  const { itineraryState, upsertPhoto, user } = useAdventure();
  const [undevelopedCount, setUndevelopedCount] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSnapped, setHasSnapped] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [photos, setPhotos] = useState<CameraPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<CameraPhoto | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>('');
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

  const openGallery = async () => {
    const all = await getAllCameraPhotos();
    setPhotos(all);
    setShowGallery(true);
  };

  const handleDeletePhoto = async (photoId: string) => {
    await deleteCameraPhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setSelectedPhoto(null);
    fetchCount();
  };

  const toggleSelected = (photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handlePromote = async () => {
    if (!selectedCheckpoint || selectedIds.size === 0) {
      toast.error("Select checkpoint and photos");
      return;
    }

    try {
      const toPromote = photos.filter((p) => selectedIds.has(p.id));
      for (const photo of toPromote) {
        // Signed in, the frame has to reach Storage: the Memory Book clears the local
        // photo store and refills it from the cloud on every load, so a local-only
        // promote is wiped before it can ever render on a page.
        const storageUrl = user
          ? (await uploadPhotoToStorage(photo.dataUrl, selectedCheckpoint, photo.id)) ?? undefined
          : undefined;

        // Developed on purpose: the stop was already picked here, so there is nothing
        // left for the Develop Film panel to ask.
        const filed: Photo = {
          id: photo.id,
          checkpointId: selectedCheckpoint,
          src: photo.dataUrl,
          storageUrl,
          timestamp: photo.timestamp,
          isDeveloped: true,
        };

        await upsertPhoto(filed);
        if (user && storageUrl) {
          await syncCheckpointPhoto(filed);
        }
        await markCameraPhotoDeveloped(photo.id);
      }
      toast.success(`Promoted ${toPromote.length} photo(s) to Memory Book`);
      setShowPromoteModal(false);
      setSelectedIds(new Set());
      setSelectedCheckpoint('');
      setPhotos(await getAllCameraPhotos());
      fetchCount();
    } catch (err) {
      console.error("Error promoting photos:", err);
      toast.error("Failed to promote photos");
    }
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
    <div className="flex flex-col h-[calc(100dvh-64px)] md:h-[calc(100dvh-80px)] bg-black text-white px-4 pb-4 pt-20 md:pt-24">
      <div className="flex justify-between items-center mb-8 mt-4">
        <h1 className="text-2xl font-bold">Disposable Camera</h1>
        <button
          onClick={openGallery}
          className="flex min-h-[44px] items-center gap-2 bg-zinc-800 px-4 py-1.5 rounded-full hover:bg-zinc-700 transition-colors"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="font-medium">{undevelopedCount}</span>
        </button>
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

      <div className="mt-6 mb-4 flex justify-center">
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

      {showGallery && (
        <div className="fixed inset-0 top-16 md:top-20 z-40 bg-black flex flex-col p-4">
          <div className="flex items-center gap-3 mb-6 mt-2">
            <button onClick={() => { setShowGallery(false); setSelectedIds(new Set()); }} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 text-white rounded-lg text-sm hover:bg-zinc-700 flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h2 className="text-lg font-bold flex-1">Camera Roll</h2>
            <button onClick={() => { setShowGallery(false); setSelectedIds(new Set()); }} className="p-2 text-white/70 hover:text-white flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
          {photos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-2">
              <ImageIcon className="w-8 h-8" />
              <p className="text-sm">No photos yet</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pb-8">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-zinc-700 cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                    <img src={photo.dataUrl} alt="Captured" className="w-full h-full object-cover" />
                    <input
                      type="checkbox"
                      checked={selectedIds.has(photo.id)}
                      onChange={() => toggleSelected(photo.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-2 left-2 w-4 h-4 cursor-pointer"
                    />
                    {selectedIds.has(photo.id) && (
                      <div className="absolute inset-0 bg-blue-500/30 pointer-events-none" />
                    )}
                  </div>
                ))}
              </div>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setShowPromoteModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Promote {selectedIds.size} to Memory Book
                </button>
              )}
            </>
          )}
        </div>
      )}

      {showPromoteModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-sm w-full border border-zinc-700">
            <h3 className="text-lg font-bold mb-4">Choose Checkpoint</h3>
            <div className="max-h-60 overflow-y-auto mb-6 space-y-2">
              {itineraryState.map((item) => (
                <button
                  key={item.title}
                  onClick={() => setSelectedCheckpoint(checkpointKey(item))}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedCheckpoint === checkpointKey(item)
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  <div className="font-medium">{item.time}</div>
                  <div className="text-sm opacity-75">{item.title}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPromoteModal(false); setSelectedCheckpoint(''); }}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={!selectedCheckpoint}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white rounded-lg text-sm font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="absolute top-4 left-4">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 text-white rounded-lg text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleDeletePhoto(selectedPhoto.id); }}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/'); }}
              className="p-2 text-white/70 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <img
            src={selectedPhoto.dataUrl}
            alt="Captured"
            className="max-w-full max-h-[80vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-zinc-400 text-sm mt-4 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            {new Date(selectedPhoto.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default CameraPage;
