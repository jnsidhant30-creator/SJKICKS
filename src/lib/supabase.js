import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect unconfigured placeholders
const isPlaceholderUrl =
  !supabaseUrl ||
  supabaseUrl.includes('your-project-url') ||
  !supabaseUrl.startsWith('http');

const isPlaceholderKey =
  !supabaseAnonKey ||
  supabaseAnonKey.includes('PASTE_YOUR') ||
  supabaseAnonKey.includes('your-anon-key');

export const isSupabaseConfigured = Boolean(!isPlaceholderUrl && !isPlaceholderKey);

// Graceful fallback client if credentials are not yet supplied or invalid
function initSupabaseClient() {
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('[Supabase Init] Safe initialization fallback:', err.message);
    return null;
  }
}

export const supabase = initSupabaseClient();

export default supabase;
