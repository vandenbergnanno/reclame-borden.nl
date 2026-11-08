"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MediagraafLogo } from "@/components/MediagraafLogo";
import { createBrowserSupabaseClient } from "@/lib/supabase/browserClient";

// Op /intern heeft InternLayout (app/intern/(besloten)/layout.tsx) al zijn eigen sub-navigatie +
// uitlogknop -- deze publieke klantnavigatie (nieuwe aanvraag, inloggen, enz.) hoort daar niet
// nogmaals bovenop, dat was onnodig verwarrend voor medewerkers.
export function SiteHeader() {
  const pathname = usePathname();

  // Onbekend bij de allereerste render (server weet dit niet) -- totdat de sessie-check klaar is,
  // laten we "Inloggen" gewoon staan; dat is hooguit een halve seconde fout, nooit andersom (nooit
  // "Mijn account" tonen aan iemand die niet is ingelogd).
  const [email, setEmail] = useState<string | null>(null);
  const ingelogd = email !== null;

  useEffect(() => {
    let actief = true;
    let supabase: ReturnType<typeof createBrowserSupabaseClient>;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      return; // Supabase nog niet geconfigureerd (zie .env.example) -- dan blijft het gewoon "Inloggen"
    }
    supabase.auth.getSession().then(({ data }) => {
      if (actief) setEmail(data.session?.user.email ?? null);
    });
    const { data: subscriptie } = supabase.auth.onAuthStateChange((_event, session) => {
      if (actief) setEmail(session?.user.email ?? null);
    });
    return () => {
      actief = false;
      subscriptie.subscription.unsubscribe();
    };
  }, []);

  async function uitloggen() {
    try {
      await createBrowserSupabaseClient().auth.signOut();
    } catch {
      // Supabase nog niet geconfigureerd -- er was dan toch geen sessie om uit te loggen.
    }
    window.location.href = "/";
  }

  // /intern/login is de publieke inlogpagina voor medewerkers -- die hoort wel de normale
  // header/logo te hebben, alleen het afgeschermde deel erachter (InternLayout heeft daar al zijn
  // eigen sub-navigatie + uitlogknop) niet.
  if (pathname?.startsWith("/intern") && pathname !== "/intern/login") return null;

  // Op /toegang (de tijdelijke site-brede wachtwoordpoort, zie middleware.ts) sturen
  // "Nieuwe aanvraag" en "Inloggen" alleen naar dezelfde pagina terug -- die horen hier niet,
  // alleen het logo blijft staan.
  const opToegangspagina = pathname === "/toegang";

  return (
    <header className="border-b-4 border-brand-groen bg-white px-4 py-3 sm:px-6">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <a href="/" className="flex shrink-0 items-center gap-2">
          <MediagraafLogo size="md" />
          <span className="hidden sm:inline">
            <span className="block text-sm font-semibold leading-tight text-brand-zwart">reclame-borden.nl</span>
            <span className="block text-xs leading-tight text-neutral-500">door De Mediagraaf, Oudewater</span>
          </span>
        </a>
        {!opToegangspagina && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-zwart sm:gap-4 sm:text-sm">
            <a href="/aanvraag" className="whitespace-nowrap hover:text-brand-groen">
              Nieuwe aanvraag
            </a>
            {ingelogd ? (
              <>
                <a href="/mijn-borden" className="whitespace-nowrap hover:text-brand-groen">
                  Mijn borden
                </a>
                <span className="hidden whitespace-nowrap text-neutral-500 sm:inline">{email}</span>
                <a href="/mijn-account" className="whitespace-nowrap hover:text-brand-groen">
                  Mijn account
                </a>
                <button type="button" onClick={uitloggen} className="whitespace-nowrap hover:text-brand-groen">
                  Uitloggen
                </button>
              </>
            ) : (
              <a href="/inloggen" className="whitespace-nowrap hover:text-brand-groen">
                Inloggen
              </a>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
