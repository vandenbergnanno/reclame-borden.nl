import { createServerSupabaseClient, isSupabaseGeconfigureerd } from "@/lib/supabase/server";

// Gedeelde rate limiter: telt pogingen in een Supabase-tabel (zie supabase/migrations/0004_rate_limiet.sql)
// zodat de limiet klopt over meerdere serverinstanties heen en een herstart overleeft. Zonder
// Supabase-project (lokaal, voordat er een gekoppeld is) valt dit terug op een in-memory teller —
// genoeg om lokaal te testen, maar telt dan niet mee over meerdere instanties/herstarts, dus nooit
// de enige verdediging in productie. Een storing in Supabase zelf mag een aanvraag/login nooit
// blokkeren: dan valt een los verzoek ook terug op de in-memory teller (fail-open, niet fail-closed
// op een tijdelijke databaseconnectieprobleem).
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
function checkRateLimitInMemory(sleutel: string, limiet: number, vensterMs: number): RateLimitResultaat {
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
    toegestaan: bestaand.aantal <= limiet,
    resterend: Math.max(0, limiet - bestaand.aantal),
    resetOverSeconden: Math.ceil((bestaand.resetOp - nu) / 1000),
  };
}

// Dezelfde telling, maar atomisch bijgehouden in Postgres (zie de rate_limit_tik-functie in de
// migratie): één enkele upsert-statement, dus twee gelijktijdige verzoeken met dezelfde sleutel
// kunnen elkaar niet inhalen (geen read-then-write race condition).
async function checkRateLimitGedeeld(sleutel: string, limiet: number, vensterMs: number): Promise<RateLimitResultaat> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .rpc("rate_limit_tik", { p_sleutel: sleutel, p_venster_ms: vensterMs })
    .single();

  if (error || !data) {
    throw error ?? new Error("Geen resultaat van rate_limit_tik.");
  }

  const resetOp = new Date(data.reset_op).getTime();
  const resetOverSeconden = Math.max(0, Math.ceil((resetOp - Date.now()) / 1000));
  return {
    toegestaan: data.aantal <= limiet,
    resterend: Math.max(0, limiet - data.aantal),
    resetOverSeconden,
  };
}

export async function checkRateLimit(sleutel: string, limiet: number, vensterMs: number): Promise<RateLimitResultaat> {
  if (isSupabaseGeconfigureerd()) {
    try {
      return await checkRateLimitGedeeld(sleutel, limiet, vensterMs);
    } catch (err) {
      console.warn("Rate limiet via Supabase mislukt, val terug op in-memory voor dit verzoek:", err);
    }
  }
  return checkRateLimitInMemory(sleutel, limiet, vensterMs);
}

// Haalt een betrouwbaar client-IP op: nooit een waarde die de bezoeker zelf kan meesturen.
//
// 1) `request.ip`: op Vercel zet het platform dit zelf op het request-object, buiten bereik van de
//    bezoeker. Next.js geeft elke App Router-routehandler er in werkelijkheid altijd een
//    NextRequest-achtig object aan (ook als de parameter hier als het generieke Request-type
//    gedeclareerd staat) — op Vercel heeft dat object dus een `.ip`, ongeacht hoe de aanroepende
//    routefunctie zijn parameter typeert.
// 2) Draait de app op Vercel (process.env.VERCEL, door het platform zelf gezet) maar is `.ip` om
//    wat voor reden dan ook leeg: `x-real-ip`, want Vercel's edge zet die header zelf en overschrijft
//    'm altijd -- een bezoeker kan hier niets in meesturen dat Vercel laat staan.
// 3) EIGEN_REVERSE_PROXY=true in de omgevingsvariabelen (zie .env.example): een expliciete, bewuste
//    bevestiging dat er een zelf ingerichte reverse proxy vóór deze app staat die x-forwarded-for
//    correct aanvult. In dat geval het MEEST RECHTSE adres in die lijst: een proxy voegt zijn eigen
//    waarneming altijd toe aan het EIND van de lijst, en wat een bezoeker er zelf vóór in zet
//    verandert daar niets aan -- het laatste adres is dus altijd wat de proxy zelf heeft gezien.
// 4) Geen van bovenstaande (bijv. lokaal `next dev`, of zelf gehost zonder EIGEN_REVERSE_PROXY
//    expliciet aangezet): een vaste sleutel, want zonder een bevestigd vertrouwde proxy ertussen is
//    elke binnenkomende header (ook x-forwarded-for/x-real-ip) rechtstreeks door de bezoeker te
//    verzinnen. Dat is bewust conservatief (zoals Express' `trust proxy`, standaard uit) -- beter een
//    iets grovere limiet die niet te omzeilen is, dan headers vertrouwen die niemand heeft
//    gegarandeerd.
//
// Kortom: elke waarde hier komt van bevestigde infrastructuur (platform, of een expliciet
// vertrouwde eigen proxy), nooit rechtstreeks van de eerste, door de bezoeker gecontroleerde
// schakel in de keten -- en bij twijfel liever helemaal niets van de bezoeker vertrouwen.
export function clientIp(request: Request): string {
  const metIp = request as Request & { ip?: string | null };
  if (typeof metIp.ip === "string" && metIp.ip) return metIp.ip;

  const opVercel = process.env.VERCEL === "1";
  const eigenProxyVertrouwd = process.env.EIGEN_REVERSE_PROXY === "true";
  if (!opVercel && !eigenProxyVertrouwd) return "geen-vertrouwde-proxy";

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();

  if (eigenProxyVertrouwd) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const delen = forwarded
        .split(",")
        .map((deel) => deel.trim())
        .filter(Boolean);
      if (delen.length) return delen[delen.length - 1];
    }
  }

  return "onbekend";
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
