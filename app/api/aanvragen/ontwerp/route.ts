import { createServerSupabaseClient } from "@/lib/supabase/server";
import { analyzeRequest } from "@/lib/ai/analyzeRequest";
import { controleerAfmetingBeschikbaarheid } from "@/lib/ai/controleerAfmetingBeschikbaarheid";
import { checkRateLimit, clientIp } from "@/lib/security/rateLimit";
import { verifieerTurnstile } from "@/lib/security/turnstile";
import { logServerFout, GENERIEKE_SERVERFOUT } from "@/lib/security/serverFout";
import type { BordAanschaf, OverigBestand } from "@/lib/types/domain";

// Bestandsuploads vragen om de Node.js-runtime (niet de edge-runtime).
export const runtime = "nodejs";

// Endpoint voor de zelfbedieningsontwerptool (reclamebord-maker, los project — zie het
// `AANVRAAG_URL`-veld daarin). Dat is vanilla JS, geen React/fetch-wrapper van ons, en spreekt
// dus zijn EIGEN contract: antwoorden als { ok: true } / { ok: false, fout: "..." } (niet
// "error" zoals de rest van deze app), en multipart FormData met een paar tientallen velden.
// Dit endpoint volgt dat contract bewust exact, in plaats van de tool's JS aan te passen.

const MAX_AANVRAGEN_PER_UUR = 10;
const MAX_BESTAND_BYTES = 20 * 1024 * 1024;
const MAX_TOTAAL_BYTES = 40 * 1024 * 1024;
const MAX_BESTANDEN = 20;

const MAX_LENGTE = {
  naam: 200,
  bedrijf: 200,
  email: 320,
  telefoon: 50,
  afmeting: 100,
  opmerking: 2000,
  straat: 200,
  postcode: 10,
  plaats: 100,
  bordnaam: 100,
} as const;

function fout(bericht: string, status = 400) {
  return Response.json({ ok: false, fout: bericht }, { status });
}

function tekst(formData: FormData, veld: string): string {
  const waarde = formData.get(veld);
  return typeof waarde === "string" ? waarde.trim() : "";
}

function isGeldigEmailFormaat(waarde: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waarde);
}

