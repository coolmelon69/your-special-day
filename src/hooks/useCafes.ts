import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabaseClient";
import { uniqueSlug } from "@/utils/cafeRanking";
import type { CafeCategory, CafePlace, NewCafePlace } from "@/types/cafes";

export const cafeKeys = {
  all: ["cafes"] as const,
  categories: ["cafes", "categories"] as const,
  places: ["cafes", "places"] as const,
};

/** Every data call goes through this so a missing env var fails loudly and once. */
const db = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured — check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
  }
  return supabase;
};

export const useCafeCategories = () =>
  useQuery({
    queryKey: cafeKeys.categories,
    queryFn: async (): Promise<CafeCategory[]> => {
      const { data, error } = await db()
        .from("cafe_categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

/** Reuses the categories list rather than firing a second query for one row. */
export const useCafeCategoryBySlug = (slug: string | undefined) => {
  const { data, isPending, error } = useCafeCategories();
  return {
    category: data?.find((category) => category.slug === slug),
    isPending,
    error: error as Error | null,
  };
};

/**
 * Every place in one query. The dataset is a couple's food list, not a
 * warehouse — fetching it whole keeps the index card stats free and avoids a
 * query per category.
 */
export const useAllCafePlaces = () =>
  useQuery({
    queryKey: cafeKeys.places,
    queryFn: async (): Promise<CafePlace[]> => {
      const { data, error } = await db().from("cafe_places").select("*");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

/** Places for one category, sliced from the single places query. */
export const useCafePlaces = (categoryId: string | undefined) => {
  const query = useAllCafePlaces();
  return {
    ...query,
    data: categoryId
      ? (query.data ?? []).filter((place) => place.category_id === categoryId)
      : [],
  };
};

/**
 * Writes need a session — the RLS policies are `auth.role() = 'authenticated'`.
 * Signed out, Postgres answers with its own wording, which means nothing to
 * anyone standing in a chip shop. Translate it once, here.
 */
const writeError = (message: string): Error =>
  /row-level security/i.test(message)
    ? new Error("Sign in first — only signed-in accounts can change the lists.")
    : new Error(message);

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, icon }: { name: string; icon: string }): Promise<CafeCategory> => {
      const { data: existing, error: readError } = await db()
        .from("cafe_categories")
        .select("slug");
      if (readError) throw new Error(readError.message);

      const slug = uniqueSlug(
        name,
        (existing ?? []).map((row) => row.slug as string)
      );

      const { data, error } = await db()
        .from("cafe_categories")
        .insert({ name: name.trim(), slug, icon })
        .select()
        .single();
      if (error) throw writeError(error.message);
      return data as CafeCategory;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cafeKeys.categories }),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: string): Promise<void> => {
      const { error } = await db().from("cafe_categories").delete().eq("id", categoryId);
      if (error) throw writeError(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cafeKeys.all }),
  });
};

/**
 * Insert or update one place. Optimistic: the row lands in the cache before the
 * network answers, so changing a rating never feels like a round trip.
 */
export const useSavePlace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (place: NewCafePlace): Promise<CafePlace> => {
      const { id, ...fields } = place;
      const payload = { ...fields, name: fields.name.trim() };

      if (id) {
        const { data, error } = await db()
          .from("cafe_places")
          .update(payload)
          .eq("id", id)
          .select()
          .single();
        if (error) throw writeError(error.message);
        return data as CafePlace;
      }

      const { data, error } = await db()
        .from("cafe_places")
        .insert(payload)
        .select()
        .single();
      if (error) throw writeError(error.message);
      return data as CafePlace;
    },
    onMutate: async (place) => {
      await queryClient.cancelQueries({ queryKey: cafeKeys.places });
      const previous = queryClient.getQueryData<CafePlace[]>(cafeKeys.places);
      if (previous && place.id) {
        queryClient.setQueryData<CafePlace[]>(
          cafeKeys.places,
          previous.map((row) =>
            // `id` is re-pinned from the row so the spread cannot widen it to
            // `string | undefined` — NewCafePlace declares it optional.
            row.id === place.id ? ({ ...row, ...place, id: row.id } as CafePlace) : row
          )
        );
      }
      return { previous };
    },
    onError: (_error, _place, context) => {
      if (context?.previous) queryClient.setQueryData(cafeKeys.places, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: cafeKeys.places }),
  });
};

export const useDeletePlace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (place: CafePlace): Promise<void> => {
      const { error } = await db().from("cafe_places").delete().eq("id", place.id);
      if (error) throw writeError(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cafeKeys.places }),
  });
};
