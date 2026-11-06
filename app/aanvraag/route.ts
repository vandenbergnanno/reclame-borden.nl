import { readFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/serverAuth";

// De reclamebord-maker (zelfbedieningsontwerptool) is een los, volledig zelfstandig vanilla-
// JS/HTML/CSS-bestand (eigen <style>/<script>, eigen canvas-editor, eigen PDF-generator) — geen
// React-component, dus bewust géén page.tsx hier. Deze route serveert het bestand gewoon
// letterlijk als HTML; de tool zelf regelt verder alles client-side.
//
// AANVRAAG_URL staat in het bestand zelf op "/api/aanvragen/ontwerp" -- de tool stuurt een
// aanvraag dus echt naar die route (geen testmodus meer).
//
// De enige server-kant bemoeienis hier is het invullen van de publieke Turnstile-sitekey (zie
// NEXT_PUBLIC_TURNSTILE_SITE_KEY in .env.example): die staat in het HTML-bestand zelf als
// placeholder, omdat het bestand verder letterlijk/statisch wordt geserveerd en dus geen eigen
// manier heeft om env-variabelen te lezen. Zonder ingevulde sitekey blijft de placeholder leeg,
// en doet de Turnstile-widget in de tool niets (zie laadTurnstile() daar) -- de server-kant
// check in /api/aanvragen/ontwerp accepteert dan ook alles, zolang TURNSTILE_SECRET_KEY óók leeg is.
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

export async function GET() {
  const supabase = createServerAuthClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/account-aanmaken?daarna=/aanvraag");

  // Je bent al ingelogd, dus je naam/bedrijf/e-mail/telefoon staan al bij ons bekend -- die hoef
  // je niet opnieuw in te typen (zie de velden "Je gegevens" in het bestand hieronder, die deze
  // placeholders al als startwaarde hebben staan). Ontbreekt er nog een klantenrij (zou niet meer
  // moeten voorkomen nu /api/account/koppel bij elke login/signup draait, maar voor de
  // zekerheid), dan blijven de velden gewoon leeg zoals voorheen.
  const { data: klant } = await supabase.from("klanten").select("naam, bedrijf, telefoon").eq("auth_user_id", data.user.id).maybeSingle();

  const html = await readFile(path.join(process.cwd(), "lib/ontwerptool/reclamebord-maker.html"), "utf-8");
  const metGegevens = html
    .replace("__TURNSTILE_SITE_KEY__", process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "")
    .replace("__KLANT_NAAM__", escapeHtmlAttribuut(klant?.naam ?? ""))
    .replace("__KLANT_BEDRIJF__", escapeHtmlAttribuut(klant?.bedrijf ?? ""))
    .replace("__KLANT_EMAIL__", escapeHtmlAttribuut(data.user.email ?? ""))
    .replace("__KLANT_TELEFOON__", escapeHtmlAttribuut(klant?.telefoon ?? ""));
  return new Response(metGegevens, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
