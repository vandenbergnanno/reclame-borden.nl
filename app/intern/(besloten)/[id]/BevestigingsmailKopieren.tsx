"use client";

import { useState } from "react";

// Geen automatische verzending (dat wilde de gebruiker expliciet niet) -- alleen een kant-en-klare
// tekst die een medewerker zelf in zijn eigen mailprogramma plakt, met de factuur er zelf bij
// (die bestaat nog niet in dit systeem, dus die blijft buiten de app om).
export function BevestigingsmailKopieren({ tekst }: { tekst: string }) {
  const [gekopieerd, setGekopieerd] = useState(false);

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(tekst);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      // Klembord kan geblokkeerd zijn -- dan kan de medewerker de tekst hieronder zelf selecteren.
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-brand-zwart">Bevestigingsmail</h2>
        <button
          type="button"
          onClick={kopieer}
          className="rounded bg-brand-groen px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          {gekopieerd ? "Gekopieerd!" : "Kopieer tekst"}
        </button>
      </div>
      <textarea
        readOnly
        value={tekst}
        rows={8}
        onFocus={(event) => event.target.select()}
        className="w-full rounded border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
      />
      <p className="text-xs text-neutral-500">Plak dit in je eigen mailprogramma en voeg de factuur zelf toe als bijlage.</p>
    </div>
  );
}
