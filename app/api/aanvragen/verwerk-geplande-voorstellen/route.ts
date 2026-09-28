import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateDesign } from "@/lib/ai/generateDesign";
import { sendProposalEmail } from "@/lib/email/sendProposalEmail";

export const runtime = "nodejs";

// TODO: dit endpoint moet in productie periodiek (bijv. elke 5-10 minuten) aangeroepen worden
// door een echte scheduler (Vercel Cron / Supabase pg_cron), niet handmatig. Beveilig het dan
// ook met een secret (bijv. een `Authorization`-header die alleen de scheduler kent) — nu nog
// open, omdat er nog geen deployment is om een cron tegenaan te laten lopen.
//
// Verwerkt alle aanvragen waarvan het geplande voorstel-tijdstip (`voorstel_gepland_op`, bewust
// 45-60 min na indienen — zie lib/planning/voorstelPlanning.ts) inmiddels verstreken is: genereert
// een (placeholder) ontwerp, slaat dat op, en verstuurt de (placeholder) voorstel-e-mail.
export async function POST() {
  let supabase: ReturnType<typeof createServerSupabaseClient>;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Supabase is niet geconfigureerd." },
      { status: 500 }
    );
  }

  const { data: aanvragen, error: aanvragenFout } = await supabase
    .from("aanvragen")
    .select("*")
    .eq("status", "nieuw")
    .lte("voorstel_gepland_op", new Date().toISOString());

  if (aanvragenFout) {
    return NextResponse.json({ ok: false, error: aanvragenFout.message }, { status: 500 });
  }

  const verwerkt: string[] = [];
  const mislukt: { aanvraagId: string; fout: string }[] = [];

  for (const aanvraag of aanvragen ?? []) {
    try {
      const { data: klant } = await supabase
        .from("klanten")
        .select("naam, email")
        .eq("id", aanvraag.klant_id)
        .maybeSingle();

      const design = await generateDesign({
        aanvraagId: aanvraag.id,
        veldtype: aanvraag.veldtype,
        wens: aanvraag.wens,
      });

      await supabase.from("designs").insert({
        aanvraag_id: aanvraag.id,
        versienummer: 1,
        status: design.status,
        opslaglocatie: design.opslaglocatie,
      });

      if (klant?.email) {
        await sendProposalEmail({
          klantEmail: klant.email,
          klantNaam: klant.naam,
          aanvraagId: aanvraag.id,
          veldtype: aanvraag.veldtype,
          afmeting: aanvraag.afmeting,
          designUrl: design.opslaglocatie,
        });
      }

      await supabase.from("aanvragen").update({ status: "voorstel_verstuurd" }).eq("id", aanvraag.id);
      verwerkt.push(aanvraag.id);
    } catch (error) {
      // Eén mislukte aanvraag (bijv. generateDesign() die nog niet echt geïmplementeerd is)
      // mag de rest van de batch niet blokkeren.
      mislukt.push({ aanvraagId: aanvraag.id, fout: error instanceof Error ? error.message : "Onbekende fout." });
    }
  }

  return NextResponse.json({ ok: true, verwerkt: verwerkt.length, aanvraagIds: verwerkt, mislukt });
}
