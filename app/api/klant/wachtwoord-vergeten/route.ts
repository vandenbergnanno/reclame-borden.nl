import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";
import { logServerFout } from "@/lib/security/serverFout";
import { siteAdres } from "@/lib/siteAdres";
import { sendWachtwoordHerstelEmail } from "@/lib/email/sendWachtwoordHerstelEmail";

// "Wachtwoord vergeten": maakt een eenmalige herstelcode aan (Supabase Auth, type "recovery") en
// mailt de klant een link naar /wachtwoord-instellen. De code staat achter een # in de link: dat
// deel stuurt een browser nooit mee naar de server, dus hij belandt niet in serverlogs. Pas als
// de klant op die pagina een nieuw wachtwoord verstuurt, wordt de code ingewisseld (zie
// app/api/klant/wachtwoord-instellen/route.ts) -- een mailscanner die de link vooraf "aanklikt"
// verbruikt 'm dus niet.
const MAX_PER_IP = 5;
const MAX_PER_EMAIL = 3;
const VENSTER_MS = 15 * 60 * 1000;
// Los van het IP: voorkomt dat iemand vanaf steeds andere adressen één klant bestookt met mails.
const MAX_PER_EMAIL_PER_UUR = 5;

const EMAIL_PATROON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const ipRateLimit = await checkRateLimit(`wachtwoord-vergeten:${ip}`, MAX_PER_IP, VENSTER_MS);
  if (!ipRateLimit.toegestaan) {
    return teVeelPogingenResponse(ipRateLimit);
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_PATROON.test(email)) {
    return NextResponse.json({ ok: false, error: "Vul een geldig e-mailadres in." }, { status: 400 });
  }

  const emailRateLimit = await checkRateLimit(`wachtwoord-vergeten:${ip}:${email}`, MAX_PER_EMAIL, VENSTER_MS);
  if (!emailRateLimit.toegestaan) {
    return teVeelPogingenResponse(emailRateLimit);
  }
  const adresRateLimit = await checkRateLimit(`wachtwoord-vergeten:adres:${email}`, MAX_PER_EMAIL_PER_UUR, 60 * 60 * 1000);
  if (!adresRateLimit.toegestaan) {
    return teVeelPogingenResponse(adresRateLimit);
  }

  let supabase: ReturnType<typeof createServerSupabaseClient>;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    logServerFout("klant/wachtwoord-vergeten: configuratie", error);
    return NextResponse.json({ ok: false, error: "Er ging iets mis. Probeer het later opnieuw." }, { status: 500 });
  }

  const { data, error } = await supabase.auth.admin.generateLink({ type: "recovery", email });

  // Geen account bij dit adres: zelfde antwoord als wanneer het wel bestaat, zodat hier niet te
  // raden valt wie er een account heeft. Alleen een échte storing loggen we.
  if (error || !data?.properties?.hashed_token) {
    if (error && error.code !== "user_not_found" && error.status !== 404) {
      logServerFout("klant/wachtwoord-vergeten: generateLink", error);
    }
    return NextResponse.json({ ok: true });
  }

  const herstelUrl = `${siteAdres(request)}/wachtwoord-instellen#token=${data.properties.hashed_token}`;
  const resultaat = await sendWachtwoordHerstelEmail(email, herstelUrl);

  // Lukt het versturen niet, dan zeggen we dat eerlijk: anders wacht de klant op een mail die
  // nooit komt. (Dat verraadt wel dat dit adres een account heeft, maar dat doet "Account
  // aanmaken" met "dit e-mailadres heeft al een account" ook al.)
  if (!resultaat.verzonden) {
    logServerFout("klant/wachtwoord-vergeten: mail versturen", new Error(resultaat.reden));
    return NextResponse.json(
      {
        ok: false,
        error: "We konden de mail niet versturen. Probeer het over een paar minuten opnieuw of mail naar info@demediagraaf.nl.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
