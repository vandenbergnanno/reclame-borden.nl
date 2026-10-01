import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  AANVRAAG_STATUS_KLEUREN,
  AANVRAAG_STATUS_LABELS,
  AANVRAAG_STATUSSEN,
  BORD_AANSCHAF_LABELS,
  VELDTYPE_LABELS,
  type AanvraagStatus,
} from "@/lib/types/domain";
import { VerwerkGeplandeVoorstellenKnop } from "./VerwerkGeplandeVoorstellenKnop";
import { StatusActieKnop } from "./StatusActieKnop";

export const metadata: Metadata = {
  title: "Intern overzicht — Mediagraaf Conceptor",
};

// Zonder dit rendert Next.js deze pagina als statische HTML tijdens `next build` (met de
// Supabase-data van dat moment bevroren) in plaats van de aanvragen bij elk bezoek opnieuw op
// te halen — dat is niet wat je wilt voor een pagina die live aanvraagstatussen toont.
export const dynamic = "force-dynamic";

interface AanvraagKaart {
  aanvraagId: string;
  klantNaam: string;
  bedrijf: string | null;
  provincie: string;
  veldtype: string;
  bordAanschaf: string;
  nieuwBord: boolean;
  statusWaarde: AanvraagStatus;
  ingediendOp: string;
  heeftGeblokkeerdeCheck: boolean;
}

// Server component: haalt aanvragen, klanten en contentchecks apart op en koppelt ze in JS.
// Dat houdt de Supabase-typing eenvoudig, zolang lib/types/database.ts nog handgeschreven is
// (nog geen relaties/embeds zoals de door de CLI gegenereerde types die kennen).
export default async function InternPage({ searchParams }: { searchParams: { klant?: string } }) {
  const klantFilter = searchParams.klant;

  let foutmelding: string | null = null;
  let kaarten: AanvraagKaart[] = [];
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

    if (klantFilter) {
      klantNaamFilter = klantenById.get(klantFilter)?.naam ?? "onbekende klant";
    }

    const gefilterd = (aanvragen ?? []).filter((aanvraag) => {
      if (klantFilter && aanvraag.klant_id !== klantFilter) return false;
      return true;
    });

    kaarten = gefilterd.map((aanvraag) => {
      const klant = klantenById.get(aanvraag.klant_id);
      const veldtypeLabel = VELDTYPE_LABELS[aanvraag.veldtype] ?? aanvraag.veldtype;

      return {
        aanvraagId: aanvraag.id,
        klantNaam: klant?.naam ?? "Onbekende klant",
        bedrijf: klant?.bedrijf ?? null,
        provincie: klant?.provincie ?? "—",
        veldtype: `${veldtypeLabel} (${aanvraag.afmeting})`,
        bordAanschaf: BORD_AANSCHAF_LABELS[aanvraag.bord_aanschaf] ?? aanvraag.bord_aanschaf,
        nieuwBord: aanvraag.bord_aanschaf === "nieuw",
        statusWaarde: aanvraag.status,
        ingediendOp: new Date(aanvraag.created_at).toLocaleString("nl-NL"),
        heeftGeblokkeerdeCheck: geblokkeerdeAanvraagIds.has(aanvraag.id),
      };
    });
  } catch (error) {
    foutmelding = error instanceof Error ? error.message : "Onbekende fout bij het ophalen van aanvragen.";
  }

  // Kolommen vakje-voor-vakje vullen. Alles start bij "Nieuw"; bij "Gemaakt" sorteren we op
  // provincie (handig om bijv. bezorgroutes per regio te plannen) in plaats van op datum.
  const kolommen = AANVRAAG_STATUSSEN.map((status) => {
    const kaartenInKolom = kaarten.filter((kaart) => kaart.statusWaarde === status);
    if (status === "gemaakt") {
      kaartenInKolom.sort((a, b) => a.provincie.localeCompare(b.provincie, "nl"));
    }
    return { status, kaarten: kaartenInKolom };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Aanvragen</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Alles start bij &ldquo;Nieuw&rdquo; — gebruik het pijltje op een kaart om &rsquo;m een stap verder
          te zetten.
        </p>
      </div>

      {klantNaamFilter && (
        <p className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          Aanvragen van <span className="font-medium">{klantNaamFilter}</span>.{" "}
          <a href="/intern" className="font-medium text-brand-groen hover:underline">
            Toon alle aanvragen
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

      {!foutmelding && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {kolommen.map(({ status, kaarten: kaartenInKolom }) => (
            <div key={status} className="w-72 shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${AANVRAAG_STATUS_KLEUREN[status].split(" ")[0]}`} />
                <h2 className="font-semibold text-brand-zwart">{AANVRAAG_STATUS_LABELS[status]}</h2>
                <span className="text-sm text-neutral-400">({kaartenInKolom.length})</span>
              </div>

              <div className="space-y-3">
                {kaartenInKolom.length === 0 && (
                  <p className="rounded-lg border border-dashed border-neutral-200 p-3 text-center text-xs text-neutral-400">
                    Geen aanvragen
                  </p>
                )}

                {kaartenInKolom.map((kaart) => (
                  <div key={kaart.aanvraagId} className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-brand-zwart">{kaart.klantNaam}</p>
                        {kaart.bedrijf && <p className="truncate text-xs text-neutral-500">{kaart.bedrijf}</p>}
                      </div>
                      <StatusActieKnop
                        aanvraagId={kaart.aanvraagId}
                        klantNaam={kaart.klantNaam}
                        huidigeStatus={kaart.statusWaarde}
                      />
                    </div>

                    <p className="mt-2 text-xs text-neutral-600">{kaart.veldtype}</p>
                    <p className="text-xs text-neutral-500">{kaart.provincie}</p>

                    <div className="mt-2 flex flex-wrap gap-1">
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
          ))}
        </div>
      )}
    </div>
  );
}
