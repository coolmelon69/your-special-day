// Photo upload utilities for Supabase Storage

import { supabase, isSupabaseAvailable } from "./supabaseClient";
import { getCurrentUser } from "./auth";

const STORAGE_BUCKET = "stamp-photos"; // Supabase Storage bucket name

/**
 * Convert data URL to Blob
 */
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Upload a photo to Supabase Storage
 * @param dataURL - The data URL of the photo (from canvas or file)
 * @param stampKey - The stamp identifier (e.g., "10:00AM-Breakfast")
 * @param photoId - Unique photo ID
 * @returns The public URL of the uploaded photo, or null if upload fails
 */
export const uploadPhotoToStorage = async (
  dataURL: string,
  stampKey: string,
  photoId: string
): Promise<string | null> => {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn("Supabase is not available for photo upload");
    return null;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to upload photos");
    return null;
  }

  try {
    // Convert data URL to Blob
    const blob = dataURLtoBlob(dataURL);
    
    // Create file name: user_id/stamp_key/photo_id.jpg
    // Sanitize stampKey for use in file path (replace special chars)
    const sanitizedStampKey = stampKey.replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `${user.id}/${sanitizedStampKey}/${photoId}.jpg`;
    
    console.log(`Uploading photo to storage: ${fileName}`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, blob, {
        contentType: "image/jpeg",
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error("Error uploading photo to storage:", error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      console.error("Failed to get public URL for uploaded photo");
      return null;
    }

    console.log(`Photo uploaded successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadPhotoToStorage:", error);
    return null;
  }
};

/**
 * Delete a photo from Supabase Storage
 * @param imageUrl - The public URL of the photo to delete
 * @returns True if deletion was successful, false otherwise
 */
export const deletePhotoFromStorage = async (
  imageUrl: string
): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn("Supabase is not available for photo deletion");
    return false;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to delete photos");
    return false;
  }

  try {
    // Extract file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/stamp-photos/user_id/stamp_key/photo_id.jpg
    const urlParts = imageUrl.split(`/${STORAGE_BUCKET}/`);
    if (urlParts.length !== 2) {
      console.error("Invalid image URL format:", imageUrl);
      return false;
    }

    const filePath = urlParts[1];
    console.log(`Deleting photo from storage: ${filePath}`);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Error deleting photo from storage:", error);
      return false;
    }

    console.log(`Photo deleted successfully: ${filePath}`);
    return true;
  } catch (error) {
    console.error("Error in deletePhotoFromStorage:", error);
    return false;
  }
};
