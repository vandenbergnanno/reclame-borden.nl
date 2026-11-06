import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isGeldigeUuid } from "@/lib/validatie/uuid";
import { logServerFout, GENERIEKE_SERVERFOUT } from "@/lib/security/serverFout";

const MAX_LENGTE = { onderwerp: 300, platte_tekst: 20_000, html_inhoud: 100_000 } as const;

// Beveiligd via middleware.ts (de gedeelde-wachtwoord-poort van /intern) — alleen ingelogde
// medewerkers kunnen hier bij.
//
// Een e-mail mag alleen aangepast worden zolang hij nog niet écht verstuurd is (zie
// `emails.verzonden`) — anders zou je hier iets anders laten zien dan wat de klant daadwerkelijk
// ontvangen heeft.
export async function PATCH(request: Request, { params }: { params: { id: string; emailId: string } }) {
  if (!isGeldigeUuid(params.id) || !isGeldigeUuid(params.emailId)) {
    return NextResponse.json({ ok: false, error: "E-mail niet gevonden." }, { status: 404 });
  }

  let body: { onderwerp?: unknown; platte_tekst?: unknown; html_inhoud?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  const onderwerp = typeof body.onderwerp === "string" ? body.onderwerp.trim() : null;
  const platteTekst = typeof body.platte_tekst === "string" ? body.platte_tekst : null;
  const htmlInhoud = typeof body.html_inhoud === "string" ? body.html_inhoud : null;

  if (!onderwerp || !platteTekst || !htmlInhoud) {
    return NextResponse.json(
      { ok: false, error: "Onderwerp, platte tekst en HTML-inhoud zijn allemaal verplicht." },
      { status: 400 }
    );
  }
  if (
    onderwerp.length > MAX_LENGTE.onderwerp ||
    platteTekst.length > MAX_LENGTE.platte_tekst ||
    htmlInhoud.length > MAX_LENGTE.html_inhoud
  ) {
    return NextResponse.json({ ok: false, error: "Eén van de velden is te lang." }, { status: 400 });
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

  const { data: email, error: emailFout } = await supabase
    .from("emails")
    .select("id, verzonden")
    .eq("id", params.emailId)
    .eq("aanvraag_id", params.id)
    .maybeSingle();

  if (emailFout) {
    logServerFout("emails/[emailId]: email opzoeken", emailFout);
    return NextResponse.json({ ok: false, error: GENERIEKE_SERVERFOUT }, { status: 500 });
  }
  if (!email) {
    return NextResponse.json({ ok: false, error: "E-mail niet gevonden." }, { status: 404 });
  }
  if (email.verzonden) {
    return NextResponse.json(
      { ok: false, error: "Deze e-mail is al verstuurd en kan niet meer aangepast worden." },
      { status: 409 }
    );
  }

  const { error: updateFout } = await supabase
    .from("emails")
    .update({ onderwerp, platte_tekst: platteTekst, html_inhoud: htmlInhoud })
    .eq("id", email.id);

  if (updateFout) {
    logServerFout("emails/[emailId]: email bijwerken", updateFout);
    return NextResponse.json({ ok: false, error: GENERIEKE_SERVERFOUT }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
