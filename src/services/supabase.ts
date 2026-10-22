import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Supabase initialization failed:', err);
  }
}

export function getSupabaseConfigStatus() {
  return {
    isConfigured: isSupabaseConfigured,
    url: supabaseUrl ? `${supabaseUrl.slice(0, 15)}...` : 'Not set',
    anonKeyConfigured: Boolean(supabaseAnonKey),
    statusText: isSupabaseConfigured
      ? 'Connected to Live Supabase PostgreSQL'
      : 'Active Demo Mode (Persistent In-Memory REST Store)',
  };
}
