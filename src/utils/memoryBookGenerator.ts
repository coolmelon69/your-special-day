import type { Photo } from "@/components/TimelineSection";
import type { ItineraryItem } from "@/components/TimelineSection";

export interface MemoryBookPage {
  checkpoint: ItineraryItem;
  photos: Photo[];
}

// Convert image URL (data URL, blob URL, or external URL) to data URL
const convertImageToDataURL = async (imageUrl: string): Promise<string> => {
  // If already a data URL, return it
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  try {
    // Fetch the image (works for both blob URLs and external URLs)
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    
    // Convert blob to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to convert image to data URL'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to convert image to data URL'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to data URL:', error);
    throw error;
  }
};

// Generate memory book pages grouped by checkpoint
export const generateMemoryBookPages = (
  photos: Photo[],
  itinerary: ItineraryItem[]
): MemoryBookPage[] => {
  const pages: MemoryBookPage[] = [];

  itinerary.forEach((checkpoint) => {
    const checkpointId = `${checkpoint.time}-${checkpoint.title}`;
    const checkpointPhotos = photos.filter(
      (photo) => photo.checkpointId === checkpointId
    );

    if (checkpointPhotos.length > 0) {
      pages.push({
        checkpoint,
        photos: checkpointPhotos,
      });
    }
  });

  return pages;
};

// Generate HTML for memory book
export const generateMemoryBookHTML = async (
  pages: MemoryBookPage[]
): Promise<string> => {
  // Convert all images to data URLs
  const pagesWithDataURLs = await Promise.all(
    pages.map(async (page) => ({
      ...page,
      photos: await Promise.all(
        page.photos.map(async (photo) => {
          try {
            const imageUrl = photo.storageUrl || photo.src;
            if (!imageUrl) {
              console.warn(`Photo ${photo.id} has no image URL`);
              return {
                ...photo,
                dataURL: null,
              };
            }
            const dataURL = await convertImageToDataURL(imageUrl);
            return {
              ...photo,
              dataURL, // Store converted data URL
            };
          } catch (error) {
            console.error(`Failed to convert image ${photo.id}:`, error);
            // Return photo with original URL as fallback (will show broken image if external)
            return {
              ...photo,
              dataURL: null,
            };
          }
        })
      ),
    }))
  );

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Memory Book - Your Special Day</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', monospace;
      background: hsl(35, 40%, 85%);
      color: hsl(15, 60%, 35%);
      padding: 20px;
      line-height: 1.6;
    }
    
    .memory-book {
      max-width: 1200px;
      margin: 0 auto;
      background: hsl(35, 35%, 88%);
      padding: 40px;
      border: 4px solid hsl(15, 60%, 50%);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid hsl(15, 60%, 50%);
    }
    
    .header h1 {
      font-family: 'Press Start 2P', 'Courier New', monospace;
      font-size: 24px;
      color: hsl(15, 70%, 40%);
      margin-bottom: 10px;
      text-rendering: optimizeSpeed;
      -webkit-font-smoothing: none;
      -moz-osx-font-smoothing: unset;
      font-smooth: never;
      letter-spacing: 0.05em;
    }
    
    .page {
      margin-bottom: 60px;
      page-break-after: always;
    }
    
    .page-header {
      margin-bottom: 20px;
      padding: 15px;
      background: hsl(15, 70%, 55%);
      border: 2px solid hsl(15, 60%, 45%);
    }
    
    .page-header .time {
      font-size: 12px;
      color: hsl(15, 70%, 40%);
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .page-header .title {
      font-size: 18px;
      color: hsl(15, 70%, 40%);
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .page-header .description {
      font-size: 10px;
      color: hsl(15, 60%, 35%);
    }
    
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .photo-item {
      background: hsl(35, 40%, 88%);
      border: 4px solid hsl(340, 70%, 65%);
      padding: 8px;
      position: relative;
    }
    
    .photo-item img {
      width: 100%;
      height: auto;
      display: block;
      image-rendering: pixelated;
    }
    
    .photo-caption {
      margin-top: 8px;
      font-size: 10px;
      text-align: center;
      color: hsl(340, 60%, 50%);
      padding: 5px;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 3px solid hsl(15, 60%, 50%);
      font-size: 10px;
      color: hsl(15, 60%, 35%);
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .memory-book {
        border: none;
        box-shadow: none;
        padding: 20px;
      }
      
      .page {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="memory-book">
    <div class="header">
      <h1>MEMORY BOOK</h1>
      <p>Your Special Day Adventure</p>
    </div>
    
    ${pagesWithDataURLs
      .map(
        (page) => `
    <div class="page">
      <div class="page-header">
        <div class="time">${page.checkpoint.time}</div>
        <div class="title">${page.checkpoint.title}</div>
        <div class="description">${page.checkpoint.description}</div>
      </div>
      <div class="photos-grid">
        ${page.photos
          .map(
            (photo: Photo & { dataURL?: string | null }) => {
              // Use dataURL if available, otherwise fall back to original URLs
              const imageSrc = photo.dataURL || photo.storageUrl || photo.src || '';
              return `
        <div class="photo-item">
          <img src="${imageSrc}" alt="${photo.caption || "Memory"}" />
          ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ""}
        </div>
        `;
            }
          )
          .join("")}
      </div>
    </div>
    `
      )
      .join("")}
    
    <div class="footer">
      <p>Generated with love &lt;3</p>
      <p>Total Memories: ${pagesWithDataURLs.reduce((sum, page) => sum + page.photos.length, 0)}</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
};

// Download memory book as HTML file
export const downloadMemoryBook = (html: string, filename = "memory-book.html"): void => {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

