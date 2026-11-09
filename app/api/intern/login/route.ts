import { NextResponse } from "next/server";
import { INTERN_SESSIE_COOKIE, INTERN_SESSIE_MAX_LEEFTIJD_SECONDEN } from "@/lib/auth/internSessie";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";
import { verifieerTurnstile } from "@/lib/security/turnstile";

// Het wachtwoord is gedeeld en dus een vast doelwit voor brute-force — maximaal 5 pogingen per
// 15 minuten per IP, los van of het wachtwoord klopte.
const MAX_POGINGEN = 5;
const VENSTER_MS = 15 * 60 * 1000;

// Dit endpoint kent geen individuele accounts/e-mailadressen (zie INTERN_WACHTWOORD: één gedeeld
// wachtwoord voor alle medewerkers) -- een limiet "per e-mailadres" is hier dus niet van
// toepassing. Om hetzelfde doel te bereiken (het ene gedeelde wachtwoord beschermen tegen iemand
// die de IP-limiet hierboven omzeilt door vanaf veel verschillende echte IP's te proberen, bijv.
// een botnet) staat er daarnaast een limiet op het totaal aantal pogingen over ALLE IP's samen:
// ruimer dan de IP-limiet (legitieme collega's op verschillende locaties mogen elkaar niet in de
// weg zitten), maar begrenst wél een brede, verspreide aanval op dat ene wachtwoord.
const MAX_POGINGEN_TOTAAL = 30;
const VENSTER_TOTAAL_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(`login:${clientIp(request)}`, MAX_POGINGEN, VENSTER_MS);
  if (!rateLimit.toegestaan) {
    return teVeelPogingenResponse(rateLimit);
  }

  const rateLimitTotaal = await checkRateLimit("login:totaal", MAX_POGINGEN_TOTAAL, VENSTER_TOTAAL_MS);
  if (!rateLimitTotaal.toegestaan) {
    return teVeelPogingenResponse(rateLimitTotaal);
  }

  const verwachtWachtwoord = process.env.INTERN_WACHTWOORD;

  if (!verwachtWachtwoord) {
    return NextResponse.json(
      { ok: false, error: "INTERN_WACHTWOORD is niet ingesteld (zie .env.example)." },
      { status: 500 }
    );
  }

  let body: { wachtwoord?: unknown; cf_turnstile_token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  const captchaToken = typeof body.cf_turnstile_token === "string" ? body.cf_turnstile_token : "";
  if (!(await verifieerTurnstile(captchaToken, clientIp(request), "intern-login"))) {
    return NextResponse.json(
      { ok: false, error: "We konden niet controleren of je geen geautomatiseerd script bent. Laad de pagina opnieuw en probeer het nogmaals." },
      { status: 403 }
    );
  }

  if (typeof body.wachtwoord !== "string" || body.wachtwoord !== verwachtWachtwoord) {
    return NextResponse.json({ ok: false, error: "Onjuist wachtwoord." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(INTERN_SESSIE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: INTERN_SESSIE_MAX_LEEFTIJD_SECONDEN,
    path: "/",
  });
  return response;
}
