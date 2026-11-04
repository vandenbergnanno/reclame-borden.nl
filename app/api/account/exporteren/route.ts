import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { checkRateLimit, clientIp, teVeelPogingenResponse } from "@/lib/security/rateLimit";

const MAX_POGINGEN = 10;
const VENSTER_MS = 15 * 60 * 1000;

// AVG "recht op inzage": een klant kan zijn eigen gegevens als bestand opvragen. Bewust alleen
// zijn eigen profiel, zijn aanvragen en zijn eigen feedback daarop -- dat is wat hij zelf heeft
// aangeleverd/ingevuld. Interne verwerkingsgegevens (content_checks, designs, verstuurde e-mails)
// horen niet bij "zijn eigen gegevens" in deze zin en blijven hier dus buiten beschouwing.
export async function GET(request: Request) {
  const rateLimit = await checkRateLimit(`account-exporteren:${clientIp(request)}`, MAX_POGINGEN, VENSTER_MS);
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

  const { data: klant, error: klantFout } = await supabase
    .from("klanten")
    .select("id, naam, bedrijf, email, telefoon, provincie, created_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (klantFout) {
    return Response.json({ ok: false, error: klantFout.message }, { status: 500 });
  }
  if (!klant) {
    return Response.json({ ok: false, error: "Geen klantgegevens gevonden bij dit account." }, { status: 404 });
  }

  const { data: aanvragen, error: aanvragenFout } = await supabase
    .from("aanvragen")
    .select(
      "id, afmeting, aantal, bedrukking, levering, straat, postcode, plaats, opmerking, status, created_at"
    )
    .eq("klant_id", klant.id)
    .order("created_at", { ascending: false });

  if (aanvragenFout) {
    return Response.json({ ok: false, error: aanvragenFout.message }, { status: 500 });
  }

  const aanvraagIds = (aanvragen ?? []).map((aanvraag) => aanvraag.id);
  const { data: feedback, error: feedbackFout } =
    aanvraagIds.length > 0
      ? await supabase
          .from("feedback")
          .select("aanvraag_id, goedgekeurd, feedbacktekst, created_at")
          .in("aanvraag_id", aanvraagIds)
      : { data: [], error: null };

  if (feedbackFout) {
    return Response.json({ ok: false, error: feedbackFout.message }, { status: 500 });
  }

  const export_ = {
    geexporteerdOp: new Date().toISOString(),
    profiel: klant,
    aanvragen,
    feedback,
  };

  return new Response(JSON.stringify(export_, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mijn-gegevens-de-mediagraaf.json"`,
    },
  });
}
