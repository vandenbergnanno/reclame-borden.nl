"use client";

import { usePathname } from "next/navigation";
import { MediagraafLogo } from "@/components/MediagraafLogo";

// Op /intern heeft InternLayout (app/intern/(besloten)/layout.tsx) al zijn eigen sub-navigatie +
// uitlogknop -- deze publieke klantnavigatie (nieuwe aanvraag, inloggen, enz.) hoort daar niet
// nogmaals bovenop, dat was onnodig verwarrend voor medewerkers.
export function SiteHeader() {
  const pathname = usePathname();
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
          <a href="/inloggen" className="whitespace-nowrap hover:text-brand-groen">
            Inloggen
          </a>
        </div>
      </nav>
    </header>
  );
}
