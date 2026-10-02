import { isSupabaseGeconfigureerd } from "@/lib/supabase/server";
import { verwerkGeplandeVoorstellen } from "./verwerkGeplandeVoorstellen";

// Elke minuut checken is vaak genoeg om een voorstel nooit veel later dan het geplande tijdstip
// (45-60 min na indienen, zie voorstelPlanning.ts) te versturen, zonder de database onnodig vaak
// te bevragen.
const CONTROLE_INTERVAL_MS = 60_000;

declare global {
  // eslint-disable-next-line no-var -- enige manier om dit over Next.js' hot-reloads heen te laten overleven.
  var __geplandeVoorstellenSchedulerGestart: boolean | undefined;
}

// Start een achtergrondtaak die periodiek nagaat of er aanvragen zijn waarvan het geplande
// voorstel-tijdstip verstreken is, en zo ja, meteen het concept genereert en mailt — zodat dit
// niet langer via de handmatige testknop hoeft.
//
// BELANGRIJK: dit werkt alleen zo lang het Node.js-proces blijft draaien (prima voor `next dev` en
// `next start` op een gewone server/VM/container). Op serverless hosting zoals Vercel spint elke
// function apart op en blijft niet continu draaien — zodra dit project daar wordt gedeployed, moet
// dit alsnog vervangen worden door een echte scheduler (Vercel Cron / Supabase pg_cron) die
// POST /api/aanvragen/verwerk-geplande-voorstellen aanroept (zie de TODO daar).
export function startGeplandeVoorstellenScheduler() {
  if (globalThis.__geplandeVoorstellenSchedulerGestart) return;
  globalThis.__geplandeVoorstellenSchedulerGestart = true;

  console.log(`[scheduler] achtergrondplanner gestart (controleert elke ${CONTROLE_INTERVAL_MS / 1000}s)`);

  let bezig = false;

  setInterval(() => {
    if (bezig || !isSupabaseGeconfigureerd()) return;
    bezig = true;

    verwerkGeplandeVoorstellen()
      .then(({ verwerkt, mislukt }) => {
        if (verwerkt.length > 0 || mislukt.length > 0) {
          console.log(
            `[scheduler] geplande voorstellen verwerkt: ${verwerkt.length}, mislukt: ${mislukt.length}`
          );
        }
      })
      .catch((error) => {
        console.error("[scheduler] verwerken van geplande voorstellen mislukt:", error);
      })
      .finally(() => {
        bezig = false;
      });
  }, CONTROLE_INTERVAL_MS);
}
