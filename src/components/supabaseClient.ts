import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Pre-define the variable so it can be exported
let supabase: SupabaseClient | null = null;

try {
  const env = (import.meta as any).env;
  const supabaseUrl = 'https://ihbjltaimjoyidtwvhtq.supabase.co';
  const supabaseAnonKey = 'sb_publishable_RXHk9OrOcoTcohLqmOPpIQ_cxxxGySn';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

export { supabase };