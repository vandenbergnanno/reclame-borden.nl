import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Server-only client: gebruikt de service-role key en mag daarom nooit in
// client-side code (of een `"use client"`-component) geïmporteerd worden.
// Zolang er nog geen login/rechtenbeheer is, loopt alle databasetoegang
// via API-routes met deze client (bypassed RLS bewust, tot rechtenbeheer er is).
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase-omgevingsvariabelen ontbreken. Vul NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY in (zie .env.example)."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
