import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AANVRAAG_STATUSSEN, type AanvraagStatus } from "@/lib/types/domain";
import { isGeldigeUuid } from "@/lib/validatie/uuid";
import { logServerFout, GENERIEKE_SERVERFOUT } from "@/lib/security/serverFout";

function isAanvraagStatus(waarde: unknown): waarde is AanvraagStatus {
  return typeof waarde === "string" && (AANVRAAG_STATUSSEN as readonly string[]).includes(waarde);
}

// Beveiligd via middleware.ts (de gedeelde-wachtwoord-poort van /intern) — alleen ingelogde
// medewerkers kunnen hier bij.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isGeldigeUuid(params.id)) {
    return NextResponse.json({ ok: false, error: "Aanvraag niet gevonden." }, { status: 404 });
  }

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  if (!isAanvraagStatus(body.status)) {
    return NextResponse.json({ ok: false, error: "Ongeldige status." }, { status: 400 });
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

  const { error } = await supabase.from("aanvragen").update({ status: body.status }).eq("id", params.id);

  if (error) {
    logServerFout("aanvragen/[id]/status: status bijwerken", error);
    return NextResponse.json({ ok: false, error: GENERIEKE_SERVERFOUT }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
