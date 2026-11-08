import type { Metadata } from "next";
import { createServerSupabaseClient, isSupabaseGeconfigureerd } from "@/lib/supabase/server";
import {
  VOORBEELD_AANVRAGEN,
  VOORBEELD_CONTENT_CHECKS,
  VOORBEELD_DESIGNS,
  VOORBEELD_FEEDBACK,
  VOORBEELD_KLANTEN,
} from "@/lib/demo/voorbeelddata";
import { CONCEPT_STATUSSEN, LOOPT_VAST_VANAF, VELDTYPE_LABELS } from "@/lib/types/domain";
import { VerwerkGeplandeVoorstellenKnop } from "../VerwerkGeplandeVoorstellenKnop";
import { LiveVerversen } from "../LiveVerversen";

export const metadata: Metadata = {
  title: "Concepten — reclame-borden.nl Conceptor",
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
  aantalAfwijzingen: number;
  // Aantal dagen sinds het laatste concept gemaild is, zolang de klant daar nog niet op
  // gereageerd heeft — null zodra de klant wél al gereageerd heeft (dan wacht er niemand meer).
  wachtDagen: number | null;
}

function berekenWachtDagen(tijdlijn: TijdlijnItem[]): number | null {
  if (tijdlijn.length === 0) return null;
  const laatsteItem = tijdlijn[tijdlijn.length - 1];
  if (laatsteItem.soort !== "concept") return null;
  const msPerDag = 1000 * 60 * 60 * 24;
  const verstreken = Date.now() - new Date(laatsteItem.opSorteerwaarde).getTime();
  return Math.max(0, Math.floor(verstreken / msPerDag));
}

