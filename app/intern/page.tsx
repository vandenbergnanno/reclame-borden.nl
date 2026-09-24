import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AANVRAAG_STATUS_LABELS, PRODUCTTYPE_LABELS, VELDTYPE_LABELS } from "@/lib/types/domain";

export const metadata: Metadata = {
  title: "Intern overzicht — Mediagraaf Conceptor",
};

// Zonder dit rendert Next.js deze pagina als statische HTML tijdens `next build` (met de
// Supabase-data van dat moment bevroren) in plaats van de aanvragen bij elk bezoek opnieuw op
// te halen — dat is niet wat je wilt voor een pagina die live aanvraagstatussen toont.
export const dynamic = "force-dynamic";

// Server component: haalt aanvragen, klanten en contentchecks apart op en koppelt ze in JS.
// Dat houdt de Supabase-typing eenvoudig, zolang lib/types/database.ts nog handgeschreven is
// (nog geen relaties/embeds zoals de door de CLI gegenereerde types die kennen).
export default async function InternPage() {
  let foutmelding: string | null = null;
  let rijen: {
    aanvraagId: string;
    klantNaam: string;
    bedrijf: string | null;
    product: string;
    status: string;
    ingediendOp: string;
    heeftGeblokkeerdeCheck: boolean;
  }[] = [];

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

    rijen = (aanvragen ?? []).map((aanvraag) => {
      const klant = klantenById.get(aanvraag.klant_id);
      const productLabel = PRODUCTTYPE_LABELS[aanvraag.producttype] ?? aanvraag.producttype;
      const detail = aanvraag.veldtype
        ? VELDTYPE_LABELS[aanvraag.veldtype] ?? aanvraag.veldtype
        : aanvraag.afmeting;

      return {
        aanvraagId: aanvraag.id,
        klantNaam: klant?.naam ?? "Onbekende klant",
        bedrijf: klant?.bedrijf ?? null,
        product: detail ? `${productLabel} — ${detail}` : productLabel,
        status: AANVRAAG_STATUS_LABELS[aanvraag.status] ?? aanvraag.status,
        ingediendOp: new Date(aanvraag.created_at).toLocaleString("nl-NL"),
        heeftGeblokkeerdeCheck: geblokkeerdeAanvraagIds.has(aanvraag.id),
      };
    });
  } catch (error) {
    foutmelding = error instanceof Error ? error.message : "Onbekende fout bij het ophalen van aanvragen.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Intern overzicht</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Alle ingediende aanvragen, met hun huidige status. Nog zonder login/rechtenbeheer — dat
          volgt in een latere fase.
        </p>
      </div>

      {foutmelding && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {foutmelding}
        </p>
      )}

      {!foutmelding && rijen.length === 0 && (
        <p className="text-sm text-neutral-600">Er zijn nog geen aanvragen ingediend.</p>
      )}

      {!foutmelding && rijen.length > 0 && (
        <div className="overflow-x-auto rounded border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-brand-zwart">
              <tr>
                <th className="px-4 py-2 font-semibold">Klant</th>
                <th className="px-4 py-2 font-semibold">Bedrijf</th>
                <th className="px-4 py-2 font-semibold">Product</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Ingediend op</th>
                <th className="px-4 py-2 font-semibold">Contentcheck</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((rij) => (
                <tr key={rij.aanvraagId} className="border-t border-neutral-200">
                  <td className="px-4 py-2">{rij.klantNaam}</td>
                  <td className="px-4 py-2">{rij.bedrijf ?? "—"}</td>
                  <td className="px-4 py-2">{rij.product}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-brand-zwart">
                      {rij.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{rij.ingediendOp}</td>
                  <td className="px-4 py-2">
                    {rij.heeftGeblokkeerdeCheck ? (
                      <span className="rounded-full bg-brand-oranje/10 px-2 py-0.5 text-xs font-medium text-brand-oranje">
                        Geblokkeerd probleem
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
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
