import { NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";
import { verifieerTurnstile } from "@/lib/security/turnstile";

// Klant-inloggen ging voorheen rechtstreeks vanuit de browser naar Supabase
// (`supabase.auth.signInWithPassword`, zie app/inloggen/KlantLoginForm.tsx) -- dat betekende dat
// er geen eigen IP-gebaseerde rate limiting tussen zat (alleen een cosmetische, makkelijk te
// omzeilen sessionStorage-afremming aan de clientkant). Deze route zit er nu tussen: eerst onze
// eigen rate limits, dan Turnstile, dan pas Supabase aanroepen.
//
// Twee rate limits naast elkaar: per IP (beperkt hoeveel accounts één IP mag proberen) én per
// IP+e-mailadres (beperkt hoe vaak dezelfde combinatie het mag proberen, ook als dat IP -- bijv.
// een kantoor -- voor meerdere klanten wordt gedeeld). Beide staan in de gedeelde Supabase-tabel
// (zie lib/security/rateLimit.ts), dus een dichtgeklapt tabblad of een rechtstreekse aanroep van
// deze route zonder browser omzeilt geen van beide.
const MAX_POGINGEN = 5;
const VENSTER_MS = 15 * 60 * 1000;

// Turnstile-verificatie gebeurt nu HIER, net als bij /api/intern/login -- niet meer (ook) via
// Supabase's eigen "Enable Captcha protection"-instelling. Een Turnstile-token is maar één keer
// bruikbaar; zou die Supabase-instelling ook nog aanstaan, dan verbruikt deze aanroep het token
// al, en zou Supabase's eigen (tweede) controle altijd falen. Daarom: die Supabase-instelling moet
// UIT staan (dashboard → Authentication → Settings → "Enable Captcha protection") zodra dit leeft.
export async function POST(request: Request) {
  const ip = clientIp(request);
  const ipRateLimit = await checkRateLimit(`klant-login:${ip}`, MAX_POGINGEN, VENSTER_MS);
  if (!ipRateLimit.toegestaan) {
    return teVeelPogingenResponse(ipRateLimit);
  }

  let body: { email?: unknown; wachtwoord?: unknown; cf_turnstile_token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  const captchaToken = typeof body.cf_turnstile_token === "string" ? body.cf_turnstile_token : "";

  if (typeof body.email !== "string" || typeof body.wachtwoord !== "string") {
    return NextResponse.json({ ok: false, error: "Vul een e-mailadres en wachtwoord in." }, { status: 400 });
  }

  const emailRateLimit = await checkRateLimit(
    `klant-login:${ip}:${body.email.trim().toLowerCase()}`,
    MAX_POGINGEN,
    VENSTER_MS
  );
  if (!emailRateLimit.toegestaan) {
    return teVeelPogingenResponse(emailRateLimit);
  }

  if (!(await verifieerTurnstile(captchaToken, ip))) {
    return NextResponse.json(
      { ok: false, error: "We konden niet controleren of je geen geautomatiseerd script bent. Laad de pagina opnieuw en probeer het nogmaals." },
      { status: 403 }
    );
  }

  let supabase: ReturnType<typeof createServerAuthClient>;
  try {
    supabase = createServerAuthClient();
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Supabase is niet geconfigureerd." },
      { status: 500 }
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.wachtwoord,
  });
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message === "Invalid login credentials" ? "Onjuist e-mailadres of wachtwoord." : error.message },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
