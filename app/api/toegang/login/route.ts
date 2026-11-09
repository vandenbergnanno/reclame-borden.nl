import { NextResponse } from "next/server";
import { SITE_SESSIE_COOKIE, SITE_SESSIE_MAX_LEEFTIJD_SECONDEN } from "@/lib/auth/siteSessie";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";
import { verifieerTurnstile } from "@/lib/security/turnstile";

// Zelfde opzet als app/api/intern/login/route.ts: één gedeeld wachtwoord voor de hele site
// (tijdelijk, zie lib/auth/siteSessie.ts), dus geen "per e-mailadres"-limiet mogelijk/nodig --
// wel een IP-limiet en een ruimere totaal-limiet tegen een breed verspreide aanval op dat ene
// wachtwoord.
const MAX_POGINGEN = 5;
const VENSTER_MS = 15 * 60 * 1000;
const MAX_POGINGEN_TOTAAL = 30;
const VENSTER_TOTAAL_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(`toegang-login:${clientIp(request)}`, MAX_POGINGEN, VENSTER_MS);
  if (!rateLimit.toegestaan) {
    return teVeelPogingenResponse(rateLimit);
  }

  const rateLimitTotaal = await checkRateLimit("toegang-login:totaal", MAX_POGINGEN_TOTAAL, VENSTER_TOTAAL_MS);
  if (!rateLimitTotaal.toegestaan) {
    return teVeelPogingenResponse(rateLimitTotaal);
  }

  const verwachtWachtwoord = process.env.SITE_WACHTWOORD;

  if (!verwachtWachtwoord) {
    return NextResponse.json(
      { ok: false, error: "SITE_WACHTWOORD is niet ingesteld (zie .env.example)." },
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
  if (!(await verifieerTurnstile(captchaToken, clientIp(request), "toegang"))) {
    return NextResponse.json(
      { ok: false, error: "We konden niet controleren of je geen geautomatiseerd script bent. Laad de pagina opnieuw en probeer het nogmaals." },
      { status: 403 }
    );
  }

  if (typeof body.wachtwoord !== "string" || body.wachtwoord !== verwachtWachtwoord) {
    return NextResponse.json({ ok: false, error: "Onjuist wachtwoord." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SITE_SESSIE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SITE_SESSIE_MAX_LEEFTIJD_SECONDEN,
    path: "/",
  });
  return response;
}
