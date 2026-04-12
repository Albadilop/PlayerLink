import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Cliente Supabase para el navegador (clave anon + RLS).
 * Devuelve null si faltan variables: la app sigue usando Flask/JWT hasta que completes la migración.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!url || !anonKey) {
    return null;
  }
  if (!browserClient) {
    browserClient = createClient(url, anonKey);
  }
  return browserClient;
}

export function isSupabaseConfigured(): boolean {
  return !!(
    (import.meta.env.VITE_SUPABASE_URL || "").trim() &&
    (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim()
  );
}
