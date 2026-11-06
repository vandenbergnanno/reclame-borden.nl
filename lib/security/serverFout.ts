import * as Sentry from "@sentry/nextjs";

// Onverwachte server-/databasefouten (Supabase/Postgres) gaan hier doorheen in plaats van dat
// error.message rechtstreeks naar de bezoeker gaat -- een rauwe Postgres-foutmelding kan
// kolomnamen of querystructuur verraden, en zegt een klant/bezoeker sowieso niets. De echte fout
// wordt wel gelogd (console + Sentry), zodat 'm alsnog kunnen onderzoeken.
export function logServerFout(context: string, fout: unknown): void {
  console.error(`[${context}]`, fout);
  Sentry.captureException(fout instanceof Error ? fout : new Error(`${context}: ${JSON.stringify(fout)}`));
}

export const GENERIEKE_SERVERFOUT = "Er ging iets mis. Probeer het later opnieuw.";
