import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Fail fast with a clear, actionable message instead of crashing later with an
 * opaque "supabaseUrl is required" or "Invalid API key" deep inside Supabase SDK
 * internals (e.g. during onAuthStateChange) when env vars are missing.
 */
if (!SUPABASE_URL || !/^https?:\/\//.test(SUPABASE_URL)) {
  throw new Error(
    'SyncVerse config error: VITE_SUPABASE_URL is missing or invalid. ' +
      'Copy .env.example to .env, fill in your Supabase project URL, and restart the dev server.'
  );
}

if (
  !SUPABASE_PUBLISHABLE_KEY ||
  SUPABASE_PUBLISHABLE_KEY.length < 30 ||
  // A publishable/anon key is either a JWT (eyJ...) or the newer sb_publishable_ format.
  !/^(eyJ|sb_publishable_)/.test(SUPABASE_PUBLISHABLE_KEY)
) {
  throw new Error(
    'SyncVerse config error: VITE_SUPABASE_PUBLISHABLE_KEY is missing or malformed. ' +
      'Copy .env.example to .env, paste your Supabase publishable (anon) key, and restart the dev server.'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});