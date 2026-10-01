import type { Metadata } from "next";
import { createServerSupabaseClient, isSupabaseGeconfigureerd } from "@/lib/supabase/server";
import {
  VOORBEELD_AANVRAGEN,
  VOORBEELD_CONTENT_CHECKS,
  VOORBEELD_DESIGNS,
  VOORBEELD_FEEDBACK,
  VOORBEELD_KLANTEN,
} from "@/lib/demo/voorbeelddata";
import {
  AANVRAAG_STATUS_KLEUREN,
  AANVRAAG_STATUS_LABELS,
  CONCEPT_STATUSSEN,
  VELDTYPE_LABELS,
  type AanvraagStatus,
} from "@/lib/types/domain";
import { VerwerkGeplandeVoorstellenKnop } from "../VerwerkGeplandeVoorstellenKnop";

export const metadata: Metadata = {
  title: "Concepten — Mediagraaf Conceptor",
};

// Zelfde reden als /intern: live data, dus niet statisch prerenderen.
export const dynamic = "force-dynamic";

function isConceptStatus(waarde: string | undefined): waarde is AanvraagStatus {
  return typeof waarde === "string" && (CONCEPT_STATUSSEN as readonly string[]).includes(waarde);
}

interface ConceptKaart {
  aanvraagId: string;
  klantNaam: string;
  bedrijf: string | null;
  provincie: string;
  veldtype: string;
  statusWaarde: AanvraagStatus;
  voorstelGeplandOp: string;
  laatsteDesign: { versienummer: number; status: string; opslaglocatie: string } | null;
  laatsteFeedback: { goedgekeurd: boolean; feedbacktekst: string | null } | null;
  geblokkeerdeCheck: { probleem: string; toelichting: string | null } | null;
}

