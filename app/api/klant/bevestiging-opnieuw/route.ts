import { NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";
import { logServerFout } from "@/lib/security/serverFout";

// Als de bevestigingsmail bij het aanmaken mislukte (bijv. een storing bij de mailserver), of de
// klant 'm gewoon niet meer kan vinden, bestaat het account al (Supabase maakt de rij aan vóórdat
// 'm de mail probeert te sturen) maar is het nog niet bevestigd -- zonder dit zou de klant dan
// vastzitten: opnieuw aanmaken geeft "e-mailadres bestaat al", en inloggen kan nog niet.
const MAX_POGINGEN = 5;
const VENSTER_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rateLimit = await checkRateLimit(`bevestiging-opnieuw:${ip}`, MAX_POGINGEN, VENSTER_MS);
  if (!rateLimit.toegestaan) {
    return teVeelPogingenResponse(rateLimit);
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  if (typeof body.email !== "string" || !body.email.trim()) {
    return NextResponse.json({ ok: false, error: "Vul een e-mailadres in." }, { status: 400 });
  }

  const emailRateLimit = await checkRateLimit(
    `bevestiging-opnieuw:${ip}:${body.email.trim().toLowerCase()}`,
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

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: body.email,
    options: { emailRedirectTo: `${new URL(request.url).origin}/inloggen` },
  });

  // Nooit laten blijken of dit e-mailadres wel/niet bestaat of al bevestigd is -- altijd ok:true,
  // zelfde privacy-overweging als een "wachtwoord vergeten"-flow. Een échte fout (bijv. weer de
  // mailserverstoring) loggen we wel zelf, zodat we 'm kunnen zien.
  if (error) logServerFout("klant/bevestiging-opnieuw: resend", error);

  return NextResponse.json({ ok: true });
}
