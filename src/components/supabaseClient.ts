import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Pre-define the variable so it can be exported
let supabase: SupabaseClient | null = null;

try {
  const env = (import.meta as any).env;
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

export { supabase };