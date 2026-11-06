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
export async function verifieerTurnstile(token: string, ip: string): Promise<boolean> {
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
  if (!token) return false;

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.warn("Turnstile-verificatie mislukt (Cloudflare onbereikbaar?), verzoek toch doorgelaten:", err);
    return true;
  }
}
