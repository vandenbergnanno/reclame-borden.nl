"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function InternNav() {
  const pathname = usePathname() ?? "";
  const opKlanten = pathname.startsWith("/intern/klanten");

  return (
    <nav className="flex gap-4 text-sm font-medium">
      <Link
        href="/intern"
        className={opKlanten ? "text-neutral-600 hover:text-brand-groen" : "text-brand-groen"}
      >
        Aanvragen
      </Link>
      <Link
        href="/intern/klanten"
        className={opKlanten ? "text-brand-groen" : "text-neutral-600 hover:text-brand-groen"}
      >
        Klanten
      </Link>
    </nav>
  );
}
