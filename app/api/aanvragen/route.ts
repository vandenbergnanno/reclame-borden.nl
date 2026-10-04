import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { analyzeRequest } from "@/lib/ai/analyzeRequest";
import { controleerAfmetingBeschikbaarheid } from "@/lib/ai/controleerAfmetingBeschikbaarheid";
import { berekenVoorstelGeplandOp } from "@/lib/planning/voorstelPlanning";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";
import {
  BORD_AANSCHAF_OPTIES,
  PROVINCIES,
  VELDTYPEN,
  type BordAanschaf,
  type Provincie,
  type Veldtype,
} from "@/lib/types/domain";

// Bestandsuploads vragen om de Node.js-runtime (niet de edge-runtime).
export const runtime = "nodejs";

// Ruim genoeg voor legitieme klanten (ook als ze een paar keer opnieuw moeten indienen), maar
// blokkeert geautomatiseerde spam van hetzelfde IP.
const MAX_AANVRAGEN_PER_UUR = 10;

// Simpele lengtegrenzen tegen misbruik (extreem grote payloads) — ruim boven wat een mens ooit
// in een formulierveld zou typen.
const MAX_LENGTE = { naam: 200, bedrijf: 200, email: 320, telefoon: 50, afmeting: 100, wens: 2000 } as const;

const MAX_BIJLAGE_BYTES = 10 * 1024 * 1024;
const TOEGESTANE_BIJLAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];

function isVeldtype(waarde: FormDataEntryValue | null): waarde is Veldtype {
  return typeof waarde === "string" && (VELDTYPEN as readonly string[]).includes(waarde);
}

function isBordAanschaf(waarde: FormDataEntryValue | null): waarde is BordAanschaf {
  return typeof waarde === "string" && (BORD_AANSCHAF_OPTIES as readonly string[]).includes(waarde);
}

function isProvincie(waarde: FormDataEntryValue | null): waarde is Provincie {
  return typeof waarde === "string" && (PROVINCIES as readonly string[]).includes(waarde);
}

function isGeldigEmailFormaat(waarde: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waarde);
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`aanvraag:${clientIp(request)}`, MAX_AANVRAGEN_PER_UUR, 60 * 60 * 1000);
  if (!rateLimit.toegestaan) {
    return teVeelPogingenResponse(rateLimit);
  }

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
  const provincie = formData.get("provincie");
  const veldtype = formData.get("veldtype");
  const afmeting = formData.get("afmeting");
  const bordAanschaf = formData.get("bord_aanschaf");
  const wens = formData.get("wens");
  const bijlage = formData.get("bijlage");

  if (typeof naam !== "string" || naam.trim() === "") {
    return NextResponse.json({ ok: false, error: "Naam is verplicht." }, { status: 400 });
  }
  if (naam.length > MAX_LENGTE.naam) {
    return NextResponse.json({ ok: false, error: "Naam is te lang." }, { status: 400 });
  }
  if (typeof bedrijf === "string" && bedrijf.length > MAX_LENGTE.bedrijf) {
    return NextResponse.json({ ok: false, error: "Bedrijfsnaam is te lang." }, { status: 400 });
  }
  if (typeof email !== "string" || email.trim() === "") {
    return NextResponse.json({ ok: false, error: "E-mailadres is verplicht." }, { status: 400 });
  }
  if (email.length > MAX_LENGTE.email || !isGeldigEmailFormaat(email.trim())) {
    return NextResponse.json({ ok: false, error: "Vul een geldig e-mailadres in." }, { status: 400 });
  }
  if (typeof telefoon === "string" && telefoon.length > MAX_LENGTE.telefoon) {
    return NextResponse.json({ ok: false, error: "Telefoonnummer is te lang." }, { status: 400 });
  }
  if (!isProvincie(provincie)) {
    return NextResponse.json({ ok: false, error: "Kies een geldige provincie." }, { status: 400 });
  }
  if (!isVeldtype(veldtype)) {
    return NextResponse.json({ ok: false, error: "Kies een geldig veldtype." }, { status: 400 });
  }
  if (typeof afmeting !== "string" || afmeting.trim() === "") {
    return NextResponse.json({ ok: false, error: "Kies of vul een afmeting in." }, { status: 400 });
  }
  if (afmeting.length > MAX_LENGTE.afmeting) {
    return NextResponse.json({ ok: false, error: "Afmeting is te lang." }, { status: 400 });
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
  if (wens.length > MAX_LENGTE.wens) {
    return NextResponse.json(
      { ok: false, error: `Ontwerpwens mag maximaal ${MAX_LENGTE.wens} tekens zijn.` },
      { status: 400 }
    );
  }
  if (bijlage instanceof File && bijlage.size > 0) {
    if (bijlage.size > MAX_BIJLAGE_BYTES) {
      return NextResponse.json({ ok: false, error: "Bijlage mag maximaal 10 MB zijn." }, { status: 400 });
    }
    if (bijlage.type && !TOEGESTANE_BIJLAGE_TYPES.includes(bijlage.type)) {
      return NextResponse.json(
        { ok: false, error: "Bijlage moet een afbeelding (png/jpg/webp/gif) of PDF zijn." },
        { status: 400 }
      );
    }
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
        provincie,
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

  // Placeholder-checks: puur informatief. Een aanvraag start altijd gewoon op "nieuw" — de tool
  // verbiedt of belooft zelf niets. Een gevonden probleem wordt als "Te controleren" getoond op
  // het interne overzicht (zie content_checks hieronder), zodat De Mediagraaf het kan bekijken
  // zonder dat de klant hoeft te wachten op een aparte beoordeling.
  // - analyzeRequest: gevonden contactgegevens (sommige klanten willen dat bewust op het bord).
  // - controleerAfmetingBeschikbaarheid: een nieuw bord in een afwijkende maat moet eerst
  //   gecheckt worden bij de leverancier voordat we het voorstel versturen.
  const afmetingCheck = controleerAfmetingBeschikbaarheid(bordAanschaf, afmeting.trim());
  const checkResultaten = [...analyzeRequest(wens), ...(afmetingCheck ? [afmetingCheck] : [])];

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
