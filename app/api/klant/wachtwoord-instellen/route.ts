import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";
import { GENERIEKE_SERVERFOUT, logServerFout } from "@/lib/security/serverFout";

// Tweede helft van "wachtwoord vergeten" (zie app/api/klant/wachtwoord-vergeten/route.ts): wisselt
// de eenmalige code uit de mail in voor een sessie en zet meteen het nieuwe wachtwoord. Na afloop
// is de klant ingelogd.
const MAX_POGINGEN = 10;
const VENSTER_MS = 15 * 60 * 1000;
const MIN_LENGTE = 8;
const MAX_LENGTE = 72;

// De code is maar één keer in te wisselen. Keurt Supabase daarna het wachtwoord alsnog af, dan
// zou de klant met een verbruikte link zitten. Dit cookie onthoudt (10 minuten, alleen voor deze
// route) voor WIE de code net is ingewisseld, zodat diezelfde klant het nog een keer mag proberen
// -- en alleen die: zonder deze controle zou een verlopen link van iemand anders het wachtwoord
// kunnen wijzigen van wie er toevallig nog ingelogd is in dezelfde browser.
const HERSTEL_COOKIE = "wachtwoord_herstel";

const VERLOPEN = "Deze link is verlopen of al gebruikt. Vraag een nieuwe link aan.";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rateLimit = await checkRateLimit(`wachtwoord-instellen:${ip}`, MAX_POGINGEN, VENSTER_MS);
  if (!rateLimit.toegestaan) {
    return teVeelPogingenResponse(rateLimit);
  }

  let body: { token?: unknown; wachtwoord?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const wachtwoord = typeof body.wachtwoord === "string" ? body.wachtwoord : "";

  if (!token || token.length > 200) {
    return NextResponse.json({ ok: false, error: VERLOPEN, verlopen: true }, { status: 400 });
  }
  if (wachtwoord.length < MIN_LENGTE) {
    return NextResponse.json({ ok: false, error: `Kies een wachtwoord van minimaal ${MIN_LENGTE} tekens.` }, { status: 400 });
  }
  if (wachtwoord.length > MAX_LENGTE) {
    return NextResponse.json({ ok: false, error: `Kies een wachtwoord van hoogstens ${MAX_LENGTE} tekens.` }, { status: 400 });
  }

  let supabase: ReturnType<typeof createServerAuthClient>;
  try {
    supabase = createServerAuthClient();
  } catch (error) {
    logServerFout("klant/wachtwoord-instellen: configuratie", error);
    return NextResponse.json({ ok: false, error: GENERIEKE_SERVERFOUT }, { status: 500 });
  }

  const cookieStore = cookies();
  const { data: ingewisseld, error: wisselFout } = await supabase.auth.verifyOtp({ token_hash: token, type: "recovery" });

  if (wisselFout || !ingewisseld.user) {
    // Code al verbruikt: alleen doorgaan als dat zojuist door deze zelfde klant is gebeurd.
    const eerder = cookieStore.get(HERSTEL_COOKIE)?.value;
    const { data: sessie } = await supabase.auth.getUser();
    if (!eerder || !sessie.user || sessie.user.id !== eerder) {
      return NextResponse.json({ ok: false, error: VERLOPEN, verlopen: true }, { status: 400 });
    }
  } else {
    cookieStore.set(HERSTEL_COOKIE, ingewisseld.user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/api/klant/wachtwoord-instellen",
    });
  }

  const { error: wijzigFout } = await supabase.auth.updateUser({ password: wachtwoord });

  // "same_password": de klant koos het wachtwoord dat hij al had. Prima -- hij is nu ingelogd en
  // weet zijn wachtwoord weer, dus dat is gewoon gelukt.
  if (wijzigFout && wijzigFout.code !== "same_password") {
    if (wijzigFout.code === "weak_password") {
      return NextResponse.json(
        { ok: false, error: "Dit wachtwoord is te makkelijk te raden. Kies een langer of minder voor de hand liggend wachtwoord." },
        { status: 400 }
      );
    }
    logServerFout("klant/wachtwoord-instellen: updateUser", wijzigFout);
    return NextResponse.json({ ok: false, error: GENERIEKE_SERVERFOUT }, { status: 500 });
  }

  cookieStore.set(HERSTEL_COOKIE, "", { maxAge: 0, path: "/api/klant/wachtwoord-instellen" });
  return NextResponse.json({ ok: true });
}
