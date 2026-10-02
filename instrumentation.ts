// Next.js roept `register()` precies één keer aan bij het opstarten van de server (zowel bij
// `next dev` als `next start`) — de aangewezen plek om de achtergrondplanner voor automatische
// voorstel-e-mails te starten, zie lib/planning/scheduler.ts.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startGeplandeVoorstellenScheduler } = await import("./lib/planning/scheduler");
    startGeplandeVoorstellenScheduler();
  }
}
