import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  AANVRAAG_STATUS_LABELS,
  AANVRAAG_STATUSSEN,
  BORD_AANSCHAF_LABELS,
  VELDTYPE_LABELS,
  type AanvraagStatus,
} from "@/lib/types/domain";
import { VerwerkGeplandeVoorstellenKnop } from "./VerwerkGeplandeVoorstellenKnop";

export const metadata: Metadata = {
  title: "Intern overzicht — Mediagraaf Conceptor",
};

// Zonder dit rendert Next.js deze pagina als statische HTML tijdens `next build` (met de
// Supabase-data van dat moment bevroren) in plaats van de aanvragen bij elk bezoek opnieuw op
// te halen — dat is niet wat je wilt voor een pagina die live aanvraagstatussen toont.
export const dynamic = "force-dynamic";

function isAanvraagStatus(waarde: string | undefined): waarde is AanvraagStatus {
  return typeof waarde === "string" && (AANVRAAG_STATUSSEN as readonly string[]).includes(waarde);
}

// Server component: haalt aanvragen, klanten en contentchecks apart op en koppelt ze in JS.
// Dat houdt de Supabase-typing eenvoudig, zolang lib/types/database.ts nog handgeschreven is
// (nog geen relaties/embeds zoals de door de CLI gegenereerde types die kennen).
export default async function InternPage({
  searchParams,
}: {
  searchParams: { status?: string; klant?: string };
}) {
  const statusFilter = isAanvraagStatus(searchParams.status) ? searchParams.status : undefined;
  const klantFilter = searchParams.klant;

  let foutmelding: string | null = null;
  let rijen: {
    aanvraagId: string;
    klantNaam: string;
    bedrijf: string | null;
    veldtype: string;
    bordAanschaf: string;
    nieuwBord: boolean;
    status: string;
    ingediendOp: string;
    voorstelGeplandOp: string;
    heeftGeblokkeerdeCheck: boolean;
  }[] = [];
  let statusTellingen: Record<AanvraagStatus, number> = {
    nieuw: 0,
    in_behandeling: 0,
    voorstel_verstuurd: 0,
    goedgekeurd: 0,
    afgewezen: 0,
    geescaleerd: 0,
  };
  let klantNaamFilter: string | null = null;

  try {
    const supabase = createServerSupabaseClient();

    const [{ data: aanvragen, error: aanvragenFout }, { data: klanten, error: klantenFout }, { data: checks, error: checksFout }] =
      await Promise.all([
        supabase.from("aanvragen").select("*").order("created_at", { ascending: false }),
        supabase.from("klanten").select("*"),
        supabase.from("content_checks").select("aanvraag_id, geblokkeerd"),
      ]);

    if (aanvragenFout) throw new Error(aanvragenFout.message);
    if (klantenFout) throw new Error(klantenFout.message);
    if (checksFout) throw new Error(checksFout.message);

    const klantenById = new Map((klanten ?? []).map((klant) => [klant.id, klant]));
    const geblokkeerdeAanvraagIds = new Set(
      (checks ?? []).filter((check) => check.geblokkeerd).map((check) => check.aanvraag_id)
    );

    for (const aanvraag of aanvragen ?? []) {
      statusTellingen[aanvraag.status] = (statusTellingen[aanvraag.status] ?? 0) + 1;
    }

    if (klantFilter) {
      klantNaamFilter = klantenById.get(klantFilter)?.naam ?? "onbekende klant";
    }

    const gefilterd = (aanvragen ?? []).filter((aanvraag) => {
      if (statusFilter && aanvraag.status !== statusFilter) return false;
      if (klantFilter && aanvraag.klant_id !== klantFilter) return false;
      return true;
    });

    rijen = gefilterd.map((aanvraag) => {
      const klant = klantenById.get(aanvraag.klant_id);
      const veldtypeLabel = VELDTYPE_LABELS[aanvraag.veldtype] ?? aanvraag.veldtype;

      return {
        aanvraagId: aanvraag.id,
        klantNaam: klant?.naam ?? "Onbekende klant",
        bedrijf: klant?.bedrijf ?? null,
        veldtype: `${veldtypeLabel} (${aanvraag.afmeting})`,
        bordAanschaf: BORD_AANSCHAF_LABELS[aanvraag.bord_aanschaf] ?? aanvraag.bord_aanschaf,
        nieuwBord: aanvraag.bord_aanschaf === "nieuw",
        status: AANVRAAG_STATUS_LABELS[aanvraag.status] ?? aanvraag.status,
        ingediendOp: new Date(aanvraag.created_at).toLocaleString("nl-NL"),
        voorstelGeplandOp: new Date(aanvraag.voorstel_gepland_op).toLocaleString("nl-NL"),
        heeftGeblokkeerdeCheck: geblokkeerdeAanvraagIds.has(aanvraag.id),
      };
    });
  } catch (error) {
    foutmelding = error instanceof Error ? error.message : "Onbekende fout bij het ophalen van aanvragen.";
  }

  const totaalAantal = Object.values(statusTellingen).reduce((som, n) => som + n, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Aanvragen</h1>
        <p className="mt-1 text-sm text-neutral-600">Alle ingediende aanvragen, met hun huidige status.</p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <StatusTab href="/intern" label="Alle" aantal={totaalAantal} actief={!statusFilter} />
        {AANVRAAG_STATUSSEN.map((optie) => (
          <StatusTab
            key={optie}
            href={`/intern?status=${optie}`}
            label={AANVRAAG_STATUS_LABELS[optie]}
            aantal={statusTellingen[optie]}
            actief={statusFilter === optie}
          />
        ))}
      </div>

      {klantNaamFilter && (
        <p className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          Aanvragen van <span className="font-medium">{klantNaamFilter}</span>.{" "}
          <a href="/intern" className="font-medium text-brand-groen hover:underline">
            Toon alle klanten
          </a>
          .
        </p>
      )}

      <VerwerkGeplandeVoorstellenKnop />

      {foutmelding && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {foutmelding}
        </p>
      )}

      {!foutmelding && rijen.length === 0 && (
        <p className="text-sm text-neutral-600">Geen aanvragen gevonden voor dit filter.</p>
      )}

      {!foutmelding && rijen.length > 0 && (
        <div className="overflow-x-auto rounded border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-brand-zwart">
              <tr>
                <th className="px-4 py-2 font-semibold">Klant</th>
                <th className="px-4 py-2 font-semibold">Bedrijf</th>
                <th className="px-4 py-2 font-semibold">Veldtype</th>
                <th className="px-4 py-2 font-semibold">Bord</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Ingediend op</th>
                <th className="px-4 py-2 font-semibold">Voorstel gepland op</th>
                <th className="px-4 py-2 font-semibold">Contentcheck</th>
                <th className="px-4 py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((rij) => (
                <tr key={rij.aanvraagId} className="border-t border-neutral-200">
                  <td className="px-4 py-2">{rij.klantNaam}</td>
                  <td className="px-4 py-2">{rij.bedrijf ?? "—"}</td>
                  <td className="px-4 py-2">{rij.veldtype}</td>
                  <td className="px-4 py-2">
                    {rij.nieuwBord ? (
                      <span className="rounded-full bg-brand-oranje/10 px-2 py-0.5 text-xs font-medium text-brand-oranje">
                        {rij.bordAanschaf}
                      </span>
                    ) : (
                      rij.bordAanschaf
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-brand-zwart">
                      {rij.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{rij.ingediendOp}</td>
                  <td className="px-4 py-2 text-neutral-600">{rij.voorstelGeplandOp}</td>
                  <td className="px-4 py-2">
                    {rij.heeftGeblokkeerdeCheck ? (
                      <span className="rounded-full bg-brand-oranje/10 px-2 py-0.5 text-xs font-medium text-brand-oranje">
                        Overleg met klant
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={`/intern/${rij.aanvraagId}`}
                      className="font-medium text-brand-groen hover:underline"
                    >
                      Bekijken →
                    </a>
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

function StatusTab({
  href,
  label,
  aantal,
  actief,
}: {
  href: string;
  label: string;
  aantal: number;
  actief: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-full border px-3 py-1 ${
        actief
          ? "border-brand-groen bg-green-50 font-medium text-brand-groen"
          : "border-neutral-300 text-neutral-600 hover:border-brand-groen"
      }`}
    >
      {label} ({aantal})
    </a>
  );
}
