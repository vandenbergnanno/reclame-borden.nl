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
    // Next.js patcht de globale fetch() om server-side requests te cachen (de "Data Cache"), ook
    // als de aanroepende pagina `dynamic = "force-dynamic"` heeft -- dat voorkomt alléén het
    // cachen van de RSC-payload zelf, niet per se van elke losse fetch erbinnen. Gezien is dit
    // de supabase-js-client juist belangrijk is voor écht actuele data (bijv. een statuswijziging
    // die een medewerker net heeft opgeslagen), zetten we expliciet `cache: "no-store"` op elke
    // request die deze client doet, in plaats van te vertrouwen op het dynamic-gedrag van de
    // aanroepende pagina.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

// Gebruikt door interne overzichtspagina's om te bepalen of ze live data kunnen ophalen, of
// (zolang er nog geen echt Supabase-project gekoppeld is) moeten terugvallen op de
// voorbeelddata uit lib/demo/voorbeelddata.ts.
export function isSupabaseGeconfigureerd(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Los van isSupabaseGeconfigureerd(): de klant-inlog (/inloggen, /mijn-borden) heeft alleen de
// publieke anon-key nodig (geen service-role key) en kan dus al werken vóórdat de service-role
// key is ingevuld -- maar zonder een Supabase-project is er uiteraard nog geen Auth om in te
// loggen. Alleen deze env-vars lezen (geen server-only import), dus ook bruikbaar vanuit een
// client component.
export function isSupabaseAuthGeconfigureerd(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
