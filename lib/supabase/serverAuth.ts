import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

// Cookie-bewuste server-client voor de klant-sessie (Supabase Auth), te gebruiken in Server
// Components en Route Handlers op /mijn-borden en /inloggen. Dit is bewust een ANDERE client dan
// createServerSupabaseClient() in lib/supabase/server.ts: die laatste gebruikt de service-role
// key (omzeilt altijd RLS, voor de server-routes die namens de hele applicatie werken) — deze
// hier gebruikt de publieke anon-key + de sessie-cookie van de ingelogde klant zelf, zodat Row
// Level Security daadwerkelijk afdwingt dat een klant alleen zijn eigen rijen te zien krijgt.
export function createServerAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase-omgevingsvariabelen ontbreken. Vul NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY in (zie .env.example)."
    );
  }

  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSetten) {
        try {
          toSetten.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Vanuit een Server Component (i.p.v. een Route Handler/Server Action) mogen cookies
          // niet gezet worden -- Next.js gooit dan een fout. Onschadelijk zolang er ook
          // middleware draait die de sessie ververst (zie middleware.ts); daarom hier alleen
          // stil negeren in plaats van de pagina te laten crashen.
        }
      },
    },
  });
}
