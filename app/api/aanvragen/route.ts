import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { analyzeRequest } from "@/lib/ai/analyzeRequest";
import { berekenVoorstelGeplandOp } from "@/lib/planning/voorstelPlanning";
import { BORD_AANSCHAF_OPTIES, VELDTYPEN, type BordAanschaf, type Veldtype } from "@/lib/types/domain";

// Bestandsuploads vragen om de Node.js-runtime (niet de edge-runtime).
export const runtime = "nodejs";

function isVeldtype(waarde: FormDataEntryValue | null): waarde is Veldtype {
  return typeof waarde === "string" && (VELDTYPEN as readonly string[]).includes(waarde);
}

function isBordAanschaf(waarde: FormDataEntryValue | null): waarde is BordAanschaf {
  return typeof waarde === "string" && (BORD_AANSCHAF_OPTIES as readonly string[]).includes(waarde);
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldige formulierdata." }, { status: 400 });
  }

  const naam = formData.get("naam");
  const bedrijf = formData.get("bedrijf");
  const email = formData.get("email");
  const telefoon = formData.get("telefoon");
  const veldtype = formData.get("veldtype");
  const afmeting = formData.get("afmeting");
  const bordAanschaf = formData.get("bord_aanschaf");
  const wens = formData.get("wens");
  const bijlage = formData.get("bijlage");

  if (typeof naam !== "string" || naam.trim() === "") {
    return NextResponse.json({ ok: false, error: "Naam is verplicht." }, { status: 400 });
  }
  if (typeof email !== "string" || email.trim() === "") {
    return NextResponse.json({ ok: false, error: "E-mailadres is verplicht." }, { status: 400 });
  }
  if (!isVeldtype(veldtype)) {
    return NextResponse.json({ ok: false, error: "Kies een geldig veldtype." }, { status: 400 });
  }
  if (typeof afmeting !== "string" || afmeting.trim() === "") {
    return NextResponse.json({ ok: false, error: "Kies of vul een afmeting in." }, { status: 400 });
  }
  if (!isBordAanschaf(bordAanschaf)) {
    return NextResponse.json(
      { ok: false, error: "Geef aan of je een bestaand bord hergebruikt of een nieuw bord wilt." },
      { status: 400 }
    );
  }
  if (typeof wens !== "string" || wens.trim() === "") {
    return NextResponse.json({ ok: false, error: "Beschrijf je ontwerpwens." }, { status: 400 });
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

  // Klant hergebruiken op basis van e-mailadres, anders nieuwe klant aanmaken.
  const { data: bestaandeKlant, error: klantZoekFout } = await supabase
    .from("klanten")
    .select("id")
    .eq("email", email.trim())
    .maybeSingle();

  if (klantZoekFout) {
    return NextResponse.json({ ok: false, error: klantZoekFout.message }, { status: 500 });
  }

  let klantId = bestaandeKlant?.id;

  if (!klantId) {
    const { data: nieuweKlant, error: klantInsertFout } = await supabase
      .from("klanten")
      .insert({
        naam: naam.trim(),
        bedrijf: typeof bedrijf === "string" && bedrijf.trim() !== "" ? bedrijf.trim() : null,
        email: email.trim(),
        telefoon: typeof telefoon === "string" && telefoon.trim() !== "" ? telefoon.trim() : null,
      })
      .select("id")
      .single();

    if (klantInsertFout || !nieuweKlant) {
      return NextResponse.json(
        { ok: false, error: klantInsertFout?.message ?? "Klant kon niet worden aangemaakt." },
        { status: 500 }
      );
    }

    klantId = nieuweKlant.id;
  }

  const { data: aanvraag, error: aanvraagInsertFout } = await supabase
    .from("aanvragen")
    .insert({
      klant_id: klantId,
      veldtype,
      afmeting: afmeting.trim(),
      bord_aanschaf: bordAanschaf,
      wens: wens.trim(),
      status: "nieuw",
      voorstel_gepland_op: berekenVoorstelGeplandOp().toISOString(),
    })
    .select("id")
    .single();

  if (aanvraagInsertFout || !aanvraag) {
    return NextResponse.json(
      { ok: false, error: aanvraagInsertFout?.message ?? "Aanvraag kon niet worden opgeslagen." },
      { status: 500 }
    );
  }

  // Optionele bijlage opslaan in Supabase Storage — puur opslag, nog geen verwerking.
  if (bijlage instanceof File && bijlage.size > 0) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "aanvraag-bijlagen";
    const pad = `${aanvraag.id}/${bijlage.name}`;

    const { error: uploadFout } = await supabase.storage.from(bucket).upload(pad, bijlage, {
      contentType: bijlage.type || undefined,
      upsert: false,
    });

    if (uploadFout) {
      return NextResponse.json(
        { ok: false, error: `Aanvraag opgeslagen, maar bijlage uploaden is mislukt: ${uploadFout.message}` },
        { status: 500 }
      );
    }

    await supabase.from("aanvragen").update({ bijlage_pad: pad }).eq("id", aanvraag.id);
  }

  // Placeholder-contentcheck: registreert eventuele gevonden problemen, blokkeert de
  // aanvraag in dit fundament nog niet. Escalatie op basis hiervan hoort bij een latere fase.
  const checkResultaten = analyzeRequest(wens);
  await supabase.from("content_checks").insert(
    checkResultaten.map((resultaat) => ({
      aanvraag_id: aanvraag.id,
      probleem: resultaat.probleem,
      geblokkeerd: resultaat.geblokkeerd,
      toelichting: resultaat.toelichting,
    }))
  );

  return NextResponse.json({ ok: true, aanvraagId: aanvraag.id });
}
