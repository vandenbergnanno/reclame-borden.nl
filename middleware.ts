import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { INTERN_SESSIE_COOKIE } from "@/lib/auth/internSessie";

// Expliciete allowlist van routes onder /api/aanvragen/* die een klant zonder /intern-login moet
// kunnen bereiken: het indienen van een nieuwe aanvraag, en het goedkeuren/afwijzen van een
// voorstel via de link in de e-mail. Alles anders onder /api/aanvragen/* (status wijzigen, een
// concept/e-mail aanpassen, de geplande-voorstellen-batch handmatig verwerken, en elke toekomstige
// route die hier nog bij komt) is standaard afgeschermd — een nieuwe route moet hier expliciet aan
// toegevoegd worden om publiek te zijn, in plaats van dat je moet onthouden om 'm aan een
// bescherm-lijst toe te voegen. Dat laatste ging eerder mis: twee PATCH-routes (designs/emails)
// bleken na toevoegen niet te matchen met de matcher-syntax van losse :id/:designId-segmenten, en
// de testknop-route (verwerk-geplande-voorstellen) stond per ongeluk helemaal nooit in de lijst.
function isPubliekeAanvragenRoute(method: string, pathname: string): boolean {
  if (pathname === "/api/aanvragen") return method === "POST";
  if (/^\/api\/aanvragen\/[^/]+\/feedback$/.test(pathname)) return method === "POST";
  // De reclamebord-maker (zelfbedieningsontwerptool op /aanvraag) dient een aanvraag hierheen in
  // (POST) en vraagt daarvoor eerst de uploadgrenzen van de server op (GET ?limiet=1) — zie
  // vraagLimietOp() in lib/ontwerptool/reclamebord-maker.html.
  if (pathname === "/api/aanvragen/ontwerp") return method === "POST" || method === "GET";
  // Een klant past zijn eigen, nog "nieuw"-status-aanvraag aan (zie app/api/aanvragen/[id]/klant-
  // bewerken/route.ts) -- die route doet zijn EIGEN klant-sessie-/eigenaarschap-/statuscontrole,
  // dit laat 'm alleen voorbij de medewerkers-wachtwoordpoort hieronder.
  if (/^\/api\/aanvragen\/[^/]+\/klant-bewerken$/.test(pathname)) return method === "PATCH";
  return false;
}

// Ververst de Supabase-sessiecookies van de klant (ingeloggen/inloggen) op elke request. Een
// Server Component mag zelf geen cookies zetten (zie lib/supabase/serverAuth.ts) -- zonder dit
// zou een verlopen toegangstoken daar wel ververst worden voor die ene aanvraag, maar de nieuwe
// cookies nooit teruggeschreven worden naar de browser. Bij token-rotatie (standaard bij Supabase
// Auth) maakt dat het oude, inmiddels ingetrokken refreshtoken de volgende keer ongeldig -- de
// klant wordt dan zonder duidelijke reden uitgelogd. Alleen relevant voor de klant-routes; /intern
// gebruikt een heel ander, eigen sessiesysteem (zie INTERN_SESSIE_COOKIE) en heeft dit niet nodig.
async function verversSupabaseSessie(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Het resultaat zelf is hier niet nodig (dat leest elke pagina apart via createServerAuthClient);
  // deze aanroep bestaat puur om Supabase de kans te geven een verlopen token te verversen en de
  // nieuwe cookies via setAll() hierboven op de response te zetten. Moet afgewacht worden: setAll()
  // herschrijft `response` pas zodra deze aanroep klaar is.
  await supabase.auth.getUser();
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/inloggen" || pathname === "/mijn-borden" || pathname === "/mijn-account" || pathname === "/account-aanmaken") {
    return await verversSupabaseSessie(request);
  }

  if (pathname === "/intern/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/aanvragen") && isPubliekeAanvragenRoute(request.method, pathname)) {
    return NextResponse.next();
  }

  const ingelogd = request.cookies.get(INTERN_SESSIE_COOKIE)?.value === "1";
  if (!ingelogd) {
    // Een API-aanroep verwacht JSON terug (die komt vanuit fetch() op een interne pagina), geen
    // redirect naar een HTML-pagina.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
    }

    const loginUrl = new URL("/intern/login", request.url);
    loginUrl.searchParams.set("van", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// `:path*` matcht hier bewust de hele subtree in één keer (in plaats van elke route apart op te
// sommen) — zie de uitleg bij isPubliekeAanvragenRoute hierboven voor waarom dat de veiligere
// default is.
export const config = {
  matcher: [
    "/intern/:path*",
    "/api/aanvragen",
    "/api/aanvragen/:path*",
    "/inloggen",
    "/mijn-borden",
    "/mijn-account",
    "/account-aanmaken",
  ],
};
