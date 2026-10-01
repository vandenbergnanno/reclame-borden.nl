"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VOLGENDE_PRODUCTIESTATUS, type AanvraagStatus } from "@/lib/types/domain";

// Eénknops-doorstuuractie voor het productiepad (nieuw -> in behandeling -> gemaakt), direct
// vanuit het overzicht — zonder naar de detailpagina te hoeven. Toont niets als de huidige status
// geen volgende stap in dit pad heeft (bijv. bij de klant-goedkeuringsstatussen).
export function StatusActieKnop({
  aanvraagId,
  huidigeStatus,
}: {
  aanvraagId: string;
  huidigeStatus: AanvraagStatus;
}) {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  const volgende = VOLGENDE_PRODUCTIESTATUS[huidigeStatus];

  if (!volgende) {
    return null;
  }

  async function doorsturen() {
    setBezig(true);
    setFoutmelding(null);

    try {
      const response = await fetch(`/api/aanvragen/${aanvraagId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: volgende!.status }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Status kon niet worden bijgewerkt.");
      }

      router.refresh();
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
      setBezig(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={doorsturen}
        disabled={bezig}
        className="whitespace-nowrap rounded border border-brand-groen px-2 py-1 text-xs font-medium text-brand-groen hover:bg-green-50 disabled:opacity-50"
      >
        {bezig ? "Bezig..." : volgende.label}
      </button>
      {foutmelding && <p className="mt-1 text-xs text-red-700">{foutmelding}</p>}
    </div>
  );
}
