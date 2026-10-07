"use client";

import { useMemo, useState } from "react";

interface KlantRij {
  klantId: string;
  naam: string;
  bedrijf: string | null;
  email: string;
  telefoon: string | null;
  provincie: string;
  aantalAanvragen: number;
  aantalOpen: number;
  heeftProductieItems: boolean;
  heeftConceptItems: boolean;
}

// Client-side filteren is hier voldoende: alle klanten worden toch al in één keer opgehaald
// (geen paginering), dus een zoekveld dat lokaal filtert is simpeler en sneller dan een extra
// server-rondje per toetsaanslag.
export function KlantenTabel({ rijen }: { rijen: KlantRij[] }) {
  const [zoekterm, setZoekterm] = useState("");

  const gefilterd = useMemo(() => {
    const term = zoekterm.trim().toLowerCase();
    if (!term) return rijen;
    return rijen.filter((rij) =>
      [rij.naam, rij.bedrijf, rij.email, rij.provincie].some((veld) => veld?.toLowerCase().includes(term))
    );
  }, [rijen, zoekterm]);

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={zoekterm}
        onChange={(event) => setZoekterm(event.target.value)}
        placeholder="Zoek op naam, bedrijf, e-mail of provincie..."
        className="w-full max-w-sm rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-groen focus:outline-none focus:ring-1 focus:ring-brand-groen sm:w-auto"
      />

      {gefilterd.length === 0 && (
        <p className="text-sm text-neutral-500">Geen klanten gevonden voor &ldquo;{zoekterm}&rdquo;.</p>
      )}

      {gefilterd.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Naam</th>
                <th className="px-4 py-3 font-semibold">Bedrijf</th>
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">Telefoon</th>
                <th className="px-4 py-3 font-semibold">Provincie</th>
                <th className="px-4 py-3 font-semibold">Aanvragen</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {gefilterd.map((rij) => (
                <tr key={rij.klantId} className="transition hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-brand-zwart">{rij.naam}</td>
                  <td className="px-4 py-3 text-neutral-600">{rij.bedrijf ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{rij.email}</td>
                  <td className="px-4 py-3 text-neutral-600">{rij.telefoon ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{rij.provincie}</td>
                  <td className="px-4 py-3">
                    <span className="text-neutral-600">{rij.aantalAanvragen}</span>
                    {rij.aantalOpen > 0 && (
                      <span className="ml-2 rounded-full bg-brand-oranje/10 px-2 py-0.5 text-xs font-medium text-brand-oranje">
                        {rij.aantalOpen} lopend
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      {rij.heeftProductieItems && (
                        <a
                          href={`/intern?klant=${rij.klantId}`}
                          className="font-medium text-brand-groen hover:underline"
                        >
                          Aanvragen bekijken →
                        </a>
                      )}
                      {rij.heeftConceptItems && (
                        <a
                          href={`/intern/concepten?klant=${rij.klantId}`}
                          className="font-medium text-brand-groen hover:underline"
                        >
                          Concepten bekijken →
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
