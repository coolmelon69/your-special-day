import { supabase } from "@/utils/supabaseClient";
import { getCurrentUser } from "@/utils/auth";

/** Trainer photos share the `stamp-photos` bucket the app already provisions —
 *  a second bucket would only be a second set of policies to keep in step. */
const PHOTO_BUCKET = "stamp-photos";

export interface Profile {
  userId: string;
  displayName: string;
  birthday: string; // ISO date, "YYYY-MM-DD"
  trainerName: string;
  avatarId: string;
  /** TeamId from `trainerCard.ts`. Null for profiles created before teams existed. */
  teamId: string | null;
  /** Public URL of an uploaded portrait. Null falls back to the emoji avatar. */
  photoUrl: string | null;
  /** ISO timestamp the row was created — the card's "joined" date. */
  createdAt: string | null;
}

export const loadProfile = async (userId: string): Promise<Profile | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, birthday, trainer_name, avatar_id, team_id, photo_url, created_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      userId: data.user_id,
      displayName: data.display_name,
      birthday: data.birthday,
      trainerName: data.trainer_name,
      avatarId: data.avatar_id,
      teamId: data.team_id ?? null,
      photoUrl: data.photo_url ?? null,
      createdAt: data.created_at ?? null,
    };
  } catch (error) {
    console.error("Error loading profile:", error);
    return null;
  }
};

export const saveProfile = async (profile: Profile): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("profiles").upsert({
      user_id: profile.userId,
      display_name: profile.displayName,
      birthday: profile.birthday,
      trainer_name: profile.trainerName,
      avatar_id: profile.avatarId,
      team_id: profile.teamId,
      photo_url: profile.photoUrl,
    });
    return !error;
  } catch (error) {
    console.error("Error saving profile:", error);
    return false;
  }
};

/**
 * Upload a portrait for the trainer card. `dataURL` comes straight off a file input
 * reader. Returns the public URL, or null if anything in the chain failed.
 */
export const uploadTrainerPhoto = async (dataURL: string): Promise<string | null> => {
  if (!supabase) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const mime = dataURL.split(",")[0].match(/:(.*?);/)?.[1] ?? "image/jpeg";
    const binary = atob(dataURL.split(",")[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // Timestamped so a replacement never serves the previous portrait from cache.
    const path = `${user.id}/trainer/portrait-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, new Blob([bytes], { type: mime }), { contentType: mime, upsert: true });
    if (error) {
      console.error("Error uploading trainer photo:", error);
      return null;
    }

    return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data?.publicUrl ?? null;
  } catch (error) {
    console.error("Error uploading trainer photo:", error);
    return null;
  }
};
