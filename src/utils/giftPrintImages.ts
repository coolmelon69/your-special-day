/**
 * The two images printed on a Mystery Gift card: the photo and the mark.
 *
 * Storage reuses the `stamp-photos` bucket rather than adding a second one —
 * same auth, same policies, same public-URL shape. Only the path prefix is
 * new. See sql/2026-08-25-gift-print-images.sql for the two columns that hold
 * the resulting URLs.
 *
 * Which DESIGN a card prints in is not here and is not stored: that is picked
 * on /print/gifts and lives only as long as the sheet does.
 */

import { supabase, isSupabaseAvailable } from "@/utils/supabaseClient";
import { getCurrentUser } from "@/utils/auth";

const BUCKET = "stamp-photos";

/** Which of the two slots on a card an image fills. */
export type PrintSlot = "hero" | "mark";

/** Longest edge, in px, an uploaded print image is kept at.
 *
 *  A card photo prints at roughly 60×85mm, so 1400px is already ~3× what
 *  300dpi needs — but the mark is often a logo whose edges matter, so this
 *  errs high rather than at the print minimum. Above this the upload is
 *  mostly a slower page for no visible ink. */
const MAX_EDGE = 1400;

/** Read a File into a downscaled JPEG data URL.
 *
 *  A phone photo is 4–12MB and every one of those bytes has to travel twice
 *  (up to storage, back down into the sheet preview) before anything prints.
 *  The canvas pass is the cheapest place to stop that. */
export const fileToPrintDataURL = (file: File): Promise<string | null> =>
  new Promise((resolve) => {
    const reader = new FileReader();

    reader.onerror = () => resolve(null);
    reader.onload = () => {
      const img = new Image();

      img.onerror = () => resolve(null);
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        /* 0.9 rather than the usual 0.8: this one ends up on paper, where
           JPEG mush in a flat sky is visible in a way it isn't on screen. */
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });

const dataURLtoBlob = (dataURL: string): Blob => {
  const [head, body] = dataURL.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = atob(body);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  return new Blob([buf], { type: mime });
};

/**
 * Put one image in storage and hand back its public URL.
 *
 * The path is fixed per gift and slot, with `upsert`, so re-uploading
 * replaces the file instead of littering the bucket with orphans — and the
 * URL a gift row holds stays valid across replacements.
 */
export const uploadGiftPrintImage = async (
  giftId: string,
  slot: PrintSlot,
  dataURL: string
): Promise<string | null> => {
  if (!isSupabaseAvailable() || !supabase) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const path = `${user.id}/gift-print/${giftId}-${slot}.jpg`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, dataURLtoBlob(dataURL), {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading gift print image:", error);
      return null;
    }

    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl;
    if (!publicUrl) return null;

    /* The path never changes, so a browser that has seen the old file will
       keep showing it. The cache-buster is what makes a replacement visible
       in the sheet preview straight away. */
    return `${publicUrl}?v=${Date.now()}`;
  } catch (e) {
    console.error("Error uploading gift print image:", e);
    return null;
  }
};

/**
 * Record the URLs on the gift row.
 *
 * `null` means "leave this slot alone", `""` means "clear it" — the SQL
 * function relies on that distinction to change one image without touching
 * the other.
 */
export const setGiftPrintImages = async (
  giftId: string,
  hero: string | null,
  mark: string | null
): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("set_mystery_gift_print_images", {
      p_id: giftId,
      p_hero: hero,
      p_mark: mark,
    });
    if (error) {
      console.error("Error saving gift print images:", error);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("Error saving gift print images:", e);
    return false;
  }
};

/** Upload and record in one step. Returns the stored URL, or null if either half failed. */
export const attachGiftPrintImage = async (
  giftId: string,
  slot: PrintSlot,
  file: File
): Promise<string | null> => {
  const dataURL = await fileToPrintDataURL(file);
  if (!dataURL) return null;

  const url = await uploadGiftPrintImage(giftId, slot, dataURL);
  if (!url) return null;

  const saved = await setGiftPrintImages(
    giftId,
    slot === "hero" ? url : null,
    slot === "mark" ? url : null
  );
  return saved ? url : null;
};

/** Forget an image. The file is left in the bucket; the next upload overwrites it. */
export const clearGiftPrintImage = async (
  giftId: string,
  slot: PrintSlot
): Promise<boolean> =>
  setGiftPrintImages(giftId, slot === "hero" ? "" : null, slot === "mark" ? "" : null);
