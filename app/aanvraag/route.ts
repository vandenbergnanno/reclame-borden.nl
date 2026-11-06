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
// /mijn-borden kan terugzien. Geen sessie? Dan terug naar /inloggen, met een link terug hierheen
// zodat de klant na het inloggen/account aanmaken gewoon verdergaat waar hij gebleven was.
export async function GET() {
  const supabase = createServerAuthClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/inloggen?daarna=/aanvraag");

  const html = await readFile(path.join(process.cwd(), "lib/ontwerptool/reclamebord-maker.html"), "utf-8");
  const metSiteKey = html.replace("__TURNSTILE_SITE_KEY__", process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "");
  return new Response(metSiteKey, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
