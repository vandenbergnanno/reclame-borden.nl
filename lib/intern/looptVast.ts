import { createServerSupabaseClient, isSupabaseGeconfigureerd } from "@/lib/supabase/server";
import { VOORBEELD_AANVRAGEN, VOORBEELD_FEEDBACK } from "@/lib/demo/voorbeelddata";
import { CONCEPT_STATUSSEN, LOOPT_VAST_VANAF } from "@/lib/types/domain";

// Losse, lichte telling (geen volledige kaartdata zoals /intern/concepten zelf opbouwt) puur voor
// het badge-cijfer in de navigatie — zodat een medewerker ziet dat er iets vastloopt zonder er
// expliciet voor naar Concepten te moeten klikken.
export async function telLooptVastAanvragen(): Promise<number> {
  try {
    let aanvragen: Pick<(typeof VOORBEELD_AANVRAGEN)[number], "id" | "status">[];
    let feedback: Pick<(typeof VOORBEELD_FEEDBACK)[number], "aanvraag_id" | "goedgekeurd">[];

    if (!isSupabaseGeconfigureerd()) {
      aanvragen = VOORBEELD_AANVRAGEN;
      feedback = VOORBEELD_FEEDBACK;
    } else {
      const supabase = createServerSupabaseClient();
      const [{ data: aanvragenData }, { data: feedbackData }] = await Promise.all([
        supabase.from("aanvragen").select("id, status"),
        supabase.from("feedback").select("aanvraag_id, goedgekeurd"),
      ]);
      aanvragen = aanvragenData ?? [];
      feedback = feedbackData ?? [];
    }

    const conceptIds = new Set(
      aanvragen.filter((item) => (CONCEPT_STATUSSEN as readonly string[]).includes(item.status)).map((item) => item.id)
    );

    const afwijzingenPerAanvraag = new Map<string, number>();
    for (const item of feedback) {
      if (!item.goedgekeurd && conceptIds.has(item.aanvraag_id)) {
        afwijzingenPerAanvraag.set(item.aanvraag_id, (afwijzingenPerAanvraag.get(item.aanvraag_id) ?? 0) + 1);
      }
    }

    return [...afwijzingenPerAanvraag.values()].filter((aantal) => aantal >= LOOPT_VAST_VANAF).length;
  } catch {
    // Puur een tellertje voor de navigatie — als het ophalen faalt, laten we 'm gewoon op 0 staan
    // i.p.v. de hele /intern-navigatie te laten crashen.
    return 0;
  }
}
