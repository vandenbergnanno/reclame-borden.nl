import * as Sentry from "@sentry/nextjs";

// Gedeelde Cloudflare Turnstile-verificatie, gebruikt door elk formulier dat een bot-check nodig
// heeft (ontwerptool-aanvraag, medewerker-login, klant-login). Oorspronkelijk alleen in
// app/api/aanvragen/ontwerp/route.ts, hierheen verplaatst zodat /api/intern/login en
// /api/klant/login 'm kunnen hergebruiken in plaats van de logica te dupliceren.
//
// Ontbreekt TURNSTILE_SECRET_KEY (zie .env.example), dan hangt het gedrag af van de omgeving:
// - in productie (NODE_ENV=production) is dat een configuratiefout, geen "nog niet ingesteld" --
//   we weigeren dan elk verzoek en loggen een duidelijke fout, in plaats van stilzwijgend alles
//   door te laten (hier gaat het om de enige verdediging tegen geautomatiseerde aanvallen, dus
//   "geen sleutel" mag nooit onopgemerkt "geen controle" betekenen);
// - in development (`next dev`) laten we het verzoek wel door, met een duidelijke waarschuwing in
//   de serverconsole, zodat lokaal ontwikkelen zonder Cloudflare-account (of zonder de officiële
//   testsleutels uit .env.example) niet meteen vastloopt.
//
// Is Cloudflare zelf even onbereikbaar (de sleutel is wél ingesteld, maar het verificatieverzoek
// zelf mislukt), dan laten we het verzoek wel door (fail-open) -- een storing bij Cloudflare mag
// nooit alle klanten/medewerkers blokkeren.
// `context`: alleen voor logging/Sentry (bijv. "ontwerp", "klant-login") -- zodat een afwijzing in
// Sentry meteen laat zien WELK formulier het was én WAAROM (leeg token vs. een concrete
// Cloudflare-foutcode), in plaats van dat we daar steeds blind naar moeten gokken.
export async function verifieerTurnstile(token: string, ip: string, context: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "TURNSTILE_SECRET_KEY ontbreekt in productie -- verzoeken worden geweigerd totdat dit is ingesteld (zie .env.example)."
      );
      return false;
    }
    console.warn(
      "TURNSTILE_SECRET_KEY is niet ingesteld -- de bot-check wordt overgeslagen (alleen toegestaan buiten productie, zie .env.example)."
    );
    return true;
  }
  if (!token) {
    Sentry.captureMessage(`Turnstile [${context}]: geen token meegestuurd door de klant`, {
      level: "warning",
      extra: { ip },
    });
    return false;
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await response.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success !== true) {
      Sentry.captureMessage(`Turnstile [${context}]: Cloudflare wees het token af`, {
        level: "warning",
        extra: { ip, errorCodes: data["error-codes"] },
      });
    }
    return data.success === true;
  } catch (err) {
    console.warn("Turnstile-verificatie mislukt (Cloudflare onbereikbaar?), verzoek toch doorgelaten:", err);
    return true;
  }
}
