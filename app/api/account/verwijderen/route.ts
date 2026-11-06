import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";
import { logServerFout, GENERIEKE_SERVERFOUT } from "@/lib/security/serverFout";

const MAX_POGINGEN = 5;
const VENSTER_MS = 15 * 60 * 1000;

// AVG "recht op vergetelheid" voor klant-accounts. Optie A (bewust gekozen door reclame-borden.nl):
// de aanvragen zelf blijven bestaan -- nodig voor garantie/boekhouding, en toegestaan onder de
// AVG zolang ze niet meer aan de persoon te herleiden zijn -- maar de koppeling met het account
// en het account zelf (Supabase Auth) worden verwijderd. Een klant kan na deze actie niet meer
// inloggen en ziet op /mijn-borden niets meer, maar reclame-borden.nl intern wel (zie /intern/klanten).
export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(`account-verwijderen:${clientIp(request)}`, MAX_POGINGEN, VENSTER_MS);
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

  if (authFout || !user) {
    return Response.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  }

  let supabase: ReturnType<typeof createServerSupabaseClient>;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Supabase is niet geconfigureerd." }, { status: 500 });
  }

  // Eerst loskoppelen (de klantrij met zijn aanvragen blijft gewoon bestaan), pas daarna het
  // Auth-account echt verwijderen -- in die volgorde kan er nooit een wees-koppeling overblijven
  // als de tweede stap om wat voor reden dan ook mislukt.
  const { error: ontkoppelFout } = await supabase
    .from("klanten")
    .update({ auth_user_id: null })
    .eq("auth_user_id", user.id);

  if (ontkoppelFout) {
    logServerFout("account/verwijderen: ontkoppelen", ontkoppelFout);
    return Response.json({ ok: false, error: GENERIEKE_SERVERFOUT }, { status: 500 });
  }

  const { error: verwijderFout } = await supabase.auth.admin.deleteUser(user.id);

  if (verwijderFout) {
    logServerFout("account/verwijderen: account verwijderen", verwijderFout);
    return Response.json({ ok: false, error: GENERIEKE_SERVERFOUT }, { status: 500 });
  }

  return Response.json({ ok: true });
}
