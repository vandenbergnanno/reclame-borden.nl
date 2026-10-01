import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateDesign } from "@/lib/ai/generateDesign";
import { sendProposalEmail } from "@/lib/email/sendProposalEmail";

export const runtime = "nodejs";

// Publieke route (geen /intern-login nodig) — de klant bereikt dit via de link in de
// voorstel-e-mail, niet via een ingelogde sessie.
//
// Geen aparte "goedgekeurd"/"afgewezen"-status meer (zie lib/types/domain.ts): bij goedkeuring
// gaat de aanvraag direct door naar "nieuw" (de productieflow op /intern), bij afwijzing
// genereert en verstuurt de AI automatisch een herzien concept terwijl de aanvraag gewoon
// "voorstel_verstuurd" blijft. De klantreactie zelf blijft bewaard als rij in `feedback`.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  let body: { actie?: unknown; feedbacktekst?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  if (body.actie !== "goedkeuren" && body.actie !== "feedback") {
    return NextResponse.json({ ok: false, error: "Ongeldige actie." }, { status: 400 });
  }

  const goedgekeurd = body.actie === "goedkeuren";

  if (!goedgekeurd && (typeof body.feedbacktekst !== "string" || body.feedbacktekst.trim() === "")) {
    return NextResponse.json({ ok: false, error: "Beschrijf wat er nog moet veranderen." }, { status: 400 });
  }

  let supabase: ReturnType<typeof createServerSupabaseClient>;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Supabase is niet geconfigureerd." },
      { status: 500 }
    );
  }

  const { data: aanvraag, error: aanvraagFout } = await supabase
    .from("aanvragen")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (aanvraagFout) {
    return NextResponse.json({ ok: false, error: aanvraagFout.message }, { status: 500 });
  }
  if (!aanvraag) {
    return NextResponse.json({ ok: false, error: "Aanvraag niet gevonden." }, { status: 404 });
  }
  if (aanvraag.status !== "voorstel_verstuurd") {
    return NextResponse.json(
      { ok: false, error: "Er is al eerder gereageerd op dit voorstel, of het voorstel is nog niet verstuurd." },
      { status: 409 }
    );
  }

  const feedbacktekst = typeof body.feedbacktekst === "string" && body.feedbacktekst.trim() !== "" ? body.feedbacktekst.trim() : null;

  const { error: feedbackFout } = await supabase.from("feedback").insert({
    aanvraag_id: aanvraag.id,
    goedgekeurd,
    feedbacktekst,
  });

  if (feedbackFout) {
    return NextResponse.json({ ok: false, error: feedbackFout.message }, { status: 500 });
  }

  const { data: laatsteDesign } = await supabase
    .from("designs")
    .select("*")
    .eq("aanvraag_id", aanvraag.id)
    .order("versienummer", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (goedgekeurd) {
    if (laatsteDesign) {
      await supabase.from("designs").update({ status: "definitief" }).eq("id", laatsteDesign.id);
    }

    const { error: statusFout } = await supabase.from("aanvragen").update({ status: "nieuw" }).eq("id", aanvraag.id);
    if (statusFout) {
      return NextResponse.json({ ok: false, error: statusFout.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  // Afgewezen: de aanvraag blijft "voorstel_verstuurd" — in plaats van te wachten tot een
  // medewerker het oppakt, genereert en verstuurt de AI meteen een herzien concept. Eén mislukte
  // stap hier (bijv. generateDesign() die nog niet echt geïmplementeerd is) mag de feedback van de
  // klant zelf niet blokkeren; die is al opgeslagen.
  try {
    if (laatsteDesign) {
      await supabase.from("designs").update({ status: "vervangen" }).eq("id", laatsteDesign.id);
    }

    const { data: klant } = await supabase
      .from("klanten")
      .select("naam, email")
      .eq("id", aanvraag.klant_id)
      .maybeSingle();

    const nieuweVersie = (laatsteDesign?.versienummer ?? 0) + 1;
    const design = await generateDesign({
      aanvraagId: aanvraag.id,
      veldtype: aanvraag.veldtype,
      wens: aanvraag.wens,
    });

    await supabase.from("designs").insert({
      aanvraag_id: aanvraag.id,
      versienummer: nieuweVersie,
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
        isHerzien: true,
      });
    }
  } catch (error) {
    console.error(`[feedback] Herzien concept genereren/mailen mislukt voor aanvraag ${aanvraag.id}:`, error);
  }

  return NextResponse.json({ ok: true });
}
