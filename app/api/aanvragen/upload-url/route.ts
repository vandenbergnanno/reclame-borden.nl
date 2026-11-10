import { NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, clientIp } from "@/lib/security/rateLimit";
import { logServerFout, GENERIEKE_SERVERFOUT } from "@/lib/security/serverFout";
import { isGeldigeUuid } from "@/lib/validatie/uuid";

// Geeft een signed upload URL uit voor Supabase Storage, zodat grote bestanden (drukbestand,
// voorbeeld, logo's) rechtstreeks van de browser naar Storage gaan in plaats van als request-body
// door deze Next.js-app -- Vercel's eigen serverless functies weigeren sowieso alles boven ~4,5 MB
// (zie app/api/aanvragen/ontwerp/route.ts), dus bij een kant-en-klaar drukbestand van een paar MB
// liep dat eerder al vast vóórdat onze eigen code ooit een foutmelding kon teruggeven.
//
// Waarom een signed URL i.p.v. Storage RLS-policies: de ontwerptool (reclamebord-maker.html) is
// een standalone HTML-bestand zonder React/sessie-cookiedeling met deze Next.js-app -- om RLS (die
// op `auth.uid()` leunt) te laten werken zou de tool een eigen, levende Supabase-sessie/JWT moeten
// dragen, met vervaltijd-gedoe. Deze route checkt de klantsessie al via het bestaande
// cookie-mechanisme (zelfde als app/aanvraag/route.ts) en geeft pas dán een tijdelijke, aan dit ene
// pad gebonden upload-token uit -- dezelfde garantie ("alleen ingelogde klanten, alleen hun eigen
// map"), zonder dat de tool zelf een sessie hoeft te dragen.
export const runtime = "nodejs";

const MAX_AANVRAGEN_PER_UUR = 60; // ruimer dan de aanvraag zelf: meerdere bestanden per aanvraag
const MAX_BESTAND_BYTES = 20 * 1024 * 1024;

// Zelfde bestandstypen die de ontwerptool al accepteert voor drukbestand/voorbeeld/logo/extra
// bijlagen (zie soortBestand() in reclamebord-maker.html) -- op extensie, niet op de door de
// browser opgegeven contentType: professionele ontwerpbestanden (.ai/.eps/.cdr) hebben vaak geen
// eenduidige MIME-type, browsers geven dan willekeurig iets terug of niets.
// .reclamebord: het eigen opslagformaat van de ontwerptool (bestandErbij('ontwerp', ...,
// 'ontwerp.reclamebord')) -- gaat bij ELKE aanvraag mee, zodat het team het ontwerp later kan
// openen/aanpassen.
const TOEGESTANE_EXTENSIES = [
  ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic", ".heif", ".svg", ".ai", ".eps", ".cdr", ".psd", ".tiff", ".tif",
  ".reclamebord",
];

function fout(bericht: string, status = 400) {
  return NextResponse.json({ ok: false, error: bericht }, { status });
}

function heeftToegestaneExtensie(bestandsnaam: string): boolean {
  const lager = bestandsnaam.toLowerCase();
  return TOEGESTANE_EXTENSIES.some((ext) => lager.endsWith(ext));
}

// Een bestandsnaam kan rare tekens bevatten (spaties, aanhalingstekens, emoji...) -- dit maakt er
// een veilig pad-onderdeel van zonder de betekenis (extensie, herkenbare naam) te verliezen.
function veiligeBestandsnaam(bestandsnaam: string): string {
  const basis = bestandsnaam.replace(/[/\\]/g, "_").replace(/[^a-zA-Z0-9._-]/g, "_");
  return basis.slice(-150) || "bestand";
}

