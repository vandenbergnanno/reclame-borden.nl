"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Alleen zichtbaar/bruikbaar zolang de bijbehorende e-mail nog niet écht verstuurd is (zie
// `verzonden` op de aanroepende pagina) — de route zelf weigert de aanpassing ook server-side
// als dat niet meer het geval is.
export function ConceptBewerken({
  aanvraagId,
  designId,
  huidigeOpslaglocatie,
}: {
  aanvraagId: string;
  designId: string;
  huidigeOpslaglocatie: string;
}) {
  const router = useRouter();
  const [bewerken, setBewerken] = useState(false);
  const [opslaglocatie, setOpslaglocatie] = useState(huidigeOpslaglocatie);
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  async function opslaan() {
    setBezig(true);
    setFoutmelding(null);

    try {
      const response = await fetch(`/api/aanvragen/${aanvraagId}/designs/${designId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opslaglocatie }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Concept kon niet worden aangepast.");
      }

      setBewerken(false);
      router.refresh();
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
    } finally {
      setBezig(false);
    }
  }

  if (!bewerken) {
    return (
      <button
        type="button"
        onClick={() => setBewerken(true)}
        className="text-xs font-medium text-brand-groen hover:underline"
      >
        Concept bewerken
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <label className="block text-xs font-medium text-neutral-600">
        Afbeeldingslocatie
        <input
          type="text"
          value={opslaglocatie}
          onChange={(event) => setOpslaglocatie(event.target.value)}
          className="mt-1 block w-full rounded border border-neutral-300 px-2 py-1 text-sm focus:border-brand-groen focus:outline-none"
        />
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={opslaan}
          disabled={bezig || opslaglocatie.trim() === ""}
          className="rounded bg-brand-groen-donker px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {bezig ? "Opslaan..." : "Opslaan"}
        </button>
        <button
          type="button"
          onClick={() => {
            setBewerken(false);
            setOpslaglocatie(huidigeOpslaglocatie);
            setFoutmelding(null);
          }}
          disabled={bezig}
          className="text-xs text-neutral-500 hover:text-brand-zwart"
        >
          Annuleren
        </button>
      </div>
      {foutmelding && <p className="text-xs text-red-700">{foutmelding}</p>}
    </div>
  );
}
