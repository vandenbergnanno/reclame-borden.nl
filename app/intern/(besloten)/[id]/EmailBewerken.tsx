"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Alleen zichtbaar/bruikbaar zolang deze e-mail nog niet écht verstuurd is (zie `verzonden` op
// de aanroepende pagina) — de route zelf weigert de aanpassing ook server-side als dat niet meer
// het geval is.
export function EmailBewerken({
  aanvraagId,
  emailId,
  huidigOnderwerp,
  huidigePlatteTekst,
  huidigeHtmlInhoud,
}: {
  aanvraagId: string;
  emailId: string;
  huidigOnderwerp: string;
  huidigePlatteTekst: string;
  huidigeHtmlInhoud: string;
}) {
  const router = useRouter();
  const [bewerken, setBewerken] = useState(false);
  const [onderwerp, setOnderwerp] = useState(huidigOnderwerp);
  const [platteTekst, setPlatteTekst] = useState(huidigePlatteTekst);
  const [htmlInhoud, setHtmlInhoud] = useState(huidigeHtmlInhoud);
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  function reset() {
    setOnderwerp(huidigOnderwerp);
    setPlatteTekst(huidigePlatteTekst);
    setHtmlInhoud(huidigeHtmlInhoud);
    setFoutmelding(null);
  }

  async function opslaan() {
    setBezig(true);
    setFoutmelding(null);

    try {
      const response = await fetch(`/api/aanvragen/${aanvraagId}/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onderwerp, platte_tekst: platteTekst, html_inhoud: htmlInhoud }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "E-mail kon niet worden aangepast.");
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
        E-mail bewerken
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <label className="block text-xs font-medium text-neutral-600">
        Onderwerp
        <input
          type="text"
          value={onderwerp}
          onChange={(event) => setOnderwerp(event.target.value)}
          className="mt-1 block w-full rounded border border-neutral-300 px-2 py-1 text-sm focus:border-brand-groen focus:outline-none"
        />
      </label>
      <label className="block text-xs font-medium text-neutral-600">
        Platte tekst
        <textarea
          value={platteTekst}
          onChange={(event) => setPlatteTekst(event.target.value)}
          rows={5}
          className="mt-1 block w-full rounded border border-neutral-300 px-2 py-1 text-sm focus:border-brand-groen focus:outline-none"
        />
      </label>
      <label className="block text-xs font-medium text-neutral-600">
        HTML-inhoud
        <textarea
          value={htmlInhoud}
          onChange={(event) => setHtmlInhoud(event.target.value)}
          rows={8}
          className="mt-1 block w-full rounded border border-neutral-300 px-2 py-1 font-mono text-xs focus:border-brand-groen focus:outline-none"
        />
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={opslaan}
          disabled={bezig || !onderwerp.trim() || !platteTekst.trim() || !htmlInhoud.trim()}
          className="rounded bg-brand-groen-donker px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {bezig ? "Opslaan..." : "Opslaan"}
        </button>
        <button
          type="button"
          onClick={() => {
            setBewerken(false);
            reset();
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
