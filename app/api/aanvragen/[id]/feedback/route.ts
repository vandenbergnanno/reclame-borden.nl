import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Publieke route (geen /intern-login nodig) — de klant bereikt dit via de link in de
// voorstel-e-mail, niet via een ingelogde sessie.
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
    .select("id, status")
    .eq("id", params.id)
    .maybeSingle();

  if (aanvraagFout) {
    return NextResponse.json({ ok: false, error: aanvraagFout.message }, { status: 500 });
  }
  if (!aanvraag) {
    return NextResponse.json({ ok: false, error: "Aanvraag niet gevonden." }, { status: 404 });
  }
  if (aanvraag.status === "goedgekeurd" || aanvraag.status === "afgewezen") {
    return NextResponse.json(
      { ok: false, error: "Er is al eerder gereageerd op dit voorstel." },
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

  const { error: statusFout } = await supabase
    .from("aanvragen")
    .update({ status: goedgekeurd ? "goedgekeurd" : "afgewezen" })
    .eq("id", aanvraag.id);

  if (statusFout) {
    return NextResponse.json({ ok: false, error: statusFout.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
