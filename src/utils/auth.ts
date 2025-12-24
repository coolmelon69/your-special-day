// Authentication utilities using Supabase Auth

import { supabase, isSupabaseAvailable } from "./supabaseClient";
import type { User, Session, AuthError } from "@supabase/supabase-js";

export interface SignUpResult {
  user: User | null;
  error: AuthError | null;
}

export interface SignInResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Sign up a new user with email and password
 */
export const signUp = async (
  email: string,
  password: string
): Promise<SignUpResult> => {
  if (!isSupabaseAvailable() || !supabase) {
    return {
      user: null,
      error: { message: "Supabase is not available", status: 500 } as AuthError,
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    return {
      user: data.user,
      error,
    };
  } catch (error) {
    console.error("Error signing up:", error);
    return {
      user: null,
      error: error as AuthError,
    };
  }
};

/**
 * Sign in an existing user with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<SignInResult> => {
  if (!isSupabaseAvailable() || !supabase) {
    return {
      user: null,
      session: null,
      error: { message: "Supabase is not available", status: 500 } as AuthError,
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data.user,
      session: data.session,
      error,
    };
  } catch (error) {
    console.error("Error signing in:", error);
    return {
      user: null,
      session: null,
      error: error as AuthError,
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  if (!isSupabaseAvailable() || !supabase) {
    return {
      error: { message: "Supabase is not available", status: 500 } as AuthError,
    };
  }

  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error("Error signing out:", error);
    return { error: error as AuthError };
  }
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isSupabaseAvailable() || !supabase) {
    return null;
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

/**
 * Get the current session
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  if (!isSupabaseAvailable() || !supabase) {
    return null;
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error("Error getting current session:", error);
    return null;
  }
};

/**
 * Listen to authentication state changes
 * Returns an unsubscribe function
 */
export const onAuthStateChange = (
  callback: (user: User | null) => void
): (() => void) => {
  if (!isSupabaseAvailable() || !supabase) {
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
};


