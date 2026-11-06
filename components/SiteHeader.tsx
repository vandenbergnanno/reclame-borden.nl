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
  const [ingelogd, setIngelogd] = useState(false);

  useEffect(() => {
    let actief = true;
    let supabase: ReturnType<typeof createBrowserSupabaseClient>;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      return; // Supabase nog niet geconfigureerd (zie .env.example) -- dan blijft het gewoon "Inloggen"
    }
    supabase.auth.getSession().then(({ data }) => {
      if (actief) setIngelogd(!!data.session);
    });
    const { data: subscriptie } = supabase.auth.onAuthStateChange((_event, session) => {
      if (actief) setIngelogd(!!session);
    });
    return () => {
      actief = false;
      subscriptie.subscription.unsubscribe();
    };
  }, []);

  if (pathname?.startsWith("/intern")) return null;

  return (
    <header className="border-b-4 border-brand-groen bg-white px-4 py-3 sm:px-6">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <a href="/" className="flex shrink-0 items-center gap-2">
          <MediagraafLogo size="sm" />
          <span className="hidden text-sm font-semibold text-brand-zwart sm:inline">reclame-borden.nl</span>
          <span className="hidden text-sm text-neutral-400 sm:inline">· Conceptor</span>
        </a>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-zwart sm:gap-4 sm:text-sm">
          <a href="/aanvraag" className="whitespace-nowrap hover:text-brand-groen">
            Nieuwe aanvraag
          </a>
          {ingelogd ? (
            <a href="/mijn-borden" className="whitespace-nowrap hover:text-brand-groen">
              Mijn account
            </a>
          ) : (
            <a href="/inloggen" className="whitespace-nowrap hover:text-brand-groen">
              Inloggen
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