// De ontwerptool stuurt hier de FormData-veldnaam van het bestand mee (zie reclamebord-maker.html),
// zoals "drukbestand" maar ook "logo[]"/"extra[]" (meerdere bestanden onder dezelfde naam). Die
// vierkante haken zijn prima in een FormData-veldnaam, maar Supabase Storage wijst zo'n teken in een
// object-pad af ("InvalidKey") -- vandaar deze opschoning vóórdat het pad gebouwd wordt. De
// ontwerptool zelf vervangt "[]" al door een uniek volgnummer (zie uploadBestandenEnVervangPaden());
// dit is het vangnet voor wat daar nog doorheen glipt.
function veiligVeld(veld: string): string {
  const basis = veld.replace(/[^a-zA-Z0-9_-]/g, "-");
  return basis.slice(0, 60) || "bestand";
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(`aanvraag-upload-url:${clientIp(request)}`, MAX_AANVRAGEN_PER_UUR, 60 * 60 * 1000);
  if (!rateLimit.toegestaan) {
    return fout("Te veel pogingen. Probeer het over een paar minuten opnieuw.", 429);
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
    return fout("Je moet ingelogd zijn om een bestand te uploaden.", 401);
  }

  let body: { aanvraagId?: unknown; veld?: unknown; bestandsnaam?: unknown; grootte?: unknown };
  try {
    body = await request.json();
  } catch {
    return fout("Ongeldig verzoek.");
  }

  if (typeof body.aanvraagId !== "string" || !isGeldigeUuid(body.aanvraagId)) {
    return fout("Ongeldige aanvraag.");
  }
  if (typeof body.veld !== "string" || !body.veld) {
    return fout("Ongeldig veld.");
  }
  if (typeof body.bestandsnaam !== "string" || !body.bestandsnaam) {
    return fout("Ongeldige bestandsnaam.");
  }
  if (!heeftToegestaneExtensie(body.bestandsnaam)) {
    return fout("Dit bestandstype wordt niet ondersteund.");
  }
  const grootte = Number(body.grootte);
  if (!Number.isFinite(grootte) || grootte <= 0) {
    return fout("Ongeldige bestandsgrootte.");
  }
  if (grootte > MAX_BESTAND_BYTES) {
    return fout(`Bestand is te groot (max. ${Math.round(MAX_BESTAND_BYTES / 1048576)} MB per bestand).`);
  }

  let supabase: ReturnType<typeof createServerSupabaseClient>;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return fout(error instanceof Error ? error.message : "Supabase is niet geconfigureerd.", 500);
  }

  // Bestaat er al een aanvraag met dit id (de klant bewerkt een eerder ingediende, nog "nieuwe"
  // aanvraag), dan moet die wel echt van hemzelf zijn en nog aan te passen -- zelfde controle als
  // app/api/aanvragen/[id]/klant-bewerken/route.ts. Bestaat de aanvraag nog niet (de normale
  // nieuwe-aanvraag-flow, het id is hier vooraf door de ontwerptool zelf gegenereerd), dan is er
  // simpelweg nog niets om eigenaarschap van te controleren -- ingelogd zijn is dan genoeg.
  const { data: bestaandeAanvraag } = await supabase
    .from("aanvragen")
    .select("id, klant_id, status")
    .eq("id", body.aanvraagId)
    .maybeSingle();

  if (bestaandeAanvraag) {
    const { data: klant } = await supabase.from("klanten").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (!klant || bestaandeAanvraag.klant_id !== klant.id) {
      return fout("Deze aanvraag is niet van jou.", 403);
    }
    if (bestaandeAanvraag.status !== "nieuw") {
      return fout("Deze aanvraag is al in productie.", 403);
    }
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "aanvraag-bijlagen";
  const pad = `${body.aanvraagId}/${veiligVeld(body.veld)}-${veiligeBestandsnaam(body.bestandsnaam)}`;

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(pad, { upsert: true });
  if (error || !data) {
    logServerFout("aanvragen/upload-url: signed url aanmaken", error ?? new Error("Geen data teruggekregen"));
    return fout(GENERIEKE_SERVERFOUT, 500);
  }

  // signedUrl is al de volledige PUT-bestemming (inclusief token als querystring) -- de ontwerptool
  // hoeft dus geen Supabase-SDK te laden, een gewone XHR-PUT ernaartoe is genoeg (met de publieke
  // anon-key als apikey/Authorization-header, zie reclamebord-maker.html).
  return NextResponse.json({ ok: true, signedUrl: data.signedUrl, path: data.path });
}
