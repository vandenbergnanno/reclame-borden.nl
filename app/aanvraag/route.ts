import { readFile } from "node:fs/promises";
import path from "node:path";

// De reclamebord-maker (zelfbedieningsontwerptool) is een los, volledig zelfstandig vanilla-
// JS/HTML/CSS-bestand (eigen <style>/<script>, eigen canvas-editor, eigen PDF-generator) — geen
// React-component, dus bewust géén page.tsx hier. Deze route serveert het bestand gewoon
// letterlijk als HTML; de tool zelf regelt verder alles client-side.
//
// AANVRAAG_URL staat in het bestand zelf op leeg, dus de tool draait in zijn eigen ingebouwde
// testmodus (toont "Testversie: er is niets verstuurd" bij versturen) — er is bewust nog geen
// koppeling met een backend/API hier.
export async function GET() {
  const html = await readFile(path.join(process.cwd(), "lib/ontwerptool/reclamebord-maker.html"), "utf-8");
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
