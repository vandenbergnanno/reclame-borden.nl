import type { Metadata } from "next";
import { createServerSupabaseClient, isSupabaseGeconfigureerd } from "@/lib/supabase/server";
import { VOORBEELD_AANVRAGEN, VOORBEELD_KLANTEN } from "@/lib/demo/voorbeelddata";
import { AFGEROND_STATUSSEN, CONCEPT_STATUSSEN, PRODUCTIE_STATUSSEN } from "@/lib/types/domain";
import { KlantenTabel } from "./KlantenTabel";

export const metadata: Metadata = {
  title: "Klanten — reclame-borden.nl Conceptor",
};

// Zelfde reden als bij /intern: live data, dus niet statisch prerenderen.
export const dynamic = "force-dynamic";

export default async function KlantenPage() {
  let foutmelding: string | null = null;
  let rijen: {
    klantId: string;
    naam: string;
    bedrijf: string | null;
    email: string;
    telefoon: string | null;
    provincie: string | null;
    aantalAanvragen: number;
    aantalOpen: number;
    heeftProductieItems: boolean;
    heeftConceptItems: boolean;
  }[] = [];

  const toontVoorbeelddata = !isSupabaseGeconfigureerd();

  try {
    let klanten: typeof VOORBEELD_KLANTEN;
    let aanvragen: Pick<(typeof VOORBEELD_AANVRAGEN)[number], "klant_id" | "status">[];

    if (toontVoorbeelddata) {
      klanten = [...VOORBEELD_KLANTEN].sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
      aanvragen = VOORBEELD_AANVRAGEN;
    } else {
      const supabase = createServerSupabaseClient();

      const [{ data: klantenData, error: klantenFout }, { data: aanvragenData, error: aanvragenFout }] = await Promise.all([
        supabase.from("klanten").select("*").order("naam", { ascending: true }),
        supabase.from("aanvragen").select("klant_id, status"),
      ]);

      if (klantenFout) throw new Error(klantenFout.message);
      if (aanvragenFout) throw new Error(aanvragenFout.message);

      klanten = klantenData ?? [];
      aanvragen = aanvragenData ?? [];
    }

    rijen = klanten.map((klant) => {
      const aanvragenVanKlant = aanvragen.filter((aanvraag) => aanvraag.klant_id === klant.id);
      return {
        klantId: klant.id,
        naam: klant.naam,
        bedrijf: klant.bedrijf,
        email: klant.email,
        telefoon: klant.telefoon,
        provincie: klant.provincie,
        aantalAanvragen: aanvragenVanKlant.length,
        aantalOpen: aanvragenVanKlant.filter((aanvraag) => !AFGEROND_STATUSSEN.includes(aanvraag.status)).length,
        heeftProductieItems: aanvragenVanKlant.some((aanvraag) =>
          (PRODUCTIE_STATUSSEN as readonly string[]).includes(aanvraag.status)
        ),
        heeftConceptItems: aanvragenVanKlant.some((aanvraag) =>
          (CONCEPT_STATUSSEN as readonly string[]).includes(aanvraag.status)
        ),
      };
    });
  } catch (error) {
    foutmelding = error instanceof Error ? error.message : "Onbekende fout bij het ophalen van klanten.";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-zwart">Klanten</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Alle klanten die een aanvraag hebben ingediend.
          </p>
        </div>
        {!foutmelding && (
          <div className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm shadow-sm">
            <span className="font-semibold text-brand-zwart">{rijen.length}</span>{" "}
            <span className="text-neutral-500">{rijen.length === 1 ? "klant" : "klanten"}</span>
          </div>
        )}
      </div>

      {toontVoorbeelddata && (
        <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Je ziet nu voorbeelddata — er is nog geen Supabase-project gekoppeld (zie .env.example).
          Dit zijn geen echte klanten.
        </p>
      )}

      {foutmelding && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {foutmelding}
        </p>
      )}

      {!foutmelding && rijen.length === 0 && (
        <p className="text-sm text-neutral-600">Er zijn nog geen klanten.</p>
      )}

      {!foutmelding && rijen.length > 0 && <KlantenTabel rijen={rijen} />}
    </div>
  );
}
