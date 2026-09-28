import type { ReactNode } from "react";
import { InternNav } from "./InternNav";
import { UitloggenKnop } from "./UitloggenKnop";

// Gedeelde sub-navigatie + uitlogknop voor alle afgeschermde /intern-pagina's. De inlogpagina zelf
// (/intern/login) valt hier bewust buiten — die staat als sibling-route buiten deze route group.
export default function InternLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <InternNav />
        <UitloggenKnop />
      </div>
      {children}
    </div>
  );
}
