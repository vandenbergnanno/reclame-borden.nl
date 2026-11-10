import { readFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// De reclamebord-maker (zelfbedieningsontwerptool) is een los, volledig zelfstandig vanilla-
// JS/HTML/CSS-bestand (eigen <style>/<script>, eigen canvas-editor, eigen PDF-generator) — geen
// React-component, dus bewust géén page.tsx hier. Deze route serveert het bestand gewoon
// letterlijk als HTML; de tool zelf regelt verder alles client-side.
//
// AANVRAAG_URL staat in het bestand zelf op "/api/aanvragen/ontwerp" -- de tool stuurt een
// aanvraag dus echt naar die route (geen testmodus meer).
//
// De ontwerptool is alleen voor klanten met een account: zonder dat zou iemand een bord kunnen
// ontwerpen en versturen zonder dat wij weten van wie het is, en zonder dat de klant het later op
// /mijn-borden kan terugzien. Geen sessie? Dan naar /account-aanmaken (niet /inloggen) -- wie hier
// voor het eerst komt heeft vrijwel nooit al een account, dus "account aanmaken" is het logische
// startpunt (met een link naar inloggen voor wie dat wél heeft, zie KlantLoginForm). `daarna`
// zorgt dat je na het aanmaken/inloggen gewoon verdergaat waar je was.
// Simpele HTML-escape voor de waardes die hieronder in attributen terechtkomen (naam/bedrijf/
// telefoon van de klant) -- die komen uit de database, niet van deze aanvraag zelf, maar een
// klant kan ooit bij het aanmaken van zijn account iets als `"><script>` als bedrijfsnaam hebben
// ingevuld. Zonder dit zou dat zijn eigen ontwerppagina kunnen breken.
function escapeHtmlAttribuut(waarde: string): string {
  return waarde.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Een JSON-waarde veilig in een inline <script>-tag zetten: JSON.stringify ontsnapt "<" niet, dus
// een letterlijke "</script" in bijv. een tekstveld zou de tag anders voortijdig afsluiten.
function naarInlineJson(waarde: unknown): string {
  return JSON.stringify(waarde).replace(/</g, "\\u003C");
}

export async function GET(request: Request) {
  const supabase = createServerAuthClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/account-aanmaken?daarna=/aanvraag");

  // Je bent al ingelogd, dus je naam/bedrijf/e-mail/telefoon staan al bij ons bekend -- die hoef
  // je niet opnieuw in te typen (zie de velden "Je gegevens" in het bestand hieronder, die deze
  // placeholders al als startwaarde hebben staan). Ontbreekt er nog een klantenrij (zou niet meer
  // moeten voorkomen nu /api/account/koppel bij elke login/signup draait, maar voor de
  // zekerheid), dan blijven de velden gewoon leeg zoals voorheen.
  const { data: klant } = await supabase.from("klanten").select("id, naam, bedrijf, telefoon").eq("auth_user_id", data.user.id).maybeSingle();

  // ?bewerk=<aanvraagId>: de klant past een al ingediende aanvraag aan (zie /mijn-borden en
  // app/api/aanvragen/[id]/klant-bewerken/route.ts). Alleen toegestaan voor zijn EIGEN aanvraag,
  // en alleen zolang die nog status "nieuw" heeft -- geen van beide een harde fout als het niet
  // klopt, dan laden we gewoon een lege tool (de klant kan toch nooit meer bereiken dan hij al kon).
  const bewerkId = new URL(request.url).searchParams.get("bewerk");
  let bewerkData: Record<string, unknown> | null = null;

  if (bewerkId && klant) {
    const serviceClient = createServerSupabaseClient();
    const { data: aanvraag } = await serviceClient.from("aanvragen").select("*").eq("id", bewerkId).maybeSingle();

    if (aanvraag && aanvraag.klant_id === klant.id && aanvraag.status === "nieuw" && aanvraag.ontwerp_pad) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "aanvraag-bijlagen";
      const { data: bestand } = await serviceClient.storage.from(bucket).download(aanvraag.ontwerp_pad);
      if (bestand) {
        try {
          const ontwerp = JSON.parse(await bestand.text());
          bewerkData = {
            ontwerp,
            bordnaam: aanvraag.bordnaam,
            aantal: aanvraag.aantal,
            bedrukking: aanvraag.bedrukking,
            kromtrekken: aanvraag.kromtrekken,
            levering: aanvraag.levering,
            straat: aanvraag.straat,
            postcode: aanvraag.postcode,
            plaats: aanvraag.plaats,
            opmerking: aanvraag.opmerking,
          };
        } catch {
          // Ontwerpbestand kon niet gelezen worden -- dan laden we gewoon een lege tool in plaats
          // van de klant op een fout te laten stranden.
        }
      }
    }
  }

  const html = await readFile(path.join(process.cwd(), "lib/ontwerptool/reclamebord-maker.html"), "utf-8");
  const metGegevens = html
    // Publieke anon-key (mag in de browser, zelfde sleutel als lib/supabase/browserClient.ts) --
    // nodig voor de directe upload naar Supabase Storage (zie laadUploadToken() in het bestand
    // hieronder). De signed URL die /api/aanvragen/upload-url teruggeeft bevat zelf al het
    // bucket+pad, dus de ontwerptool heeft verder geen Supabase-SDK of projectURL nodig.
    .replace("__SUPABASE_ANON_KEY__", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "")
    .replace("__KLANT_NAAM__", escapeHtmlAttribuut(klant?.naam ?? ""))
    .replace("__KLANT_BEDRIJF__", escapeHtmlAttribuut(klant?.bedrijf ?? ""))
    .replace("__KLANT_EMAIL__", escapeHtmlAttribuut(data.user.email ?? ""))
    .replace("__KLANT_TELEFOON__", escapeHtmlAttribuut(klant?.telefoon ?? ""))
    .replace("__BEWERK_AANVRAAG_ID__", bewerkData ? bewerkId! : "")
    .replace("__BEWERK_DATA_JSON__", () => naarInlineJson(bewerkData));
  return new Response(metGegevens, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
