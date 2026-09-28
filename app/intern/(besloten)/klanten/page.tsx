import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Klanten — Mediagraaf Conceptor",
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
    aantalAanvragen: number;
    aantalOpen: number;
  }[] = [];

  try {
    const supabase = createServerSupabaseClient();

    const [{ data: klanten, error: klantenFout }, { data: aanvragen, error: aanvragenFout }] = await Promise.all([
      supabase.from("klanten").select("*").order("naam", { ascending: true }),
      supabase.from("aanvragen").select("klant_id, status"),
    ]);

    if (klantenFout) throw new Error(klantenFout.message);
    if (aanvragenFout) throw new Error(aanvragenFout.message);

    rijen = (klanten ?? []).map((klant) => {
      const aanvragenVanKlant = (aanvragen ?? []).filter((aanvraag) => aanvraag.klant_id === klant.id);
      return {
        klantId: klant.id,
        naam: klant.naam,
        bedrijf: klant.bedrijf,
        email: klant.email,
        telefoon: klant.telefoon,
        aantalAanvragen: aanvragenVanKlant.length,
        aantalOpen: aanvragenVanKlant.filter(
          (aanvraag) => aanvraag.status !== "goedgekeurd" && aanvraag.status !== "afgewezen"
        ).length,
      };
    });
  } catch (error) {
    foutmelding = error instanceof Error ? error.message : "Onbekende fout bij het ophalen van klanten.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Klanten</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Alle klanten die een aanvraag hebben ingediend.
        </p>
      </div>

      {foutmelding && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {foutmelding}
        </p>
      )}

      {!foutmelding && rijen.length === 0 && (
        <p className="text-sm text-neutral-600">Er zijn nog geen klanten.</p>
      )}

      {!foutmelding && rijen.length > 0 && (
        <div className="overflow-x-auto rounded border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-brand-zwart">
              <tr>
                <th className="px-4 py-2 font-semibold">Naam</th>
                <th className="px-4 py-2 font-semibold">Bedrijf</th>
                <th className="px-4 py-2 font-semibold">E-mail</th>
                <th className="px-4 py-2 font-semibold">Telefoon</th>
                <th className="px-4 py-2 font-semibold">Aanvragen</th>
                <th className="px-4 py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((rij) => (
                <tr key={rij.klantId} className="border-t border-neutral-200">
                  <td className="px-4 py-2">{rij.naam}</td>
                  <td className="px-4 py-2">{rij.bedrijf ?? "—"}</td>
                  <td className="px-4 py-2">{rij.email}</td>
                  <td className="px-4 py-2">{rij.telefoon ?? "—"}</td>
                  <td className="px-4 py-2">
                    {rij.aantalAanvragen}
                    {rij.aantalOpen > 0 && (
                      <span className="ml-2 rounded-full bg-brand-oranje/10 px-2 py-0.5 text-xs font-medium text-brand-oranje">
                        {rij.aantalOpen} lopend
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={`/intern?klant=${rij.klantId}`}
                      className="font-medium text-brand-groen hover:underline"
                    >
                      Aanvragen bekijken →
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
