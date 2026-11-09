import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";
import { logServerFout, GENERIEKE_SERVERFOUT } from "@/lib/security/serverFout";

// Een ingelogde klant kan deze route herhaaldelijk aanroepen -- zelfde voorzichtigheid als bij
// /api/account/koppel.
const MAX_POGINGEN = 10;
const VENSTER_MS = 15 * 60 * 1000;

// De klant past zijn eigen naam/bedrijf/telefoon aan op /mijn-account. E-mail staat hier bewust
// niet bij: dat is de Supabase Auth-identiteit, met een eigen (niet hier geïmplementeerd)
// wijzigingstraject dat e-mailbevestiging vereist.
export async function PATCH(request: Request) {
  const rateLimit = await checkRateLimit(`account-bijwerken:${clientIp(request)}`, MAX_POGINGEN, VENSTER_MS);
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
  } = await authClient.auth.getUser();

  if (!user) {
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

  let supabase: ReturnType<typeof createServerSupabaseClient>;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Supabase is niet geconfigureerd." }, { status: 500 });
  }

  // Service-role: RLS heeft bewust geen update-policy voor klanten (zie
  // supabase/migrations/0003_klant_accounts.sql) -- maar alleen NADAT hierboven is geverifieerd
  // wie de ingelogde gebruiker daadwerkelijk is, zodat een klant alleen zijn eigen rij kan
  // bijwerken.
  const { error: updateFout } = await supabase
    .from("klanten")
    .update({ naam, bedrijf: bedrijf || null, telefoon: telefoon || null })
    .eq("auth_user_id", user.id);

  if (updateFout) {
    logServerFout("account/bijwerken: klant bijwerken", updateFout);
    return Response.json({ ok: false, error: GENERIEKE_SERVERFOUT }, { status: 500 });
  }

  return Response.json({ ok: true });
}
