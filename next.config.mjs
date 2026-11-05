import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  // Basis-beveiligingsheaders voor alle routes. Bewust GEEN Content-Security-Policy hier: Next.js'
  // eigen dev-server (Fast Refresh) heeft 'unsafe-eval' nodig, en een CSP die dat per ongeluk mist
  // breekt de hele dev-omgeving. Een CSP toevoegen kan prima bij een echte deployment, maar dan met
  // een nonce-aanpak die productie en dev apart behandelt — zie PROGRESS.md.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Browsers negeren deze header over gewoon HTTP (zoals lokaal) — pas relevant zodra dit
          // ooit over HTTPS gedeployed wordt.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Alleen build-logging van Sentry's eigen webpack-plugin onderdrukken, geen invloed op de app zelf.
  silent: true,
  org: "reclame-bordennl",
  project: "javascript-nextjs",
  // Geen auth token geconfigureerd (zie .env.example) -- source maps worden dan niet geüpload naar
  // Sentry, stacktraces blijven wel werken maar tonen geminificeerde code. Later toe te voegen via
  // SENTRY_AUTH_TOKEN zodra er een deployment is.
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
});
