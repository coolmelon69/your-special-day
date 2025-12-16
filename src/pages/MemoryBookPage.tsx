import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, BookOpen } from "lucide-react";
import { useAdventure } from "@/contexts/AdventureContext";
import { generateMemoryBookPages, generateMemoryBookHTML, downloadMemoryBook } from "@/utils/memoryBookGenerator";
import type { MemoryBookPage } from "@/utils/memoryBookGenerator";

const MemoryBookPage = () => {
  const { getAllPhotos, itineraryState } = useAdventure();
  const [pages, setPages] = useState<MemoryBookPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMemoryBook = async () => {
      setIsLoading(true);
      try {
        const photos = await getAllPhotos();
        const memoryPages = generateMemoryBookPages(photos, itineraryState);
        setPages(memoryPages);
      } catch (error) {
        console.error("Error loading memory book:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMemoryBook();
  }, [getAllPhotos, itineraryState]);

  const handleDownload = () => {
    const html = generateMemoryBookHTML(pages);
    downloadMemoryBook(html);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(35_40%_85%)]">
        <div className="text-center">
          <div className="font-pixel text-lg text-[hsl(15_70%_40%)] mb-4">Loading memories...</div>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <>
        <Helmet>
          <title>Memory Book - Your Special Day</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-[hsl(35_40%_85%)] pt-20">
          <div className="text-center max-w-md mx-auto p-8 bg-[hsl(35_40%_85%)] border-4 border-[hsl(15_60%_50%)]">
            <BookOpen className="mx-auto mb-4 text-[hsl(15_70%_40%)]" size={48} />
            <h2
              className="font-pixel text-lg md:text-xl text-[hsl(15_70%_40%)] mb-4"
              style={{
                textRendering: "optimizeSpeed",
                WebkitFontSmoothing: "none",
                MozOsxFontSmoothing: "unset",
                fontSmooth: "never",
                letterSpacing: "0.05em",
              }}
            >
              No Memories Yet
            </h2>
            <p
              className="font-pixel text-xs md:text-sm text-[hsl(15_60%_35%)]"
              style={{
                textRendering: "optimizeSpeed",
                WebkitFontSmoothing: "none",
                MozOsxFontSmoothing: "unset",
                fontSmooth: "never",
              }}
            >
              Start capturing photos at checkpoints to build your memory book!
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Memory Book - Your Special Day</title>
      </Helmet>
      <main className="min-h-screen bg-[hsl(35_40%_85%)] pt-20 pb-20">
        <div className="container px-4 md:px-6 py-8">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-block bg-[hsl(35_40%_85%)] border-4 border-[hsl(15_60%_50%)] p-4 mb-6">
              <BookOpen className="mx-auto mb-4 text-[hsl(15_70%_40%)]" size={48} />
              <h1
                className="font-pixel text-xl md:text-2xl text-[hsl(15_70%_40%)] mb-2"
                style={{
                  textRendering: "optimizeSpeed",
                  WebkitFontSmoothing: "none",
                  MozOsxFontSmoothing: "unset",
                  fontSmooth: "never",
                  letterSpacing: "0.05em",
                }}
              >
                MEMORY BOOK
              </h1>
              <p
                className="font-pixel text-xs md:text-sm text-[hsl(15_60%_35%)]"
                style={{
                  textRendering: "optimizeSpeed",
                  WebkitFontSmoothing: "none",
                  MozOsxFontSmoothing: "unset",
                  fontSmooth: "never",
                }}
              >
                {pages.reduce((sum, page) => sum + page.photos.length, 0)} memories captured
              </p>
            </div>

            {/* Download button */}
            <motion.button
              onClick={handleDownload}
              className="px-6 py-3 font-pixel text-sm md:text-base rounded-lg border-2 bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] transition-all flex items-center gap-2 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-4 h-4" />
              Download Memory Book
            </motion.button>
          </motion.div>

          {/* Memory pages */}
          <div className="space-y-12">
            {pages.map((page, pageIndex) => (
              <motion.div
                key={`${page.checkpoint.time}-${page.checkpoint.title}`}
                className="bg-[hsl(35_40%_85%)] border-4 border-[hsl(15_60%_50%)] p-4 md:p-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pageIndex * 0.1 }}
              >
                {/* Page header */}
                <div className="mb-6 pb-4 border-b-2 border-[hsl(15_60%_50%)]">
                  <div className="inline-block bg-[hsl(var(--primary))] px-3 py-1 mb-2">
                    <span
                      className="font-pixel text-[10px] text-[hsl(var(--primary-foreground))]"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      {page.checkpoint.time}
                    </span>
                  </div>
                  <h2
                    className="font-pixel text-base md:text-lg text-[hsl(15_70%_40%)] mb-2"
                    style={{
                      textRendering: "optimizeSpeed",
                      WebkitFontSmoothing: "none",
                      MozOsxFontSmoothing: "unset",
                      fontSmooth: "never",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {page.checkpoint.title}
                  </h2>
                  <p
                    className="font-pixel text-[8px] md:text-[10px] text-[hsl(15_60%_35%)]"
                    style={{
                      textRendering: "optimizeSpeed",
                      WebkitFontSmoothing: "none",
                      MozOsxFontSmoothing: "unset",
                      fontSmooth: "never",
                    }}
                  >
                    {page.checkpoint.description}
                  </p>
                </div>

                {/* Photos grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {page.photos.map((photo, photoIndex) => (
                    <motion.div
                      key={photo.id}
                      className="relative bg-[hsl(35_40%_88%)] p-2 border-4 border-[hsl(340_70%_65%)]"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: pageIndex * 0.1 + photoIndex * 0.05 }}
                      style={{ imageRendering: "pixelated" }}
                    >
                      <img
                        src={photo.src}
                        alt={photo.caption || "Memory"}
                        className="w-full h-auto object-cover"
                        style={{ imageRendering: "pixelated" }}
                      />
                      {photo.caption && (
                        <p
                          className="font-pixel text-[8px] md:text-[10px] text-center text-[hsl(340_60%_50%)] mt-2"
                          style={{
                            textRendering: "optimizeSpeed",
                            WebkitFontSmoothing: "none",
                            MozOsxFontSmoothing: "unset",
                            fontSmooth: "never",
                          }}
                        >
                          {photo.caption}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default MemoryBookPage;

