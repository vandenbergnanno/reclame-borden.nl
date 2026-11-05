// Next.js roept `register()` precies één keer aan bij het opstarten van de server (zowel bij
// `next dev` als `next start`) — de aangewezen plek om de achtergrondplanner voor automatische
// voorstel-e-mails te starten, zie lib/planning/scheduler.ts, en om Sentry te initialiseren.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    const { startGeplandeVoorstellenScheduler } = await import("./lib/planning/scheduler");
    startGeplandeVoorstellenScheduler();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = (...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>) =>
  import("@sentry/nextjs").then(({ captureRequestError }) => captureRequestError(...args));
