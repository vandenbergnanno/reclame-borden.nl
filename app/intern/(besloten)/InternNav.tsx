"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABBLADEN = [
  { href: "/intern", label: "Aanvragen" },
  { href: "/intern/concepten", label: "Concepten" },
  { href: "/intern/klanten", label: "Klanten" },
] as const;

export function InternNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex gap-4 text-sm font-medium">
      {TABBLADEN.map((tabblad) => {
        // "/intern" is zelf ook het voorvoegsel van elk ander tabblad-pad, dus die mag alleen
        // actief zijn op een exacte match.
        const actief = tabblad.href === "/intern" ? pathname === "/intern" : pathname.startsWith(tabblad.href);
        return (
          <Link
            key={tabblad.href}
            href={tabblad.href}
            className={actief ? "text-brand-groen" : "text-neutral-600 hover:text-brand-groen"}
          >
            {tabblad.label}
          </Link>
        );
      })}
    </nav>
  );
}
