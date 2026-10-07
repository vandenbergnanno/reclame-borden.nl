import type { ReactNode } from "react";
import { InternNav } from "./InternNav";
import { UitloggenKnop } from "./UitloggenKnop";
import { telLooptVastAanvragen } from "@/lib/intern/looptVast";

// Gedeelde sub-navigatie + uitlogknop voor alle afgeschermde /intern-pagina's. De inlogpagina zelf
// (/intern/login) valt hier bewust buiten — die staat als sibling-route buiten deze route group.
export default async function InternLayout({ children }: { children: ReactNode }) {
  const looptVastAantal = await telLooptVastAanvragen();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <InternNav looptVastAantal={looptVastAantal} />
        <UitloggenKnop />
      </div>
      {children}
    </div>
  );
}
