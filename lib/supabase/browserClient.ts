"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

// Browser-client voor de klant-inlog/account-pagina's: gebruikt de publieke anon-key (niet de
// service-role key uit lib/supabase/server.ts, die nooit naar de browser mag). Rechten worden
// afgedwongen door Row Level Security (zie supabase/migrations/0003_klant_accounts.sql), niet
// door deze key geheim te houden -- de anon-key is bewust openbaar.
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase-omgevingsvariabelen ontbreken. Vul NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY in (zie .env.example)."
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
