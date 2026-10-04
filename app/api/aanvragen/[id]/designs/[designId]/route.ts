import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Beveiligd via middleware.ts (de gedeelde-wachtwoord-poort van /intern) — alleen ingelogde
// medewerkers kunnen hier bij.
//
// Een concept mag alleen aangepast worden zolang de bijbehorende e-mail nog niet écht verstuurd
// is (zie `emails.verzonden` — false zolang RESEND_API_KEY ontbreekt of Resend een fout gaf). Is
// 'm al wel verstuurd, dan is dit niet meer wat de klant onder ogen heeft gehad en zou aanpassen
// een vals beeld geven van wat er daadwerkelijk gemaild is.
export async function PATCH(request: Request, { params }: { params: { id: string; designId: string } }) {
  let body: { opslaglocatie?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  if (typeof body.opslaglocatie !== "string" || body.opslaglocatie.trim() === "") {
    return NextResponse.json({ ok: false, error: "Geef een geldige afbeeldingslocatie op." }, { status: 400 });
  }
  if (body.opslaglocatie.length > 2000) {
    return NextResponse.json({ ok: false, error: "Afbeeldingslocatie is te lang." }, { status: 400 });
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

  const { data: design, error: designFout } = await supabase
    .from("designs")
    .select("id, aanvraag_id")
    .eq("id", params.designId)
    .eq("aanvraag_id", params.id)
    .maybeSingle();

  if (designFout) {
    return NextResponse.json({ ok: false, error: designFout.message }, { status: 500 });
  }
  if (!design) {
    return NextResponse.json({ ok: false, error: "Concept niet gevonden." }, { status: 404 });
  }

  const { data: email, error: emailFout } = await supabase
    .from("emails")
    .select("verzonden")
    .eq("design_id", design.id)
    .maybeSingle();

  if (emailFout) {
    return NextResponse.json({ ok: false, error: emailFout.message }, { status: 500 });
  }
  if (email?.verzonden) {
    return NextResponse.json(
      { ok: false, error: "Dit concept is al verstuurd en kan niet meer aangepast worden." },
      { status: 409 }
    );
  }

  const { error: updateFout } = await supabase
    .from("designs")
    .update({ opslaglocatie: body.opslaglocatie.trim() })
    .eq("id", design.id);

  if (updateFout) {
    return NextResponse.json({ ok: false, error: updateFout.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
