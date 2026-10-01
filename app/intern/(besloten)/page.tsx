import type { Metadata } from "next";
import { createServerSupabaseClient, isSupabaseGeconfigureerd } from "@/lib/supabase/server";
import {
  VOORBEELD_AANVRAGEN,
  VOORBEELD_CONTENT_CHECKS,
  VOORBEELD_KLANTEN,
} from "@/lib/demo/voorbeelddata";
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

function isAanvraagStatus(waarde: string | undefined): waarde is AanvraagStatus {
  return typeof waarde === "string" && (AANVRAAG_STATUSSEN as readonly string[]).includes(waarde);
}

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
export default async function InternPage({
  searchParams,
}: {
  searchParams: { status?: string; klant?: string };
}) {
  // Standaard begin je bij "Nieuw" — vandaar komt immers elke aanvraag binnen.
  const actieveStatus: AanvraagStatus = isAanvraagStatus(searchParams.status) ? searchParams.status : "nieuw";
  const klantFilter = searchParams.klant;

  let foutmelding: string | null = null;
  let kaarten: AanvraagKaart[] = [];
  let klantNaamFilter: string | null = null;
  const toontVoorbeelddata = !isSupabaseGeconfigureerd();

  try {
    let aanvragen: typeof VOORBEELD_AANVRAGEN;
    let klanten: typeof VOORBEELD_KLANTEN;
    let checks: Pick<(typeof VOORBEELD_CONTENT_CHECKS)[number], "aanvraag_id" | "geblokkeerd">[];

    if (toontVoorbeelddata) {
      aanvragen = VOORBEELD_AANVRAGEN;
      klanten = VOORBEELD_KLANTEN;
      checks = VOORBEELD_CONTENT_CHECKS;
    } else {
      const supabase = createServerSupabaseClient();

      const [{ data: aanvragenData, error: aanvragenFout }, { data: klantenData, error: klantenFout }, { data: checksData, error: checksFout }] =
        await Promise.all([
          supabase.from("aanvragen").select("*").order("created_at", { ascending: false }),
          supabase.from("klanten").select("*"),
          supabase.from("content_checks").select("aanvraag_id, geblokkeerd"),
        ]);

      if (aanvragenFout) throw new Error(aanvragenFout.message);
      if (klantenFout) throw new Error(klantenFout.message);
      if (checksFout) throw new Error(checksFout.message);

      aanvragen = aanvragenData ?? [];
      klanten = klantenData ?? [];
      checks = checksData ?? [];
    }

    const klantenById = new Map(klanten.map((klant) => [klant.id, klant]));
    const geblokkeerdeAanvraagIds = new Set(
      checks.filter((check) => check.geblokkeerd).map((check) => check.aanvraag_id)
    );

    if (klantFilter) {
      klantNaamFilter = klantenById.get(klantFilter)?.naam ?? "onbekende klant";
    }

    const gefilterd = aanvragen.filter((aanvraag) => {
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

  const statusTellingen = AANVRAAG_STATUSSEN.reduce(
    (tellingen, status) => {
      tellingen[status] = kaarten.filter((kaart) => kaart.statusWaarde === status).length;
      return tellingen;
    },
    {} as Record<AanvraagStatus, number>
  );

  const zichtbareKaarten = kaarten.filter((kaart) => kaart.statusWaarde === actieveStatus);
  if (actieveStatus === "gemaakt") {
    zichtbareKaarten.sort((a, b) => a.provincie.localeCompare(b.provincie, "nl"));
  }

  const klantQuery = klantFilter ? `&klant=${klantFilter}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Aanvragen</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Klik op een vakje om de aanvragen in die status te zien. Alles start bij &ldquo;Nieuw&rdquo;.
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

      {toontVoorbeelddata && (
        <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Je ziet nu voorbeelddata — er is nog geen Supabase-project gekoppeld (zie .env.example).
          Dit zijn geen echte aanvragen.
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
            {AANVRAAG_STATUSSEN.map((status) => (
              <a
                key={status}
                href={`/intern?status=${status}${klantQuery}`}
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
                Geen aanvragen in deze status.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {zichtbareKaarten.map((kaart) => (
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
        </>
      )}
    </div>
  );
}
