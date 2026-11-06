import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { checkRateLimit, clientIp } from "@/lib/security/rateLimit";
import { sendKlantWijzigingNotificatie } from "@/lib/email/sendKlantWijzigingNotificatie";
import type { OverigBestand } from "@/lib/types/domain";

// Bestandsuploads vragen om de Node.js-runtime (niet de edge-runtime) -- zelfde reden als
// app/api/aanvragen/ontwerp/route.ts.
export const runtime = "nodejs";

// Een klant past een al ingediende aanvraag aan: dezelfde multipart-FormData-opbouw als
// /api/aanvragen/ontwerp (de ontwerptool stuurt hierheen i.p.v. daarheen zodra er een
// bewerkAanvraagId bekend is, zie lib/ontwerptool/reclamebord-maker.html), maar dan:
// - de klant moet al ingelogd zijn (geen Turnstile/honeypot nodig, geen anonieme aanvraag),
// - er wordt geen nieuwe klant/aanvraag aangemaakt, de bestaande rij wordt bijgewerkt,
// - alleen toegestaan zolang de aanvraag nog status "nieuw" heeft (zie VOLGENDE_PRODUCTIESTATUS
//   in lib/types/domain.ts -- zodra een medewerker "Start behandeling" klikt, is hij al in
//   productie en gaat hij op slot, bevestigd met de gebruiker),
// - de vorige versie wordt bewaard in aanvraag_versies, en status/gewijzigd_door_klant_op worden
//   bijgewerkt zodat /intern ziet dat er iets veranderd is.
const MAX_AANVRAGEN_PER_UUR = 10;
const MAX_BESTAND_BYTES = 20 * 1024 * 1024;
const MAX_TOTAAL_BYTES = 40 * 1024 * 1024;
const MAX_BESTANDEN = 20;

const MAX_LENGTE = {
  afmeting: 100,
  opmerking: 2000,
  straat: 200,
  postcode: 10,
  plaats: 100,
} as const;

function fout(bericht: string, status = 400) {
  return Response.json({ ok: false, fout: bericht }, { status });
}

function tekst(formData: FormData, veld: string): string {
  const waarde = formData.get(veld);
  return typeof waarde === "string" ? waarde.trim() : "";
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const rateLimit = await checkRateLimit(`aanvraag-klant-bewerken:${clientIp(request)}`, MAX_AANVRAGEN_PER_UUR, 60 * 60 * 1000);
  if (!rateLimit.toegestaan) {
    return Response.json(
      { ok: false, fout: "Te veel pogingen. Probeer het over een paar minuten opnieuw." },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetOverSeconden) } }
    );
  }

  let authClient: ReturnType<typeof createServerAuthClient>;
  try {
    authClient = createServerAuthClient();
  } catch (error) {
    return fout(error instanceof Error ? error.message : "Supabase is niet geconfigureerd.", 500);
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return fout("Je moet ingelogd zijn om een aanvraag aan te passen.", 401);
  }

  let supabase: ReturnType<typeof createServerSupabaseClient>;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return fout(error instanceof Error ? error.message : "Supabase is niet geconfigureerd.", 500);
  }

  const { data: klant } = await supabase.from("klanten").select("id, naam").eq("auth_user_id", user.id).maybeSingle();
  if (!klant) {
    return fout("Geen klantaccount gevonden bij deze inlog.", 403);
  }

  const { data: huidigeAanvraag } = await supabase.from("aanvragen").select("*").eq("id", params.id).maybeSingle();
  if (!huidigeAanvraag) {
    return fout("Aanvraag niet gevonden.", 404);
  }
  // Server-side dezelfde twee controles als de frontend (zie app/mijn-borden/page.tsx) -- de
  // frontend-knop bestaat alleen bij eigen "nieuw"-aanvragen, maar deze route moet dat zelf ook
  // afdwingen: een klant mag nooit andermans aanvraag, of een aanvraag die al in productie is,
  // via een rechtstreeks verzoek alsnog aanpassen.
  if (huidigeAanvraag.klant_id !== klant.id) {
    return fout("Deze aanvraag is niet van jou.", 403);
  }
  if (huidigeAanvraag.status !== "nieuw") {
    return fout("Deze aanvraag is al in productie. Wil je nog iets wijzigen? Mail naar info@demediagraaf.nl.", 403);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fout("Ongeldige formulierdata.");
  }

  const opmerking = tekst(formData, "opmerking");
  const formaat = tekst(formData, "formaat");
  const levering = tekst(formData, "levering");
  const straat = tekst(formData, "straat");
  const postcode = tekst(formData, "postcode");
  const plaats = tekst(formData, "plaats");
  const bedrukking = tekst(formData, "bedrukking") || "Enkelzijdig";
  const kromtrekken = tekst(formData, "kromtrekken") === "ja";
  const ontwerpDoorOns = tekst(formData, "ontwerp_door_ons") === "ja";
  const legeLogoplek = tekst(formData, "lege_logoplek") === "ja";
  const ontwerpOntbreekt = tekst(formData, "ontwerp_ontbreekt") === "ja";
  const qrCodes = tekst(formData, "qr_codes") || null;
  const teksten = tekst(formData, "teksten") || null;
  const waarschuwingen = tekst(formData, "waarschuwingen") || null;
  const compleetOntwerp = tekst(formData, "compleet_ontwerp") || null;
  const aantalRuw = Number(tekst(formData, "aantal") || "1");

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

  // Vorige versie bewaren vóórdat we 'm overschrijven -- zie aanvraag_versies in
  // supabase/migrations/0008_klant_bewerken.sql.
  await supabase.from("aanvraag_versies").insert({ aanvraag_id: huidigeAanvraag.id, data: huidigeAanvraag });

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "aanvraag-bijlagen";
  const overigeBestanden: OverigBestand[] = [];
  const paden: Record<string, string> = {};

  async function uploadBestand(veld: string, file: File): Promise<string | null> {
    const pad = `${params.id}/${veld}-${file.name}`;
    // upsert: true (anders dan /api/aanvragen/ontwerp) -- bij een bewerking is het juist de
    // bedoeling dat hetzelfde pad (aanvraagId + veld + bestandsnaam) het vorige bestand vervangt.
    const { error: uploadFout } = await supabase.storage.from(bucket).upload(pad, file, {
      contentType: file.type || undefined,
      upsert: true,
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

  const { error: updateFout } = await supabase
    .from("aanvragen")
    .update({
      ...paden,
      afmeting: formaat,
      status: "nieuw",
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
      // Geen nieuwe extra bijlagen bij deze bewerking? Dan de eerder meegestuurde bijlagen laten
      // staan in plaats van ze te wissen -- de ontwerptool kan een bestandsveld nooit vooraf vullen
      // met eerder geüploade bestanden (browserbeperking), dus "niets geselecteerd" betekent hier
      // "niet gewijzigd", niet "verwijderd".
      overige_bestanden: overigeBestanden.length ? overigeBestanden : huidigeAanvraag.overige_bestanden,
      gewijzigd_door_klant_op: new Date().toISOString(),
    })
    .eq("id", huidigeAanvraag.id);

  if (updateFout) {
    return fout(updateFout.message, 500);
  }

  await sendKlantWijzigingNotificatie({ aanvraagId: huidigeAanvraag.id, klantNaam: klant.naam });

  return Response.json({ ok: true });
}
