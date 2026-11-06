import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { CookieMelding } from "@/components/CookieMelding";
import "./globals.css";

export const metadata: Metadata = {
  title: "reclame-borden.nl — Conceptor",
  description: "Interne prototype-tool voor het aanvragen en beoordelen van reclamebord-ontwerpen.",
  // Nog niet gepubliceerd: de site is wel bereikbaar voor iedereen met de link (geen inlog nodig
  // voor de klantkant), maar mag nog niet door zoekmachines gevonden/geïndexeerd worden -- zie
  // ook app/robots.ts. Verwijder dit zodra de site echt publiek live gaat.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">{children}</main>
          <footer className="px-6 py-4 text-center text-xs text-neutral-500">
            Prototype — reclame-borden.nl ·{" "}
            <a href="/privacybeleid" className="underline hover:text-brand-groen">
              Privacybeleid
            </a>
          </footer>
        </div>
        <CookieMelding />
      </body>
    </html>
  );
}
