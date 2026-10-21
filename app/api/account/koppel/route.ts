import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";

// Deze route vereist weliswaar al een geldige Supabase-sessie (zie de getUser()-check hieronder),
// maar een ingelogd account kan 'm nog steeds herhaaldelijk aanroepen om de klanten-tabel te
// bestoken — dezelfde voorzichtigheid als bij /api/intern/login en /api/aanvragen/ontwerp.
const MAX_POGINGEN = 10;
const VENSTER_MS = 15 * 60 * 1000;

// Na een geslaagde Supabase Auth-signup (die vanuit de browser gebeurt, zie app/inloggen) koppelt
// deze route het account aan een klanten-rij: bestaat die rij al (de klant had eerder al een
// gastaanvraag ingediend met hetzelfde e-mailadres), dan wordt die hergebruikt -- zo ziet de klant
// zijn oudere, al bestaande aanvragen meteen terug op /mijn-borden. Bestaat de rij nog niet, dan
// wordt hij aangemaakt.
//
// Dit moet met de service-role key (RLS heeft bewust geen insert/update-policy voor klanten, zie
// supabase/migrations/0003_klant_accounts.sql) -- maar alleen NADAT we hier server-side hebben
// geverifieerd wie de ingelogde gebruiker daadwerkelijk is, zodat een klant nooit een andere
// klantrij dan zijn eigen account kan koppelen.
export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`account-koppel:${clientIp(request)}`, MAX_POGINGEN, VENSTER_MS);
  if (!rateLimit.toegestaan) {
    return teVeelPogingenResponse(rateLimit);
  }

  let authClient: ReturnType<typeof createServerAuthClient>;
  try {
    authClient = createServerAuthClient();
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Supabase is niet geconfigureerd." }, { status: 500 });
  }

  const {
    data: { user },
    error: authFout,
  } = await authClient.auth.getUser();

  if (authFout || !user || !user.email) {
    return Response.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  }

  let body: { naam?: unknown; bedrijf?: unknown; telefoon?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  const naam = typeof body.naam === "string" ? body.naam.trim() : "";
  const bedrijf = typeof body.bedrijf === "string" ? body.bedrijf.trim() : "";
  const telefoon = typeof body.telefoon === "string" ? body.telefoon.trim() : "";

  let supabase: ReturnType<typeof createServerSupabaseClient>;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Supabase is niet geconfigureerd." }, { status: 500 });
  }

  const { data: bestaandeKlant, error: zoekFout } = await supabase
    .from("klanten")
    .select("id, auth_user_id")
    .eq("email", user.email)
    .maybeSingle();

  if (zoekFout) {
    return Response.json({ ok: false, error: zoekFout.message }, { status: 500 });
  }

  if (bestaandeKlant) {
    if (bestaandeKlant.auth_user_id && bestaandeKlant.auth_user_id !== user.id) {
      // Zou niet moeten kunnen gebeuren (e-mailadres is al aan een ánder account gekoppeld) --
      // voorkomt in elk geval dat we per ongeluk een bestaand account "overnemen".
      return Response.json(
        { ok: false, error: "Dit e-mailadres is al aan een ander account gekoppeld." },
        { status: 409 }
      );
    }

    // Deze klantrij bestaat al (een eerdere gastaanvraag) en heeft dus al eigen gegevens/aanvragen
    // die na het koppelen zichtbaar worden op /mijn-borden. De EERSTE keer koppelen (auth_user_id
    // nog leeg) mag daarom alleen bij een BEVESTIGD e-mailadres -- staat e-mailbevestiging in het
    // Supabase-project uit (iets wat deze route zelf niet kan afdwingen), dan zou anders iedereen
    // met iemands e-mailadres kunnen inloggen en meteen diens aanvragen, adres en telefoonnummer
    // te zien krijgen. Is deze rij al aan dit account gekoppeld (een gewone, latere login), dan is
    // er niets opnieuw te bevestigen.
    if (!bestaandeKlant.auth_user_id && !user.email_confirmed_at) {
      return Response.json(
        { ok: false, error: "Bevestig eerst je e-mailadres via de link die je per mail hebt gekregen. Daarna koppelen we je account aan je eerdere aanvragen." },
        { status: 403 }
      );
    }

    // Geen velden overschrijven die nu leeg binnenkomen (bijvoorbeeld een gewone login, waarbij
    // naam/bedrijf/telefoon niet worden meegestuurd) -- anders zou een al bekende naam per ongeluk
    // leeggemaakt worden.
    const updateVelden: { auth_user_id: string; naam?: string; bedrijf?: string | null; telefoon?: string | null } = {
      auth_user_id: user.id,
    };
    if (naam) updateVelden.naam = naam;
    if (bedrijf) updateVelden.bedrijf = bedrijf;
    if (telefoon) updateVelden.telefoon = telefoon;

    const { error: updateFout } = await supabase.from("klanten").update(updateVelden).eq("id", bestaandeKlant.id);

    if (updateFout) {
      return Response.json({ ok: false, error: updateFout.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  }

  if (!naam) {
    return Response.json({ ok: false, error: "Naam is verplicht." }, { status: 400 });
  }

  const { error: insertFout } = await supabase.from("klanten").insert({
    naam,
    bedrijf: bedrijf || null,
    email: user.email,
    telefoon: telefoon || null,
    provincie: null,
    auth_user_id: user.id,
  });

  if (insertFout) {
    return Response.json({ ok: false, error: insertFout.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
