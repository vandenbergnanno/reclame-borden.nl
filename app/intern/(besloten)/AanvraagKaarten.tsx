"use client";

import { useMemo, useState } from "react";
import { StatusActieKnop } from "./StatusActieKnop";
import type { AanvraagKaart } from "./page";

// Client-side filteren, zelfde afweging als KlantenTabel.tsx: deze kaarten zijn toch al
// opgehaald voor de huidige status, dus een zoekveld dat lokaal filtert is simpeler en sneller
// dan een extra server-rondje per toetsaanslag.
export function AanvraagKaarten({ kaarten }: { kaarten: AanvraagKaart[] }) {
  const [zoekterm, setZoekterm] = useState("");

  const gefilterd = useMemo(() => {
    const term = zoekterm.trim().toLowerCase();
    if (!term) return kaarten;
    return kaarten.filter((kaart) =>
      [kaart.klantNaam, kaart.bedrijf, kaart.veldtype, kaart.provincie].some((veld) =>
        veld?.toLowerCase().includes(term)
      )
    );
  }, [kaarten, zoekterm]);

  return (
    <div>
      <input
        type="search"
        value={zoekterm}
        onChange={(event) => setZoekterm(event.target.value)}
        placeholder="Zoek op klant, bedrijf, bordtype of provincie..."
        className="mb-3 w-full max-w-sm rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-groen focus:outline-none focus:ring-1 focus:ring-brand-groen"
      />

      {gefilterd.length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-400">
          {kaarten.length === 0
            ? "Geen aanvragen in deze status."
            : `Geen aanvragen gevonden voor "${zoekterm}".`}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {gefilterd.map((kaart) => (
          <div key={kaart.aanvraagId} className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-brand-zwart">{kaart.klantNaam}</p>
                {kaart.bedrijf && <p className="truncate text-xs text-neutral-500">{kaart.bedrijf}</p>}
              </div>
              <StatusActieKnop aanvraagId={kaart.aanvraagId} klantNaam={kaart.klantNaam} huidigeStatus={kaart.statusWaarde} />
            </div>

            <p className="mt-2 text-xs text-neutral-600">{kaart.veldtype}</p>
            <p className="text-xs text-neutral-500">{kaart.provincie}</p>

            <div className="mt-2 flex flex-wrap gap-1">
              {kaart.statusWaarde === "nieuw" && !kaart.isOntwerptool && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    kaart.alGoedgekeurd ? "bg-brand-groen/10 text-brand-groen" : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {kaart.alGoedgekeurd ? "Goedgekeurd door klant" : "Wacht nog op voorstel"}
                </span>
              )}
              {kaart.statusWaarde === "nieuw" && kaart.isOntwerptool && kaart.ontwerpDoorOns && (
                <span className="rounded-full bg-brand-oranje/10 px-2 py-0.5 text-[10px] font-medium text-brand-oranje">
                  Ontwerp nog maken
                </span>
              )}
              {kaart.nieuwBord && (
                <span className="rounded-full bg-brand-oranje/10 px-2 py-0.5 text-[10px] font-medium text-brand-oranje">
                  {kaart.bordAanschaf}
                </span>
              )}
              {kaart.heeftGeblokkeerdeCheck && (
                <span className="rounded-full bg-brand-oranje/10 px-2 py-0.5 text-[10px] font-medium text-brand-oranje">
                  Te controleren
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-neutral-400">{kaart.ingediendOp}</span>
              <a href={`/intern/${kaart.aanvraagId}`} className="text-xs font-medium text-brand-groen hover:underline">
                Bekijken →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
