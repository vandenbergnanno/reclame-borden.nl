import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Browser-client met de publieke anon key. Nu nog niet in gebruik (het klantformulier
// praat via /api/aanvragen met de server), maar alvast beschikbaar voor toekomstige
// client-side functionaliteit (bijv. live status-updates).
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase-omgevingsvariabelen ontbreken. Vul NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY in (zie .env.example)."
    );
  }

  return createClient<Database>(url, anonKey);
}
