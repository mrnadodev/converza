import { createClient as createSbClient, type SupabaseClient } from "@supabase/supabase-js";

// Client Supabase avec la clé SERVICE ROLE — bypass la RLS.
// UNIQUEMENT côté serveur (jamais exposé au navigateur).
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSbClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
