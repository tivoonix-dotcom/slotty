import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient<Database> | null = null;

/**
 * Supabase browser client. Uses `import.meta.env.VITE_SUPABASE_URL` and
 * `import.meta.env.VITE_SUPABASE_ANON_KEY` (see `.env.example`).
 */
export function getSupabase(): SupabaseClient<Database> | null {
  if (!url || !anon) return null;
  if (!client) {
    client = createClient<Database>(url, anon);
  }
  return client;
}
