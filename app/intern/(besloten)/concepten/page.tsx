import type { Metadata } from "next";
import { createServerSupabaseClient, isSupabaseGeconfigureerd } from "@/lib/supabase/server";
import {
  VOORBEELD_AANVRAGEN,
  VOORBEELD_CONTENT_CHECKS,
  VOORBEELD_DESIGNS,
  VOORBEELD_FEEDBACK,
  VOORBEELD_KLANTEN,
} from "@/lib/demo/voorbeelddata";
import { CONCEPT_STATUSSEN, VELDTYPE_LABELS } from "@/lib/types/domain";
import { VerwerkGeplandeVoorstellenKnop } from "../VerwerkGeplandeVoorstellenKnop";

export const metadata: Metadata = {
  title: "Concepten — Mediagraaf Conceptor",
};

// Zelfde reden als /intern: live data, dus niet statisch prerenderen.
export const dynamic = "force-dynamic";

interface TijdlijnItem {
  soort: "concept" | "klantreactie";
  op: string;
  opSorteerwaarde: string;
  omschrijving: string;
  details?: string;
  thumbnail?: string;
  kleur: string;
}

interface ConceptKaart {
  aanvraagId: string;
  klantNaam: string;
  bedrijf: string | null;
  provincie: string;
  veldtype: string;
  voorstelGeplandOp: string;
  tijdlijn: TijdlijnItem[];
  geblokkeerdeCheck: { probleem: string; toelichting: string | null } | null;
}

// Toont de klant-mailflow: welke voorstellen de AI gegenereerd en gemaild heeft, en hoe de klant
// daarop gereageerd heeft (inclusief een eventuele afwijzing-en-herziening-heen-en-weer). Dit is
// bewust gescheiden van /intern (de fysieke productieflow van al goedgekeurde borden) — zie
// PRODUCTIE_STATUSSEN/CONCEPT_STATUSSEN in lib/types/domain.ts.
export default async function ConceptenPage() {
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
        supabase.from("designs").select("*").order("versienummer", { ascending: true }),
        supabase.from("feedback").select("*").order("created_at", { ascending: true }),
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

        const designItems: TijdlijnItem[] = designs
          .filter((design) => design.aanvraag_id === aanvraag.id)
          .sort((a, b) => a.versienummer - b.versienummer)
          .map((design) => ({
            soort: "concept",
            op: new Date(design.created_at).toLocaleString("nl-NL"),
            opSorteerwaarde: design.created_at,
            omschrijving: `Concept v${design.versienummer} gegenereerd en gemaild`,
            details: design.status,
            thumbnail: design.opslaglocatie,
            kleur: "bg-purple-400",
          }));

        const feedbackItems: TijdlijnItem[] = feedback
          .filter((item) => item.aanvraag_id === aanvraag.id)
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((item) => ({
            soort: "klantreactie",
            op: new Date(item.created_at).toLocaleString("nl-NL"),
            opSorteerwaarde: item.created_at,
            omschrijving: item.goedgekeurd ? "Klant keurde het concept goed" : "Klant wees het concept af",
            details: item.feedbacktekst ?? undefined,
            kleur: item.goedgekeurd ? "bg-brand-groen" : "bg-brand-oranje",
          }));

        const tijdlijn = [...designItems, ...feedbackItems].sort((a, b) =>
          a.opSorteerwaarde.localeCompare(b.opSorteerwaarde)
        );

        const geblokkeerdeCheck = checks.find((check) => check.aanvraag_id === aanvraag.id && check.geblokkeerd);

        return {
          aanvraagId: aanvraag.id,
          klantNaam: klant?.naam ?? "Onbekende klant",
          bedrijf: klant?.bedrijf ?? null,
          provincie: klant?.provincie ?? "—",
          veldtype: `${veldtypeLabel} (${aanvraag.afmeting})`,
          voorstelGeplandOp: new Date(aanvraag.voorstel_gepland_op).toLocaleString("nl-NL"),
          tijdlijn,
          geblokkeerdeCheck: geblokkeerdeCheck
            ? { probleem: geblokkeerdeCheck.probleem, toelichting: geblokkeerdeCheck.toelichting }
            : null,
        };
      });
  } catch (error) {
    foutmelding = error instanceof Error ? error.message : "Onbekende fout bij het ophalen van concepten.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Concepten</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Hier zie je welke voorstellen de AI automatisch gegenereerd en gemaild heeft, en hoe de
          klant erop gereageerd heeft. Bij goedkeuring gaat een aanvraag direct door naar &ldquo;Nieuw&rdquo;
          op{" "}
          <a href="/intern" className="font-medium text-brand-groen hover:underline">
            Aanvragen
          </a>
          ; bij afwijzing stuurt de AI automatisch een herzien concept terug.
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
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
            <h2 className="font-semibold text-brand-zwart">Voorstel verstuurd</h2>
            <span className="text-sm text-neutral-400">({kaarten.length})</span>
          </div>

          {kaarten.length === 0 && (
            <p className="rounded-lg border border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-400">
              Geen open concepten — alles is al goedgekeurd of nog niet verstuurd.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {kaarten.map((kaart) => (
              <div key={kaart.aanvraagId} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-brand-zwart">{kaart.klantNaam}</p>
                    {kaart.bedrijf && <p className="truncate text-xs text-neutral-500">{kaart.bedrijf}</p>}
                    <p className="mt-1 text-xs text-neutral-600">{kaart.veldtype}</p>
                    <p className="text-xs text-neutral-500">{kaart.provincie}</p>
                  </div>
                  <a
                    href={`/intern/${kaart.aanvraagId}`}
                    className="shrink-0 text-xs font-medium text-brand-groen hover:underline"
                  >
                    Bekijken →
                  </a>
                </div>

                {kaart.geblokkeerdeCheck && (
                  <p className="mt-2 text-xs text-brand-oranje">
                    Te controleren: {kaart.geblokkeerdeCheck.probleem}
                    {kaart.geblokkeerdeCheck.toelichting && ` — ${kaart.geblokkeerdeCheck.toelichting}`}
                  </p>
                )}

                {kaart.tijdlijn.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
                    {kaart.tijdlijn.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs">
                        <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${item.kleur}`} />
                        <div className="min-w-0">
                          <p className="text-neutral-700">
                            {item.omschrijving}
                            {item.details && item.soort === "concept" && (
                              <span className="text-neutral-400"> ({item.details})</span>
                            )}
                          </p>
                          {item.details && item.soort === "klantreactie" && (
                            <p className="text-neutral-500">“{item.details}”</p>
                          )}
                          <p className="text-[10px] text-neutral-400">{item.op}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-3 text-[10px] text-neutral-400">Eerst gepland op: {kaart.voorstelGeplandOp}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