// Toont de klant-goedkeuringsflow: welke voorstellen de AI gegenereerd en gemaild heeft, en hoe
// de klant daarop gereageerd heeft. Dit is bewust gescheiden van /intern (de fysieke
// productieflow van al goedgekeurde borden) — zie PRODUCTIE_STATUSSEN/CONCEPT_STATUSSEN in
// lib/types/domain.ts.
export default async function ConceptenPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const actieveStatus: AanvraagStatus = isConceptStatus(searchParams.status) ? searchParams.status : "voorstel_verstuurd";

  let foutmelding: string | null = null;
  let kaarten: ConceptKaart[] = [];
  const toontVoorbeelddata = !isSupabaseGeconfigureerd();

  try {
    let aanvragen: typeof VOORBEELD_AANVRAGEN;
    let klanten: typeof VOORBEELD_KLANTEN;
    let designs: typeof VOORBEELD_DESIGNS;
    let feedback: typeof VOORBEELD_FEEDBACK;
    let checks: typeof VOORBEELD_CONTENT_CHECKS;

    if (toontVoorbeelddata) {
      aanvragen = VOORBEELD_AANVRAGEN;
      klanten = VOORBEELD_KLANTEN;
      designs = VOORBEELD_DESIGNS;
      feedback = VOORBEELD_FEEDBACK;
      checks = VOORBEELD_CONTENT_CHECKS;
    } else {
      const supabase = createServerSupabaseClient();

      const [
        { data: aanvragenData, error: aanvragenFout },
        { data: klantenData, error: klantenFout },
        { data: designsData, error: designsFout },
        { data: feedbackData, error: feedbackFout },
        { data: checksData, error: checksFout },
      ] = await Promise.all([
        supabase.from("aanvragen").select("*").order("created_at", { ascending: false }),
        supabase.from("klanten").select("*"),
        supabase.from("designs").select("*").order("versienummer", { ascending: false }),
        supabase.from("feedback").select("*").order("created_at", { ascending: false }),
        supabase.from("content_checks").select("*"),
      ]);

      if (aanvragenFout) throw new Error(aanvragenFout.message);
      if (klantenFout) throw new Error(klantenFout.message);
      if (designsFout) throw new Error(designsFout.message);
      if (feedbackFout) throw new Error(feedbackFout.message);
      if (checksFout) throw new Error(checksFout.message);

      aanvragen = aanvragenData ?? [];
      klanten = klantenData ?? [];
      designs = designsData ?? [];
      feedback = feedbackData ?? [];
      checks = checksData ?? [];
    }

    const klantenById = new Map(klanten.map((klant) => [klant.id, klant]));

    kaarten = aanvragen
      .filter((aanvraag) => (CONCEPT_STATUSSEN as readonly string[]).includes(aanvraag.status))
      .map((aanvraag) => {
        const klant = klantenById.get(aanvraag.klant_id);
        const veldtypeLabel = VELDTYPE_LABELS[aanvraag.veldtype] ?? aanvraag.veldtype;

        const designsVanAanvraag = designs
          .filter((design) => design.aanvraag_id === aanvraag.id)
          .sort((a, b) => b.versienummer - a.versienummer);
        const feedbackVanAanvraag = feedback.find((item) => item.aanvraag_id === aanvraag.id);
        const geblokkeerdeCheck = checks.find((check) => check.aanvraag_id === aanvraag.id && check.geblokkeerd);

        return {
          aanvraagId: aanvraag.id,
          klantNaam: klant?.naam ?? "Onbekende klant",
          bedrijf: klant?.bedrijf ?? null,
          provincie: klant?.provincie ?? "—",
          veldtype: `${veldtypeLabel} (${aanvraag.afmeting})`,
          statusWaarde: aanvraag.status,
          voorstelGeplandOp: new Date(aanvraag.voorstel_gepland_op).toLocaleString("nl-NL"),
          laatsteDesign: designsVanAanvraag[0]
            ? {
                versienummer: designsVanAanvraag[0].versienummer,
                status: designsVanAanvraag[0].status,
                opslaglocatie: designsVanAanvraag[0].opslaglocatie,
              }
            : null,
          laatsteFeedback: feedbackVanAanvraag
            ? { goedgekeurd: feedbackVanAanvraag.goedgekeurd, feedbacktekst: feedbackVanAanvraag.feedbacktekst }
            : null,
          geblokkeerdeCheck: geblokkeerdeCheck
            ? { probleem: geblokkeerdeCheck.probleem, toelichting: geblokkeerdeCheck.toelichting }
            : null,
        };
      });
  } catch (error) {
    foutmelding = error instanceof Error ? error.message : "Onbekende fout bij het ophalen van concepten.";
  }

  const statusTellingen = CONCEPT_STATUSSEN.reduce(
    (tellingen, status) => {
      tellingen[status] = kaarten.filter((kaart) => kaart.statusWaarde === status).length;
      return tellingen;
    },
    {} as Record<AanvraagStatus, number>
  );

  const zichtbareKaarten = kaarten.filter((kaart) => kaart.statusWaarde === actieveStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Concepten</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Hier zie je de voorstellen die de AI automatisch gegenereerd en gemaild heeft, en hoe de
          klant erop gereageerd heeft. Eenmaal goedgekeurd gaat een aanvraag naar de productieflow
          op{" "}
          <a href="/intern" className="font-medium text-brand-groen hover:underline">
            Aanvragen
          </a>
          .
        </p>
      </div>

      {toontVoorbeelddata && (
        <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Je ziet nu voorbeelddata — er is nog geen Supabase-project gekoppeld (zie .env.example).
          Dit zijn geen echte concepten.
        </p>
      )}

      <VerwerkGeplandeVoorstellenKnop />

      {foutmelding && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {foutmelding}
        </p>
      )}

      {!foutmelding && (
        <>
          <div className="flex flex-wrap gap-2">
            {CONCEPT_STATUSSEN.map((status) => (
              <a
                key={status}
                href={`/intern/concepten?status=${status}`}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  status === actieveStatus
                    ? "border-brand-groen bg-brand-groen/10 font-medium text-brand-groen"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${AANVRAAG_STATUS_KLEUREN[status].split(" ")[0]}`} />
                {AANVRAAG_STATUS_LABELS[status]}
                <span className="text-neutral-400">({statusTellingen[status]})</span>
              </a>
            ))}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${AANVRAAG_STATUS_KLEUREN[actieveStatus].split(" ")[0]}`} />
              <h2 className="font-semibold text-brand-zwart">{AANVRAAG_STATUS_LABELS[actieveStatus]}</h2>
              <span className="text-sm text-neutral-400">({zichtbareKaarten.length})</span>
            </div>

            {zichtbareKaarten.length === 0 && (
              <p className="rounded-lg border border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-400">
                Geen concepten in deze status.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {zichtbareKaarten.map((kaart) => (
                <div key={kaart.aanvraagId} className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-brand-zwart">{kaart.klantNaam}</p>
                    {kaart.bedrijf && <p className="truncate text-xs text-neutral-500">{kaart.bedrijf}</p>}
                  </div>

                  <p className="mt-2 text-xs text-neutral-600">{kaart.veldtype}</p>
                  <p className="text-xs text-neutral-500">{kaart.provincie}</p>

                  {kaart.laatsteDesign && (
                    <div className="mt-2 flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- extern/placeholder pad */}
                      <img
                        src={kaart.laatsteDesign.opslaglocatie}
                        alt={`Ontwerp versie ${kaart.laatsteDesign.versienummer}`}
                        className="h-10 w-16 shrink-0 rounded border border-neutral-200 object-cover"
                      />
                      <span className="text-xs text-neutral-500">
                        Concept v{kaart.laatsteDesign.versienummer} — {kaart.laatsteDesign.status}
                      </span>
                    </div>
                  )}

                  {kaart.laatsteFeedback && (
                    <p
                      className={`mt-2 text-xs ${
                        kaart.laatsteFeedback.goedgekeurd ? "text-brand-groen" : "text-brand-oranje"
                      }`}
                    >
                      Klant: {kaart.laatsteFeedback.goedgekeurd ? "Goedgekeurd" : "Afgewezen"}
                      {kaart.laatsteFeedback.feedbacktekst && ` — ${kaart.laatsteFeedback.feedbacktekst}`}
                    </p>
                  )}

                  {kaart.geblokkeerdeCheck && (
                    <p className="mt-2 text-xs text-brand-oranje">
                      Te controleren: {kaart.geblokkeerdeCheck.probleem}
                      {kaart.geblokkeerdeCheck.toelichting && ` — ${kaart.geblokkeerdeCheck.toelichting}`}
                    </p>
                  )}

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400">Voorstel: {kaart.voorstelGeplandOp}</span>
                    <a
                      href={`/intern/${kaart.aanvraagId}`}
                      className="text-xs font-medium text-brand-groen hover:underline"
                    >
                      Bekijken →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
