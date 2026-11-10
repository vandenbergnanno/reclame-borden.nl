"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Deze mail is bewust alleen een akkoordvraag bij het drukklare bestand -- geen factuur/prijs. Die
// komt pas later, in een apart (nog te bouwen) moment na goedkeuring. Het bedrag excl. btw dat de
// medewerker hieronder kan invullen is dus puur een interne notitie (zie BevestigingsmailKopieren),
// niet iets wat in deze tekst terechtkomt.
function bouwTekst({
  klantNaam,
  bordnaam,
  afmeting,
  aantal,
}: {
  klantNaam: string;
  bordnaam: string | null;
  afmeting: string;
  aantal: number;
}): string {
  const bordLabel = bordnaam || afmeting;

  return [
    `Beste ${klantNaam || "klant"},`,
    "",
    `Hierbij het ontwerp van uw bord: ${bordLabel}${aantal > 1 ? ` (${aantal}x)` : ""}.`,
    "",
    "Het drukklare bestand vindt u in de bijlage. Gaat u akkoord met dit ontwerp, zodat we het in productie kunnen nemen?",
    "",
    "Met vriendelijke groet,",
    "reclame-borden.nl",
  ].join("\n");
}

export function BevestigingsmailKopieren({
  aanvraagId,
  klantNaam,
  bordnaam,
  afmeting,
  aantal,
  factuurprijsExclBtw,
}: {
  aanvraagId: string;
  klantNaam: string;
  bordnaam: string | null;
  afmeting: string;
  aantal: number;
  factuurprijsExclBtw: number | null;
}) {
  const router = useRouter();
  const [prijsInput, setPrijsInput] = useState(factuurprijsExclBtw !== null ? String(factuurprijsExclBtw) : "");
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [gekopieerd, setGekopieerd] = useState(false);

  const prijsGetal = prijsInput.trim() === "" ? null : Number(prijsInput);
  const prijsGeldig = prijsGetal === null || (Number.isFinite(prijsGetal) && prijsGetal >= 0);
  const huidigeOpgeslagenWaarde = factuurprijsExclBtw !== null ? String(factuurprijsExclBtw) : "";
  const prijsGewijzigd = prijsInput.trim() !== huidigeOpgeslagenWaarde.trim();

  const tekst = bouwTekst({ klantNaam, bordnaam, afmeting, aantal });

  async function prijsOpslaan() {
    if (!prijsGeldig) return;
    setBezig(true);
    setFoutmelding(null);

    try {
      const response = await fetch(`/api/aanvragen/${aanvraagId}/factuurprijs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factuurprijsExclBtw: prijsGetal }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Prijs kon niet worden opgeslagen.");
      }

      router.refresh();
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
    } finally {
      setBezig(false);
    }
  }

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
    <div className="space-y-3">
      <h2 className="font-semibold text-brand-zwart">Goedkeuringsmail (ontwerp)</h2>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
            Interne notitie: bedrag excl. btw (gaat niet mee in de mail)
          </span>
          <span className="flex items-center gap-1">
            <span>€</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={prijsInput}
              onChange={(event) => setPrijsInput(event.target.value)}
              className="w-32 rounded border border-neutral-300 px-2 py-1.5 focus:border-brand-groen focus:outline-none"
            />
          </span>
        </label>
        <button
          type="button"
          onClick={prijsOpslaan}
          disabled={bezig || !prijsGeldig || !prijsGewijzigd}
          className="rounded bg-brand-groen-donker px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {bezig ? "Opslaan..." : "Prijs opslaan"}
        </button>
        {foutmelding && <span className="text-sm text-red-700">{foutmelding}</span>}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-neutral-500">Plak dit in je eigen mailprogramma en verstuur naar de klant.</p>
        <button
          type="button"
          onClick={kopieer}
          className="rounded bg-brand-groen-donker px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {gekopieerd ? "Gekopieerd!" : "Kopieer tekst"}
        </button>
      </div>
      <textarea
        readOnly
        value={tekst}
        rows={11}
        onFocus={(event) => event.target.select()}
        className="w-full rounded border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
      />
    </div>
  );
}
