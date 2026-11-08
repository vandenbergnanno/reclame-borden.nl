"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AANVRAAG_STATUS_LABELS, AANVRAAG_STATUSSEN, type AanvraagStatus } from "@/lib/types/domain";

export function StatusWijzigen({
  aanvraagId,
  huidigeStatus,
}: {
  aanvraagId: string;
  huidigeStatus: AanvraagStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<AanvraagStatus>(huidigeStatus);
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  async function opslaan() {
    setBezig(true);
    setFoutmelding(null);

    try {
      const response = await fetch(`/api/aanvragen/${aanvraagId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Status kon niet worden bijgewerkt.");
      }

      router.refresh();
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as AanvraagStatus)}
        className="rounded border border-neutral-300 px-3 py-2 text-sm focus:border-brand-groen focus:outline-none"
      >
        {AANVRAAG_STATUSSEN.map((optie) => (
          <option key={optie} value={optie}>
            {AANVRAAG_STATUS_LABELS[optie]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={opslaan}
        disabled={bezig || status === huidigeStatus}
        className="rounded bg-brand-groen-donker px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {bezig ? "Opslaan..." : "Status opslaan"}
      </button>
      {foutmelding && <span className="text-sm text-red-700">{foutmelding}</span>}
    </div>
  );
}
