import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://ea5301d9d7077d80b74db85bedcb66ea@o4512373999796224.ingest.de.sentry.io/4512378155958352",
  tracesSampleRate: 1.0,
  // Zonder dit voegt Sentry automatisch "sentry-trace"/"baggage"-headers toe aan élke uitgaande
  // fetch (ook naar Supabase), met de paginatitel als waarde -- onze titels bevatten een
  // gedachtestreepje ("Account aanmaken — reclame-borden.nl"), en dat is geen geldig HTTP-
  // headerteken. Resultaat: "Account aanmaken" crashte met "String contains non ISO-8859-1 code
  // point" zodra de pagina probeerde in te loggen bij Supabase. Een lege lijst betekent: geen
  // enkel adres krijgt deze tracing-headers (we missen dan wel gekoppelde traces, maar dat is in
  // deze fase geen gemis -- werkend inloggen/registreren weegt zwaarder).
  tracePropagationTargets: [],
});
