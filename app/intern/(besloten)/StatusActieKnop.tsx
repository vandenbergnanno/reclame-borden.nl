"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AANVRAAG_STATUS_LABELS, VOLGENDE_PRODUCTIESTATUS, type AanvraagStatus } from "@/lib/types/domain";

// Pijltje-knop voor het productiepad (nieuw -> in behandeling -> gemaakt) op een kanban-kaart.
// Vraagt eerst bevestiging, dan pas de PATCH. Toont niets als de huidige status geen volgende
// stap in dit pad heeft (bijv. bij de klant-goedkeuringsstatussen) — die blijven alleen via de
// statusdropdown op de detailpagina wijzigbaar.
export function StatusActieKnop({
  aanvraagId,
  klantNaam,
  huidigeStatus,
}: {
  aanvraagId: string;
  klantNaam: string;
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
    const bevestigd = window.confirm(
      `Weet je zeker dat je de aanvraag van ${klantNaam} wilt verplaatsen naar "${AANVRAAG_STATUS_LABELS[volgende!.status]}"?`
    );
    if (!bevestigd) return;

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
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={doorsturen}
        disabled={bezig}
        title={volgende.label}
        aria-label={volgende.label}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-groen text-brand-groen hover:bg-green-50 disabled:opacity-50"
      >
        {bezig ? "…" : "→"}
      </button>
      {foutmelding && <p className="mt-1 max-w-20 text-center text-[10px] text-red-700">{foutmelding}</p>}
    </div>
  );
}