// Toont de klant-mailflow: welke voorstellen de AI gegenereerd en gemaild heeft, en hoe de klant
// daarop gereageerd heeft (inclusief een eventuele afwijzing-en-herziening-heen-en-weer). Dit is
// bewust gescheiden van /intern (de fysieke productieflow van al goedgekeurde borden) — zie
// PRODUCTIE_STATUSSEN/CONCEPT_STATUSSEN in lib/types/domain.ts.
export default async function ConceptenPage({
  searchParams,
}: {
  searchParams: { klant?: string };
}) {
  const klantFilter = searchParams.klant;
  let foutmelding: string | null = null;
  let kaarten: ConceptKaart[] = [];
  let klantNaamFilter: string | null = null;
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

    if (klantFilter) {
      klantNaamFilter = klantenById.get(klantFilter)?.naam ?? "Onbekende klant";
    }

    kaarten = aanvragen
      .filter((aanvraag) => (CONCEPT_STATUSSEN as readonly string[]).includes(aanvraag.status))
      .filter((aanvraag) => !klantFilter || aanvraag.klant_id === klantFilter)
      .map((aanvraag) => {
        const klant = klantenById.get(aanvraag.klant_id);
        // Deze pagina toont alleen CONCEPT_STATUSSEN ("voorstel_verstuurd"), een status die
        // ontwerptool-aanvragen nooit bereiken — veldtype is hier in de praktijk dus altijd gezet.
        const veldtypeLabel = aanvraag.veldtype ? VELDTYPE_LABELS[aanvraag.veldtype] ?? aanvraag.veldtype : "Reclamebord";

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

        const feedbackVanAanvraag = feedback.filter((item) => item.aanvraag_id === aanvraag.id);
        const feedbackItems: TijdlijnItem[] = [...feedbackVanAanvraag]
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
        const aantalAfwijzingen = feedbackVanAanvraag.filter((item) => !item.goedgekeurd).length;

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
          aantalAfwijzingen,
          wachtDagen: berekenWachtDagen(tijdlijn),
        };
      });
  } catch (error) {
    foutmelding = error instanceof Error ? error.message : "Onbekende fout bij het ophalen van concepten.";
  }

  const vastgelopenKaarten = kaarten.filter((kaart) => kaart.aantalAfwijzingen >= LOOPT_VAST_VANAF);
  const openstaandeKaarten = kaarten.filter((kaart) => kaart.aantalAfwijzingen < LOOPT_VAST_VANAF);

  return (
    <div className="space-y-6">
      <LiveVerversen />
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Concepten</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Hier zie je welke voorstellen de AI automatisch gegenereerd en gemaild heeft, en hoe de
          klant erop gereageerd heeft. Bij goedkeuring gaat een aanvraag direct door naar &ldquo;Nieuw&rdquo;
          op{" "}
          <a href="/intern" className="font-medium text-brand-groen-donker hover:underline">
            Aanvragen
          </a>
          ; bij afwijzing stuurt de AI automatisch een herzien concept terug.
        </p>
      </div>

      {klantNaamFilter && (
        <p className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          Concepten van <span className="font-medium">{klantNaamFilter}</span>.{" "}
          <a href="/intern/concepten" className="font-medium text-brand-groen-donker hover:underline">
            Toon alle concepten
          </a>
          .
        </p>
      )}

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
          {vastgelopenKaarten.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <h2 className="font-semibold text-brand-zwart">Loopt vast</h2>
                <span className="text-sm text-neutral-400">({vastgelopenKaarten.length})</span>
              </div>
              <p className="mb-3 text-sm text-neutral-600">
                De klant heeft hier al {LOOPT_VAST_VANAF}+ keer op afgewezen — de AI komt er zelf
                niet uit. Neem persoonlijk contact op.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {vastgelopenKaarten.map((kaart) => (
                  <ConceptKaartWeergave key={kaart.aanvraagId} kaart={kaart} nadruk />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
              <h2 className="font-semibold text-brand-zwart">Voorstel verstuurd</h2>
              <span className="text-sm text-neutral-400">({openstaandeKaarten.length})</span>
            </div>

            {kaarten.length === 0 && (
              <p className="rounded-lg border border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-400">
                Geen open concepten — alles is al goedgekeurd of nog niet verstuurd.
              </p>
            )}

            {kaarten.length > 0 && openstaandeKaarten.length === 0 && (
              <p className="rounded-lg border border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-400">
                Alle openstaande concepten staan hierboven bij &ldquo;Loopt vast&rdquo;.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {openstaandeKaarten.map((kaart) => (
                <ConceptKaartWeergave key={kaart.aanvraagId} kaart={kaart} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ConceptKaartWeergave({ kaart, nadruk = false }: { kaart: ConceptKaart; nadruk?: boolean }) {
  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        nadruk ? "border-red-200" : "border-neutral-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-brand-zwart">{kaart.klantNaam}</p>
          {kaart.bedrijf && <p className="truncate text-xs text-neutral-500">{kaart.bedrijf}</p>}
          <p className="mt-1 text-xs text-neutral-600">{kaart.veldtype}</p>
          <p className="text-xs text-neutral-500">{kaart.provincie}</p>
        </div>
        <a
          href={`/intern/${kaart.aanvraagId}`}
          className="shrink-0 text-xs font-medium text-brand-groen-donker hover:underline"
        >
          Bekijken →
        </a>
      </div>

      {nadruk && (
        <p className="mt-2 text-xs font-medium text-red-700">
          {kaart.aantalAfwijzingen}x afgewezen
        </p>
      )}

      {kaart.wachtDagen !== null && kaart.wachtDagen >= 1 && (
        <p className={`mt-2 text-xs font-medium ${kaart.wachtDagen >= 3 ? "text-red-700" : "text-brand-oranje-donker"}`}>
          Wacht al {kaart.wachtDagen} {kaart.wachtDagen === 1 ? "dag" : "dagen"} op reactie
        </p>
      )}

      {kaart.geblokkeerdeCheck && (
        <p className="mt-2 text-xs text-brand-oranje-donker">
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
  );
}
