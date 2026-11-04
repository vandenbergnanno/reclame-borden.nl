import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MediagraafLogo } from "@/components/MediagraafLogo";
import { CookieMelding } from "@/components/CookieMelding";
import "./globals.css";

export const metadata: Metadata = {
  title: "reclame-borden.nl — Conceptor",
  description: "Interne prototype-tool voor het aanvragen en beoordelen van reclamebord-ontwerpen.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <div className="min-h-screen flex flex-col">
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
                <a href="/mijn-borden" className="whitespace-nowrap hover:text-brand-groen">
                  Mijn borden
                </a>
                <a href="/inloggen" className="whitespace-nowrap hover:text-brand-groen">
                  Inloggen
                </a>
                <a href="/intern" className="whitespace-nowrap hover:text-brand-groen">
                  Intern overzicht
                </a>
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">{children}</main>
          <footer className="px-6 py-4 text-center text-xs text-neutral-500">
            Prototype — reclame-borden.nl
          </footer>
        </div>
        <CookieMelding />
      </body>
    </html>
  );
}
