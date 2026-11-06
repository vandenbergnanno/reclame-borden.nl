import { NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";
import { verifieerTurnstile } from "@/lib/security/turnstile";

// Account aanmaken ging voorheen rechtstreeks vanuit de browser naar Supabase
// (`supabase.auth.signUp`, zie app/inloggen/KlantLoginForm.tsx) net als klant-inloggen dat deed --
// zelfde reden om deze route ertussen te zetten, zie app/api/klant/login/route.ts. Nu /api/klant/
// login zelf Turnstile verifieert (en dus Supabase's eigen "Enable Captcha protection"-instelling
// UIT moet staan, zie daar), zou signUp zonder deze route helemaal geen bot-check meer hebben.
const MAX_POGINGEN = 5;
const VENSTER_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const ipRateLimit = await checkRateLimit(`klant-registreren:${ip}`, MAX_POGINGEN, VENSTER_MS);
  if (!ipRateLimit.toegestaan) {
    return teVeelPogingenResponse(ipRateLimit);
  }

  let body: { email?: unknown; wachtwoord?: unknown; cf_turnstile_token?: unknown; emailRedirectTo?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  if (typeof body.email !== "string" || typeof body.wachtwoord !== "string") {
    return NextResponse.json({ ok: false, error: "Vul een e-mailadres en wachtwoord in." }, { status: 400 });
  }
  if (typeof body.emailRedirectTo !== "string" || !body.emailRedirectTo) {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  const emailRateLimit = await checkRateLimit(
    `klant-registreren:${ip}:${body.email.trim().toLowerCase()}`,
    MAX_POGINGEN,
    VENSTER_MS
  );
  if (!emailRateLimit.toegestaan) {
    return teVeelPogingenResponse(emailRateLimit);
  }

  const captchaToken = typeof body.cf_turnstile_token === "string" ? body.cf_turnstile_token : "";
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

  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.wachtwoord,
    options: { emailRedirectTo: body.emailRedirectTo },
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, heeftSessie: !!data.session });
}
