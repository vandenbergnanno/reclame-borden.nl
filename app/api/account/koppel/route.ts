import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";

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
  const authClient = createServerAuthClient();
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

  if (!naam) {
    return Response.json({ ok: false, error: "Naam is verplicht." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

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

    const { error: updateFout } = await supabase
      .from("klanten")
      .update({ auth_user_id: user.id, naam, bedrijf: bedrijf || null, telefoon: telefoon || null })
      .eq("id", bestaandeKlant.id);

    if (updateFout) {
      return Response.json({ ok: false, error: updateFout.message }, { status: 500 });
    }

    return Response.json({ ok: true });
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
