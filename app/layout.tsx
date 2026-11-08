import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { CookieMelding } from "@/components/CookieMelding";
import { TOON_PROTOTYPE_LABEL, CONTACTGEGEVENS } from "@/lib/constants/brand";
import "./globals.css";

const BESCHRIJVING = "Ontwerp zelf je reclamebord met je eigen logo, tekst en kleuren. Gratis ontwerptool van De Mediagraaf.";

export const metadata: Metadata = {
  title: "reclame-borden.nl",
  description: BESCHRIJVING,
  // Nog niet gepubliceerd: de site is wel bereikbaar voor iedereen met de link (geen inlog nodig
  // voor de klantkant), maar mag nog niet door zoekmachines gevonden/geïndexeerd worden -- zie
  // ook app/robots.ts. Verwijder dit zodra de site echt publiek live gaat.
  robots: { index: false, follow: false },
  // og:image komt automatisch van app/opengraph-image.tsx (Next.js regelt dat zelf zodra dat
  // bestand bestaat) -- hier alleen titel/beschrijving/type voor de linkpreview in WhatsApp/LinkedIn.
  openGraph: {
    title: "reclame-borden.nl — gratis ontwerptool",
    description: BESCHRIJVING,
    type: "website",
    locale: "nl_NL",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">{children}</main>
          <footer className="space-y-1 px-6 py-6 text-center text-xs text-neutral-500">
            {TOON_PROTOTYPE_LABEL && <p>Prototype</p>}
            <p>
              {[
                "De Mediagraaf (Schaik Grafimedia B.V.)",
                CONTACTGEGEVENS.adres || null,
                "Oudewater",
                CONTACTGEGEVENS.telefoonnummer || null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p>
              <a href="mailto:info@demediagraaf.nl" className="underline hover:text-brand-groen">
                info@demediagraaf.nl
              </a>
              {CONTACTGEGEVENS.kvkNummer && <> · KvK {CONTACTGEGEVENS.kvkNummer}</>} ·{" "}
              <a
                href="https://www.demediagraaf.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-groen"
              >
                www.demediagraaf.nl
              </a>
            </p>
            <p>
              <a href="/privacybeleid" className="underline hover:text-brand-groen">
                Privacybeleid
              </a>
            </p>
          </footer>
        </div>
        <CookieMelding />
      </body>
    </html>
  );
}
