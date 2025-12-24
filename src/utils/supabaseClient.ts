import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are not set. Sync features will be disabled."
  );
}

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Ensure anonymous user is authenticated
export const ensureAnonymousUser = async (): Promise<string | null> => {
  if (!supabase) {
    return null;
  }

  try {
    // Check if user is already authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      return session.user.id;
    }

    // Sign in anonymously
    const {
      data: { user },
      error,
    } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error("Error signing in anonymously:", error);
      return null;
    }

    return user?.id || null;
  } catch (error) {
    console.error("Error ensuring anonymous user:", error);
    return null;
  }
};

// Check if Supabase is available
export const isSupabaseAvailable = (): boolean => {
  return supabase !== null;
};

// Debug function to check Supabase connection
export const debugSupabaseConnection = async (): Promise<void> => {
  console.log("=== Supabase Connection Debug ===");
  console.log("Environment variables:");
  console.log("  VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL ? "✅ Set" : "❌ Missing");
  console.log("  VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing");
  console.log("Supabase client:", supabase ? "✅ Initialized" : "❌ Not initialized");

  if (!supabase) {
    console.error("❌ Supabase client is null. Check your environment variables.");
    return;
  }

  try {
    // Test anonymous auth
    console.log("\nTesting anonymous authentication...");
    const userId = await ensureAnonymousUser();
    console.log("User ID:", userId || "❌ Failed to get user ID");

    if (!userId) {
      console.error("❌ Could not authenticate anonymously");
      return;
    }

    // Test table access
    console.log("\nTesting table access...");
    const { data: stampsData, error: stampsError } = await supabase
      .from("stamps_progress")
      .select("count")
      .limit(1);

    if (stampsError) {
      console.error("❌ Error accessing stamps_progress table:", stampsError);
      console.error("  This might be a RLS policy issue or table doesn't exist");
    } else {
      console.log("✅ stamps_progress table accessible");
    }

    const { data: couponsData, error: couponsError } = await supabase
      .from("coupon_achievements")
      .select("count")
      .limit(1);

    if (couponsError) {
      console.error("❌ Error accessing coupon_achievements table:", couponsError);
      console.error("  This might be a RLS policy issue or table doesn't exist");
    } else {
      console.log("✅ coupon_achievements table accessible");
    }

    console.log("\n=== Debug Complete ===");
  } catch (error) {
    console.error("❌ Error during debug:", error);
  }
};

// Make debug function available globally in development
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as any).debugSupabase = debugSupabaseConnection;
  console.log("💡 Run debugSupabase() in console to test Supabase connection");
}



