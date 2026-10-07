"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABBLADEN = [
  { href: "/intern", label: "Aanvragen" },
  { href: "/intern/concepten", label: "Concepten" },
  { href: "/intern/klanten", label: "Klanten" },
] as const;

export function InternNav({ looptVastAantal = 0 }: { looptVastAantal?: number }) {
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
            className={`inline-flex items-center gap-1.5 ${actief ? "text-brand-groen" : "text-neutral-600 hover:text-brand-groen"}`}
          >
            {tabblad.label}
            {tabblad.href === "/intern/concepten" && looptVastAantal > 0 && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white"
                title={`${looptVastAantal} concept(en) lopen vast`}
              >
                {looptVastAantal}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
