import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client en lecture publique, sans session ni cookie.
 *
 * Pour les données que tout visiteur peut voir (vitrines, boutiques
 * présentées). Passer par le client serveur habituel lit les cookies de la
 * requête, ce qui oblige Next à recalculer la page à chaque visite — alors que
 * ces données sont les mêmes pour tout le monde et se mettent en cache.
 */
export function createPublicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
