// Simpele in-memory rate limiter, bewust zonder externe afhankelijkheid (Redis/Upstash) — prima
// voor één Node-proces (`next dev`/`next start`), maar telt niet mee over meerdere instanties
// heen. Bij een serverless/multi-instance deployment moet dit vervangen worden door een gedeelde
// store (zie TODO in PROGRESS.md), anders telt elke instantie los en is de limiet feitelijk hoger
// dan bedoeld.
//
// Het venster leeft in `globalThis` zodat het Next.js' hot-reloads in dev overleeft (zelfde patroon
// als lib/planning/scheduler.ts).
declare global {
  // eslint-disable-next-line no-var
  var __rateLimitVensters: Map<string, { aantal: number; resetOp: number }> | undefined;
}

function haalVensters(): Map<string, { aantal: number; resetOp: number }> {
  if (!globalThis.__rateLimitVensters) {
    globalThis.__rateLimitVensters = new Map();
  }
  return globalThis.__rateLimitVensters;
}

// Voorkomt dat de Map onbeperkt blijft groeien door IP's die maar één keer langskomen: ruimt
// verlopen vensters op zodra de Map te groot wordt, in plaats van bij elke aanroep (zou bij veel
// verkeer zelf een kostenpost worden).
function ruimVerlopenVenstersOp(vensters: Map<string, { aantal: number; resetOp: number }>, nu: number) {
  if (vensters.size < 1000) return;
  for (const [sleutel, venster] of vensters) {
    if (venster.resetOp <= nu) vensters.delete(sleutel);
  }
}

export interface RateLimitResultaat {
  toegestaan: boolean;
  resterend: number;
  resetOverSeconden: number;
}

// Vast venster (fixed window) per sleutel: `limiet` pogingen per `vensterMs`. Simpel en voorspelbaar
// genoeg voor dit doel (brute-force/spam afremmen, niet exact rate-limiten).
export function checkRateLimit(sleutel: string, limiet: number, vensterMs: number): RateLimitResultaat {
  const vensters = haalVensters();
  const nu = Date.now();
  ruimVerlopenVenstersOp(vensters, nu);

  const bestaand = vensters.get(sleutel);

  if (!bestaand || bestaand.resetOp <= nu) {
    vensters.set(sleutel, { aantal: 1, resetOp: nu + vensterMs });
    return { toegestaan: true, resterend: limiet - 1, resetOverSeconden: Math.ceil(vensterMs / 1000) };
  }

  if (bestaand.aantal >= limiet) {
    return { toegestaan: false, resterend: 0, resetOverSeconden: Math.ceil((bestaand.resetOp - nu) / 1000) };
  }

  bestaand.aantal += 1;
  return {
    toegestaan: true,
    resterend: limiet - bestaand.aantal,
    resetOverSeconden: Math.ceil((bestaand.resetOp - nu) / 1000),
  };
}

// Haalt het client-IP uit de headers die een reverse proxy (Vercel, nginx, ...) meestuurt. Lokaal
// (geen proxy ertussen) is deze header meestal leeg — dan valt alles terug op dezelfde sleutel,
// wat voor lokaal testen geen probleem is.
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "onbekend";
}

export function teVeelPogingenResponse(resultaat: RateLimitResultaat) {
  return new Response(
    JSON.stringify({ ok: false, error: "Te veel pogingen. Probeer het over een paar minuten opnieuw." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(resultaat.resetOverSeconden),
      },
    }
  );
}
