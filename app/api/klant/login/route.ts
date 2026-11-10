import { NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";
import { logServerFout } from "@/lib/security/serverFout";
import { vertaalLoginFout } from "@/lib/security/authFout";

// Klant-inloggen ging voorheen rechtstreeks vanuit de browser naar Supabase
// (`supabase.auth.signInWithPassword`, zie app/inloggen/KlantLoginForm.tsx) -- dat betekende dat
// er geen eigen IP-gebaseerde rate limiting tussen zat (alleen een cosmetische, makkelijk te
// omzeilen sessionStorage-afremming aan de clientkant). Deze route zit er nu tussen: eerst onze
// eigen rate limits, dan pas Supabase aanroepen.
//
// Twee rate limits naast elkaar: per IP (beperkt hoeveel accounts één IP mag proberen) én per
// IP+e-mailadres (beperkt hoe vaak dezelfde combinatie het mag proberen, ook als dat IP -- bijv.
// een kantoor -- voor meerdere klanten wordt gedeeld). Beide staan in de gedeelde Supabase-tabel
// (zie lib/security/rateLimit.ts), dus een dichtgeklapt tabblad of een rechtstreekse aanroep van
// deze route zonder browser omzeilt geen van beide.
const MAX_POGINGEN = 5;
const VENSTER_MS = 15 * 60 * 1000;

// Geen Turnstile (meer) -- gaf te veel valse afwijzingen (zie git-historie). De bescherming
// hieronder blijft wel staan: IP- en e-mail-gebonden rate limiting. Houd Supabase's eigen "Enable
// Captcha protection" (dashboard → Authentication → Settings) UIT, die hoort hier niet bij.
export async function POST(request: Request) {
  const ip = clientIp(request);
  const ipRateLimit = await checkRateLimit(`klant-login:${ip}`, MAX_POGINGEN, VENSTER_MS);
  if (!ipRateLimit.toegestaan) {
    return teVeelPogingenResponse(ipRateLimit);
  }

  let body: { email?: unknown; wachtwoord?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

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
    const { bericht, loggen, nietBevestigd, kanBevestigingOpnieuw } = vertaalLoginFout(error);
    if (loggen) logServerFout("klant/login: signInWithPassword", error);
    // 403 (niet 401) voor "nog niet bevestigd": dat is geen fout wachtwoord, en moet dus niet
    // meetellen voor de client-side pogingen-afremming in KlantLoginForm.tsx (die telt alleen bij
    // status 401).
    return NextResponse.json(
      { ok: false, error: bericht, kanBevestigingOpnieuw },
      { status: nietBevestigd ? 403 : 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
