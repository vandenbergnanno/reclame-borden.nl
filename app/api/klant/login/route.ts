import { NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";

// Klant-inloggen ging voorheen rechtstreeks vanuit de browser naar Supabase
// (`supabase.auth.signInWithPassword`, zie app/inloggen/KlantLoginForm.tsx) -- dat betekende dat
// er geen eigen IP-gebaseerde rate limiting tussen zat (alleen een cosmetische, makkelijk te
// omzeilen sessionStorage-afremming aan de clientkant). Deze route zit er nu tussen: eerst onze
// eigen rate limit, dan pas Supabase aanroepen.
//
// Let op: de Turnstile-captchaToken wordt hier bewust NIET zelf tegen Cloudflare geverifieerd
// (zoals /api/intern/login dat wel doet) -- Supabase's eigen "Enable Captcha protection" (dashboard)
// doet die verificatie al bij signInWithPassword zelf, en een Turnstile-token is maar één keer
// bruikbaar. Tweemaal verifiëren (hier én in Supabase) zou de tweede keer altijd laten mislukken.
// We geven 'm dus gewoon door aan Supabase, zoals de browser dat eerder rechtstreeks deed.
//
// Werkt met dezelfde cookie-sessie-client als app/mijn-borden (serverAuth.ts) -- een Route Handler
// mag, anders dan een Server Component, wél cookies zetten, dus de ingelogde sessie komt hier
// gewoon als Set-Cookie mee terug naar de browser.
const MAX_POGINGEN = 5;
const VENSTER_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rateLimit = await checkRateLimit(`klant-login:${ip}`, MAX_POGINGEN, VENSTER_MS);
  if (!rateLimit.toegestaan) {
    return teVeelPogingenResponse(rateLimit);
  }

  let body: { email?: unknown; wachtwoord?: unknown; cf_turnstile_token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  const captchaToken = typeof body.cf_turnstile_token === "string" ? body.cf_turnstile_token : undefined;

  if (typeof body.email !== "string" || typeof body.wachtwoord !== "string") {
    return NextResponse.json({ ok: false, error: "Vul een e-mailadres en wachtwoord in." }, { status: 400 });
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
    options: { captchaToken },
  });
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message === "Invalid login credentials" ? "Onjuist e-mailadres of wachtwoord." : error.message },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