const UUID_PATROON = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Meerdere borden in één order (zie "Dit bord opslaan en volgend bord beginnen" in de
// ontwerptool) sturen elk een eigen verzoek naar dit endpoint, maar met dezelfde bestelling_id
// erbij -- zo blijven het losse, onafhankelijke aanvraag-rijen (eigen ontwerp, eigen status) die
// /intern wel als één geheel kan tonen. Ontbreekt dit veld, of is het geen geldige uuid (bijv. een
// oudere versie van de tool die het nog niet meestuurt), dan valt de database terug op haar eigen
// `default gen_random_uuid()` -- een losse bestelling van één bord.
function geldigeBestellingId(formData: FormData): string | undefined {
  const waarde = formData.get("bestelling_id");
  return typeof waarde === "string" && UUID_PATROON.test(waarde) ? waarde : undefined;
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(`aanvraag-ontwerp:${clientIp(request)}`, MAX_AANVRAGEN_PER_UUR, 60 * 60 * 1000);
  if (!rateLimit.toegestaan) {
    // Retry-After erbij (net als teVeelPogingenResponse elders), maar met het eigen
    // { ok, fout }-contract van dit endpoint in plaats van { ok, error } -- zie de uitleg bovenaan dit bestand.
    return Response.json(
      { ok: false, fout: "Te veel pogingen. Probeer het over een paar minuten opnieuw." },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetOverSeconden) } }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fout("Ongeldige formulierdata.");
  }

  // Klassieke honeypot: een echte bezoeker ziet of vult dit veld nooit (het staat buiten beeld in
  // de tool), dus alleen een geautomatiseerd spamscript zou hem invullen. Net als bij de meeste
  // formulieren is "doe alsof het gelukt is" hier beter dan een duidelijke afwijzing — dat leert
  // het script niet dat de honeypot is gevonden.
  if (tekst(formData, "website") !== "") {
    return Response.json({ ok: true });
  }

  if (!(await verifieerTurnstile(tekst(formData, "cf_turnstile_token"), clientIp(request)))) {
    return fout("We konden niet controleren of je geen geautomatiseerd script bent. Laad de pagina opnieuw en probeer het nogmaals.", 403);
  }

  const bordnaam = tekst(formData, "bordnaam");
  const naam = tekst(formData, "naam");
  const bedrijf = tekst(formData, "bedrijf");
  const email = tekst(formData, "email");
  const telefoon = tekst(formData, "telefoon");
  const opmerking = tekst(formData, "opmerking");
  const formaat = tekst(formData, "formaat");
  const levering = tekst(formData, "levering");
  const straat = tekst(formData, "straat");
  const postcode = tekst(formData, "postcode");
  const plaats = tekst(formData, "plaats");
  const bedrukking = tekst(formData, "bedrukking") || "Enkelzijdig";
  const kromtrekken = tekst(formData, "kromtrekken") === "ja";
  const hergebruik = tekst(formData, "hergebruik") === "ja";
  const ontwerpDoorOns = tekst(formData, "ontwerp_door_ons") === "ja";
  const legeLogoplek = tekst(formData, "lege_logoplek") === "ja";
  const ontwerpOntbreekt = tekst(formData, "ontwerp_ontbreekt") === "ja";
  const qrCodes = tekst(formData, "qr_codes") || null;
  const teksten = tekst(formData, "teksten") || null;
  const waarschuwingen = tekst(formData, "waarschuwingen") || null;
  const compleetOntwerp = tekst(formData, "compleet_ontwerp") || null;
  const aantalRuw = Number(tekst(formData, "aantal") || "1");

  if (!bordnaam) return fout("Geef dit bord een naam.");
  if (bordnaam.length > MAX_LENGTE.bordnaam) return fout("Naam voor dit bord is te lang.");
  if (!naam) return fout("Vul je naam in.");
  if (naam.length > MAX_LENGTE.naam) return fout("Naam is te lang.");
  if (bedrijf.length > MAX_LENGTE.bedrijf) return fout("Bedrijfsnaam is te lang.");
  if (!email || !isGeldigEmailFormaat(email) || email.length > MAX_LENGTE.email) {
    return fout("Vul een geldig e-mailadres in.");
  }
  if (telefoon.length > MAX_LENGTE.telefoon) return fout("Telefoonnummer is te lang.");
  if (!formaat || formaat.length > MAX_LENGTE.afmeting) return fout("Ongeldig formaat.");
  if (!Number.isInteger(aantalRuw) || aantalRuw < 1 || aantalRuw > 99) {
    return fout("Vul een aantal borden in tussen 1 en 99.");
  }
  if (bedrukking !== "Enkelzijdig" && bedrukking !== "Dubbelzijdig") return fout("Ongeldige bedrukking.");
  if (levering !== "Bezorgen" && levering !== "Zelf ophalen in Oudewater") return fout("Ongeldige leveringskeuze.");
  if (levering === "Bezorgen") {
    if (!straat || straat.length > MAX_LENGTE.straat) return fout("Vul een geldig bezorgadres in.");
    if (!/^\d{4}\s?[a-zA-Z]{2}$/.test(postcode) || postcode.length > MAX_LENGTE.postcode) {
      return fout("Vul een geldige postcode in.");
    }
    if (!plaats || plaats.length > MAX_LENGTE.plaats) return fout("Vul een geldige plaats in.");
  }
  if (ontwerpDoorOns && opmerking.trim().length < 5) {
    return fout("Vertel in een paar woorden wat er op het bord moet.");
  }
  if (opmerking.length > MAX_LENGTE.opmerking) return fout(`Opmerking mag maximaal ${MAX_LENGTE.opmerking} tekens zijn.`);

  const drukbestand = formData.get("drukbestand");
  if (!ontwerpDoorOns && !(drukbestand instanceof File && drukbestand.size > 0)) {
    return fout("Drukbestand ontbreekt.");
  }

  // Alle meegestuurde bestanden in één keer verzamelen en op grootte controleren, vóórdat we iets
  // naar Supabase Storage sturen — zo hoeven we bij een te grote aanvraag niets weer terug te
  // draaien.
  const bestandVelden: { veld: string; file: File }[] = [];
  for (const [veld, waarde] of formData.entries()) {
    if (waarde instanceof File && waarde.size > 0) bestandVelden.push({ veld, file: waarde });
  }
  if (bestandVelden.length > MAX_BESTANDEN) {
    return fout("Te veel bestanden tegelijk. Verstuur je aanvraag met minder bijlagen.");
  }
  let totaalBytes = 0;
  for (const { file } of bestandVelden) {
    if (file.size > MAX_BESTAND_BYTES) {
      return fout(`"${file.name}" is te groot (max. ${Math.round(MAX_BESTAND_BYTES / 1048576)} MB per bestand).`);
    }
    totaalBytes += file.size;
  }
  if (totaalBytes > MAX_TOTAAL_BYTES) {
    return fout(`Alle bestanden samen zijn te groot (max. ${Math.round(MAX_TOTAAL_BYTES / 1048576)} MB).`);
  }

  const bordAanschaf: BordAanschaf = hergebruik ? "hergebruiken" : "nieuw";
  const bestellingId = geldigeBestellingId(formData);

  let supabase: ReturnType<typeof createServerSupabaseClient>;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return fout(error instanceof Error ? error.message : "Supabase is niet geconfigureerd.", 500);
  }

  // Klant hergebruiken op basis van e-mailadres, anders nieuwe klant aanmaken — zelfde aanpak als
  // /api/aanvragen. De ontwerptool vraagt geen provincie, dus die blijft leeg.
  const { data: bestaandeKlant, error: klantZoekFout } = await supabase
    .from("klanten")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (klantZoekFout) {
    logServerFout("ontwerp: klant opzoeken", klantZoekFout);
    return fout(GENERIEKE_SERVERFOUT, 500);
  }

  let klantId = bestaandeKlant?.id;

  if (!klantId) {
    const { data: nieuweKlant, error: klantInsertFout } = await supabase
      .from("klanten")
      .insert({
        naam,
        bedrijf: bedrijf || null,
        email,
        telefoon: telefoon || null,
        provincie: null,
      })
      .select("id")
      .single();

    if (klantInsertFout || !nieuweKlant) {
      logServerFout("ontwerp: klant aanmaken", klantInsertFout ?? new Error("Geen klant teruggekregen na insert"));
      return fout(GENERIEKE_SERVERFOUT, 500);
    }

    klantId = nieuweKlant.id;
  }

  const { data: aanvraag, error: aanvraagInsertFout } = await supabase
    .from("aanvragen")
    .insert({
      klant_id: klantId,
      ...(bestellingId ? { bestelling_id: bestellingId } : {}),
      veldtype: null,
      bordnaam,
      afmeting: formaat,
      bord_aanschaf: bordAanschaf,
      wens: null,
      status: "nieuw",
      voorstel_gepland_op: new Date().toISOString(),
      aantal: aantalRuw,
      bedrukking,
      kromtrekken,
      levering,
      straat: levering === "Bezorgen" ? straat : null,
      postcode: levering === "Bezorgen" ? postcode : null,
      plaats: levering === "Bezorgen" ? plaats : null,
      opmerking: opmerking || null,
      ontwerp_door_ons: ontwerpDoorOns,
      qr_codes: qrCodes,
      teksten,
      waarschuwingen,
      lege_logoplek: legeLogoplek,
      compleet_ontwerp: compleetOntwerp,
      ontwerp_ontbreekt: ontwerpOntbreekt,
    })
    .select("id")
    .single();

  if (aanvraagInsertFout || !aanvraag) {
    logServerFout("ontwerp: aanvraag opslaan", aanvraagInsertFout ?? new Error("Geen aanvraag teruggekregen na insert"));
    return fout(GENERIEKE_SERVERFOUT, 500);
  }

  // Bestanden uploaden. Eén los mislukt bestand mag de rest van de (al opgeslagen) aanvraag niet
  // blokkeren — net als bij overige_bestanden hieronder noteren we eventuele mislukkingen in
  // plaats van de hele aanvraag te laten falen; de klant heeft dan al een bevestigingspagina
  // gezien en kan niet opnieuw op "Versturen" klikken.
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "aanvraag-bijlagen";
  const overigeBestanden: OverigBestand[] = [];
  const paden: Record<string, string> = {};
  // Losse, niet-opnieuw-toe te wijzen binding: TS narrowt de `!aanvraag`-check hierboven niet door
  // de function-declaration-closure van uploadBestand heen.
  const aanvraagId: string = aanvraag.id;

  async function uploadBestand(veld: string, file: File): Promise<string | null> {
    const pad = `${aanvraagId}/${veld}-${file.name}`;
    const { error: uploadFout } = await supabase.storage.from(bucket).upload(pad, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    return uploadFout ? null : pad;
  }

  for (const { veld, file } of bestandVelden) {
    const pad = await uploadBestand(veld, file);
    if (!pad) continue;

    if (veld === "drukbestand") paden.drukbestand_pad = pad;
    else if (veld === "drukbestand_achter") paden.drukbestand_achter_pad = pad;
    else if (veld === "voorbeeld") paden.voorbeeld_pad = pad;
    else if (veld === "voorbeeld_achter") paden.voorbeeld_achter_pad = pad;
    else if (veld === "ontwerp") paden.ontwerp_pad = pad;
    else overigeBestanden.push({ naam: file.name, pad });
  }

  await supabase
    .from("aanvragen")
    .update({ ...paden, overige_bestanden: overigeBestanden.length ? overigeBestanden : null })
    .eq("id", aanvraag.id);

  const teControlerenTekst = [opmerking, teksten].filter(Boolean).join("\n");
  const checkResultaten = teControlerenTekst ? analyzeRequest(teControlerenTekst) : [];
  const afmetingCheck = controleerAfmetingBeschikbaarheid(bordAanschaf, formaat);
  const alleChecks = [...checkResultaten, ...(afmetingCheck ? [afmetingCheck] : [])];

  if (alleChecks.length) {
    await supabase.from("content_checks").insert(
      alleChecks.map((resultaat) => ({
        aanvraag_id: aanvraag.id,
        probleem: resultaat.probleem,
        geblokkeerd: resultaat.geblokkeerd,
        toelichting: resultaat.toelichting,
      }))
    );
  }

  return Response.json({ ok: true });
}

// De tool vraagt dit op vóórdat de klant iets verstuurt (vraagLimietOp() in
// lib/ontwerptool/reclamebord-maker.html) om zelf te bepalen hoe sterk een te groot drukbestand
// ingepakt moet worden — puur informatief, geen aanvraag-afhandeling hier.
export async function GET() {
  return Response.json({
    ok: true,
    max: MAX_TOTAAL_BYTES,
    perBestand: MAX_BESTAND_BYTES,
    bestanden: MAX_BESTANDEN,
  });
}
