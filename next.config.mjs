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

export default nextConfig;
