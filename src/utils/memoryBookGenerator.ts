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

export interface MemoryBookStats {
  stampsCompleted: number;
  stampsTotal: number;
  couponsRedeemed: number;
  /** Titles of redeemed coupons (in order) for receipt line items. If omitted, placeholder names are used. */
  redeemedCouponTitles?: string[];
  /** Number of redeemed coupons to display (e.g. after filtering out unresolved). If omitted, couponsRedeemed is used. */
  displayCouponsRedeemed?: number;
}

// Generate HTML for memory book
export const generateMemoryBookHTML = async (
  pages: MemoryBookPage[],
  stats?: MemoryBookStats
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
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&family=Dancing+Script:wght@400;500&display=swap');
    
    :root {
      --cream: #FFF9F5;
      --cream-warm: #FFF9F5;
      --muted-gold: #D4A373;
      --champagne: #C9B896;
      --champagne-gold: #D4A373;
      --washi-tape: #E8D5C4;
      --dusty-rose: #D4A5A5;
      --dusty-rose-soft: #E8C4C4;
      --text-muted: #8B7355;
      --text-dark: #5C4A3A;
      --glass-bg: rgba(255, 255, 255, 0.6);
      --glass-border: rgba(212, 163, 115, 0.35);
      --shadow-soft: 0 4px 24px rgba(92, 74, 58, 0.06);
      --shadow-polaroid: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html {
      font-size: 16px;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--cream-warm);
      color: var(--text-dark);
      padding: 1.5rem;
      line-height: 1.65;
      position: relative;
      min-height: 100vh;
    }
    
    body::after {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0.03;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      z-index: 0;
    }
    
    .memory-book {
      max-width: 56rem;
      margin: 0 auto;
      background: var(--cream);
      padding: 2.5rem;
      border: 1px solid var(--glass-border);
      box-shadow: var(--shadow-soft);
      position: relative;
      z-index: 1;
    }
    
    .header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      position: relative;
    }
    
    .header .botanical-top {
      margin-bottom: 1rem;
      opacity: 0.5;
    }
    
    .header h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.75rem, 4vw, 2.25rem);
      font-weight: 700;
      color: var(--text-dark);
      letter-spacing: 0.02em;
      margin-bottom: 0.5rem;
    }
    
    .header .subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 1rem;
      color: var(--text-muted);
      font-weight: 400;
    }
    
    .header .divider {
      width: 4rem;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--muted-gold), transparent);
      margin: 1.5rem auto 0;
    }
    
    .page {
      margin-bottom: 3.5rem;
      page-break-after: always;
    }
    
    .page:nth-child(odd) .page-header { margin-left: 0; margin-right: 0.5rem; }
    .page:nth-child(even) .page-header { margin-left: 0.5rem; margin-right: 0; }
    
    .page-header {
      margin-bottom: 1.5rem;
      padding: 1.25rem 1.5rem;
      background: var(--glass-bg);
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 0.75rem;
      box-shadow: var(--shadow-soft);
      position: relative;
      overflow: hidden;
    }
    
    .page-header .quest-number {
      position: absolute;
      top: 0.75rem;
      right: 1rem;
      font-family: 'Dancing Script', cursive;
      font-size: 1rem;
      font-weight: 500;
      color: var(--muted-gold);
      opacity: 0.8;
    }
    
    .page-header .leaf {
      position: absolute;
      right: 0.75rem;
      bottom: 0.5rem;
      opacity: 0.25;
    }
    
    .page-header .time {
      font-family: 'Inter', sans-serif;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted-gold);
      margin-bottom: 0.25rem;
      font-weight: 600;
    }
    
    .page-header .title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 0.35rem;
    }
    
    .page-header .description {
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    
    .photos-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-top: 1rem;
      align-items: flex-start;
    }
    
    .photo-item {
      flex: 0 1 220px;
      max-width: 280px;
      background: #fff;
      padding: 1rem 1rem 3rem;
      box-shadow: var(--shadow-polaroid);
      position: relative;
      align-self: flex-start;
      border: 1px solid rgba(255,255,255,0.9);
    }
    
    .photo-item:nth-child(odd) { transform: rotate(-1deg); }
    .photo-item:nth-child(even) { transform: rotate(1deg); }
    .photo-item:nth-child(3n) { transform: rotate(0.5deg); align-self: flex-end; }
    
    .photo-item .washi-tape {
      position: absolute;
      top: 0;
      left: 0.5rem;
      width: 70%;
      height: 18px;
      background: var(--washi-tape);
      opacity: 0.6;
      z-index: 1;
      transform: rotate(-3deg);
      border-radius: 1px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }
    
    .photo-item .img-wrap {
      position: relative;
      overflow: hidden;
      margin-bottom: 0;
    }
    
    .photo-item img {
      width: 100%;
      height: auto;
      display: block;
      vertical-align: middle;
    }
    
    .photo-caption {
      font-family: 'Inter', sans-serif;
      font-size: 0.8125rem;
      text-align: center;
      color: var(--text-muted);
      padding: 0.5rem 0.25rem 0;
      position: absolute;
      bottom: 0.75rem;
      left: 0.75rem;
      right: 0.75rem;
    }
    
    .footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      position: relative;
    }
    
    .footer .divider {
      width: 4rem;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--muted-gold), transparent);
      margin: 0 auto 1rem;
    }
    
    .footer .botanical-footer {
      margin-bottom: 1rem;
      opacity: 0.4;
    }
    
    .footer p {
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    
    .dashboard {
      margin-bottom: 2.5rem;
      padding: 1.5rem 1.5rem;
      background: var(--glass-bg);
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 0.75rem;
      box-shadow: var(--shadow-soft);
    }
    
    .dashboard-section {
      margin-bottom: 1.5rem;
    }
    
    .dashboard-section:last-child {
      margin-bottom: 0;
    }
    
    .dashboard-label {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 0.75rem;
      letter-spacing: 0.02em;
    }
    
    .stamp-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 0.75rem;
      max-width: 20rem;
    }
    
    .stamp-slot {
      aspect-ratio: 1;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .stamp-slot:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(92, 74, 58, 0.12);
    }
    
    .stamp-slot.completed {
      background: rgba(212, 163, 115, 0.2);
      border: 2px solid var(--muted-gold);
    }
    
    .stamp-slot.completed .stamp-icon {
      color: var(--muted-gold);
    }
    
    .stamp-slot.incomplete {
      border: 2px dashed rgba(139, 115, 85, 0.35);
      background: transparent;
    }
    
    .stamp-slot.incomplete .stamp-icon {
      color: var(--text-muted);
      opacity: 0.5;
    }
    
    .stamp-slot .stamp-icon {
      width: 1.25rem;
      height: 1.25rem;
    }
    
    .receipt-wrap {
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
    }
    
    .receipt {
      max-width: 250px;
      width: 100%;
      background: #f4f4f2;
      padding: 1rem 1.25rem 1.5rem;
      position: relative;
      transform: rotate(-2deg);
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.7rem;
      line-height: 1.5;
      color: #2a2a2a;
      clip-path: polygon(
        0 0, 100% 0, 100% calc(100% - 14px),
        95% 100%, 90% calc(100% - 14px), 85% 100%, 80% calc(100% - 14px), 75% 100%,
        70% calc(100% - 14px), 65% 100%, 60% calc(100% - 14px), 55% 100%,
        50% calc(100% - 14px), 45% 100%, 40% calc(100% - 14px), 35% 100%,
        30% calc(100% - 14px), 25% 100%, 20% calc(100% - 14px), 15% 100%,
        10% calc(100% - 14px), 5% 100%, 0 calc(100% - 14px)
      );
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 20px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    .receipt::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' result='noise'/%3E%3CfeColorMatrix in='noise' type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
      pointer-events: none;
      border-radius: 0;
    }
    
    .receipt > * {
      position: relative;
      z-index: 1;
    }
    
    .receipt-header {
      text-align: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px dashed rgba(0, 0, 0, 0.2);
    }
    
    .receipt-store {
      font-weight: 700;
      letter-spacing: 0.15em;
      font-size: 0.75rem;
      margin-bottom: 0.2rem;
      opacity: 0.8;
    }
    
    .receipt-est {
      font-size: 0.6rem;
      letter-spacing: 0.08em;
      opacity: 0.75;
    }
    
    .receipt-items,
    .receipt-total,
    .receipt-thanks {
      opacity: 0.8;
    }
    
    .receipt-items {
      margin-bottom: 0.75rem;
    }
    
    .receipt-line {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
      opacity: 0.85;
    }
    
    .receipt-line-dots {
      flex: 1;
      min-width: 0.5rem;
      border-bottom: 1px dotted rgba(0, 0, 0, 0.25);
      align-self: flex-end;
      margin-bottom: 0.2rem;
    }
    
    .receipt-total-sep {
      border: none;
      border-top: 2px solid #1a1a1a;
      margin: 0.5rem 0 0.35rem;
    }
    
    .receipt-total-sep::after {
      content: '';
      display: block;
      border-top: 1px solid #1a1a1a;
      margin-top: 2px;
    }
    
    .receipt-total {
      font-weight: 700;
      text-align: center;
      margin-bottom: 0.35rem;
      font-size: 0.75rem;
    }
    
    .receipt-total:last-of-type {
      margin-bottom: 0.75rem;
    }
    
    .receipt-thanks {
      text-align: center;
      font-size: 0.6rem;
      letter-spacing: 0.12em;
      margin-bottom: 0.5rem;
      opacity: 0.8;
    }
    
    .receipt-barcode {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 0;
      height: 28px;
      margin: 0 auto;
      max-width: 180px;
    }
    
    .receipt-barcode .bar {
      height: 100%;
      flex-shrink: 0;
      background: #1a1a1a;
    }
    
    .receipt-barcode .bar.space {
      background: transparent;
    }
    
    .treasures-sr {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    
    .treasures-empty {
      font-family: 'Inter', sans-serif;
      font-size: 0.8125rem;
      color: var(--text-muted);
      font-style: italic;
    }
    
    @media print {
      body { background: var(--cream); padding: 0; }
      body::after { display: none; }
      .memory-book { border: 1px solid var(--champagne); box-shadow: none; padding: 1.5rem; }
      .page { page-break-after: always; }
      .photo-item { box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
      .stamp-slot:hover { transform: none; }
      .receipt { transform: none; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
    }
  </style>
</head>
<body>
  <div class="memory-book">
    <div class="header">
      <div class="botanical-top">
        <svg width="80" height="24" viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M8 20 Q20 8 32 20 Q44 8 56 20" stroke="#D4A373" stroke-width="1.2" fill="none" stroke-linecap="round"/>
          <path d="M12 16 L14 10 M20 18 L22 12 M28 14 L30 8 M36 18 L38 12 M44 16 L46 10 M52 18 L54 12" stroke="#E8D5C4" stroke-width="0.8" fill="none" stroke-linecap="round"/>
        </svg>
      </div>
      <h1>Memory Book</h1>
      <p class="subtitle">Your Special Day Adventure</p>
      <div class="divider"></div>
    </div>
    
    ${stats != null ? `
    <div class="dashboard">
      <div class="dashboard-section">
        <div class="dashboard-label">Milestones Captured</div>
        <div class="stamp-grid">
          ${Array.from({ length: 6 }, (_, i) => {
            const completed = i < stats.stampsCompleted;
            const icons = [
              '<svg class="stamp-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
              '<svg class="stamp-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.2"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/></svg>',
              '<svg class="stamp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 8h12v8H6z"/><path d="M18 12h2a2 2 0 01-2 2v0"/></svg>',
              '<svg class="stamp-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
              '<svg class="stamp-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.2"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/></svg>',
              '<svg class="stamp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l2 2"/><path d="M6 10V8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2"/><circle cx="12" cy="12" r="10"/></svg>'
            ];
            const lockSvg = '<svg class="stamp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';
            return `<div class="stamp-slot ${completed ? 'completed' : 'incomplete'}" aria-label="${completed ? 'Stamp earned' : 'Stamp not yet earned'}">${completed ? icons[i] : lockSvg}</div>`;
          }).join('')}
        </div>
      </div>
      <div class="dashboard-section">
        <div class="dashboard-label">Treasures Claimed</div>
        <div class="receipt-wrap" role="group" aria-label="${stats.displayCouponsRedeemed ?? stats.couponsRedeemed} treasures claimed">
          <span class="treasures-sr" aria-live="polite">${stats.displayCouponsRedeemed ?? stats.couponsRedeemed} treasures claimed</span>
          ${(stats.displayCouponsRedeemed ?? stats.couponsRedeemed) > 0
            ? (() => {
                const placeholderNames = ['LATE NIGHT COFFEE', 'SUNSET WALK', 'MOVIE NIGHT', 'DINNER OUT', 'BREAKFAST IN BED', 'COFFEE DATE', 'TREASURE CLAIMED', 'MEMORY REDEEMED'];
                let titles: string[];
                if (stats.redeemedCouponTitles && stats.redeemedCouponTitles.length > 0) {
                  titles = stats.redeemedCouponTitles.filter((t) => t !== 'Treasure claimed');
                  if (titles.length === 0) {
                    titles = Array.from({ length: stats.couponsRedeemed }, (_, i) => placeholderNames[i % placeholderNames.length]);
                  }
                } else {
                  titles = Array.from({ length: stats.couponsRedeemed }, (_, i) => placeholderNames[i % placeholderNames.length]);
                }
                const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                const lines = titles.map((name) => {
                  const safe = escape(name);
                  return `<div class="receipt-line"><span>1x ${safe}</span><span class="receipt-line-dots"></span><span>$0.00</span></div>`;
                }).join('');
                const barcodeWidths = [2,1,2,2,1,3,1,2,2,1,2,3,1,2,1,2,2,3,1,2,1,2,1,3,2,1];
                const barcodeBars = barcodeWidths.map((w, i) => `<span class="bar ${i % 2 ? 'space' : ''}" style="width: ${w}px" aria-hidden="true"></span>`).join('');
                const totalMemories = pagesWithDataURLs.reduce((sum, page) => sum + page.photos.length, 0);
                const totalCouponsRedeemed = stats.displayCouponsRedeemed ?? stats.couponsRedeemed;
                return `<div class="receipt">
          <div class="receipt-header">
            <div class="receipt-store">OUR MEMORY CAFE</div>
            <div class="receipt-est">EST. 19 NOV 2025</div>
          </div>
          <div class="receipt-items">${lines}</div>
          <hr class="receipt-total-sep" aria-hidden="true">
          <div class="receipt-total">LOVE UNITS REDEEMED &nbsp; ${totalCouponsRedeemed}</div>
          <div class="receipt-total">TOTAL MEMORIES &nbsp; ${totalMemories}</div>
          <div class="receipt-thanks">THANK YOU FOR THE ADVENTURE</div>
          <div class="receipt-barcode" role="img" aria-label="Barcode">${barcodeBars}</div>
        </div>`;
              })()
            : '<span class="treasures-empty">No treasures claimed yet</span>'}
        </div>
      </div>
    </div>
    ` : ""}
    
    ${pagesWithDataURLs
      .map(
        (page, pageIndex) => `
    <div class="page">
      <div class="page-header">
        <span class="quest-number">Quest ${pageIndex + 1}</span>
        <div class="time">${page.checkpoint.time}</div>
        <div class="title">${page.checkpoint.title}</div>
        <div class="description">${page.checkpoint.description}</div>
        <svg class="leaf" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 4 C6 10 6 18 12 20 C18 18 18 10 12 4 Z" stroke="#8B7355" stroke-width="1" fill="none"/>
        </svg>
      </div>
      <div class="photos-wrap">
        ${page.photos
          .map(
            (photo: Photo & { dataURL?: string | null }) => {
              const imageSrc = photo.dataURL || photo.storageUrl || photo.src || '';
              return `
        <div class="photo-item">
          <div class="washi-tape" aria-hidden="true"></div>
          <div class="img-wrap">
            <img src="${imageSrc}" alt="${(photo.caption || "Memory").replace(/"/g, "&quot;")}" />
          </div>
          ${photo.caption ? `<div class="photo-caption">${photo.caption.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>` : ""}
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
      <div class="divider"></div>
      <div class="botanical-footer">
        <svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M5 15 Q15 5 25 15 Q35 5 45 15 Q55 5 60 10" stroke="#D4A373" stroke-width="1" fill="none" stroke-linecap="round"/>
        </svg>
      </div>
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

