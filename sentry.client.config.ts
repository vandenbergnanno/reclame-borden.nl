import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://ea5301d9d7077d80b74db85bedcb66ea@o4512373999796224.ingest.de.sentry.io/4512378155958352",
  tracesSampleRate: 1.0,
});
