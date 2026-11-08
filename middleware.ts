import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { INTERN_SESSIE_COOKIE } from "@/lib/auth/internSessie";
import { SITE_SESSIE_COOKIE } from "@/lib/auth/siteSessie";

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

  // Tijdelijke, site-brede poort (zie lib/auth/siteSessie.ts) -- onafhankelijke, EXTRA laag vóór
  // alle onderstaande logica. Alles verderop in deze functie blijft ongewijzigd, maar wordt nu pas
  // bereikt nadat deze poort gepasseerd is. Weer verwijderen zodra de site echt live gaat.
  if (pathname === "/toegang" || pathname === "/api/toegang/login") {
    return NextResponse.next();
  }
  const siteToegankelijk = request.cookies.get(SITE_SESSIE_COOKIE)?.value === "1";
  if (!siteToegankelijk) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Site is nog niet publiek toegankelijk." }, { status: 401 });
    }
    const toegangUrl = new URL("/toegang", request.url);
    toegangUrl.searchParams.set("van", pathname);
    return NextResponse.redirect(toegangUrl);
  }

  if (pathname === "/inloggen" || pathname === "/mijn-borden" || pathname === "/mijn-account" || pathname === "/account-aanmaken") {
    return await verversSupabaseSessie(request);
  }

  if (pathname === "/intern/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/aanvragen") && isPubliekeAanvragenRoute(request.method, pathname)) {
    return NextResponse.next();
  }

  // De /intern-poort hoort alleen bij /intern zelf en de niet-publieke /api/aanvragen-routes --
  // vroeger bakende de matcher dat vanzelf af (die matchte alleen die paden), maar nu de matcher
  // hieronder de hele site dekt (voor de site-brede poort hierboven) moet dat hier expliciet,
  // anders zou deze check per ongeluk ELKE pagina achter het /intern-wachtwoord zetten.
  if (pathname.startsWith("/intern") || pathname.startsWith("/api/aanvragen")) {
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
  }

  return NextResponse.next();
}

// Deze matcher dekt bewust de hele site (behalve de routes hieronder) -- nodig voor de site-brede
// poort hierboven. De afbakening van WIE binnen de functie welke extra poort moet passeren
// (/intern, /api/aanvragen) gebeurt expliciet in de functie zelf, zie de toelichting daar.
// Uitgesloten, altijd zonder toegangscookie bereikbaar:
// - _next/static, _next/image: Next.js' eigen interne asset-pipeline.
// - icon, opengraph-image: de automatisch gegenereerde favicon- en linkpreview-routes (geen vaste
//   bestandsnaam/-extensie, dus hier met de naam zelf i.p.v. via de extensie-regel hieronder).
// - robots.txt: moet voor iedere crawler leesbaar blijven (zegt zelf al "Disallow: /", zie
//   app/robots.ts), ook zonder toegangscookie.
// - monitoring: de Sentry-tunnel (next.config.mjs, tunnelRoute) -- stuurt foutrapportages door,
//   geen pagina, hoort niet achter een wachtwoordscherm te komen.
// - privacybeleid: moet ook zonder toegangscookie leesbaar zijn (bijv. voor wie 'm via een
//   e-maillink opent).
// - bestanden met een bekende statische extensie (alles in /public, zoals het logo, plus elk
//   toekomstig bestand daar) -- die worden op hun kale bestandsnaam geserveerd, niet onder een
//   "/public"-prefix, dus een losse naam-voor-naam-uitsluiting zou bij elk nieuw bestand opnieuw
//   vergeten kunnen worden.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon|opengraph-image|robots\\.txt|monitoring|privacybeleid|.*\\.(?:png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf|css|js|map|txt|xml|json|pdf)$).*)",
  ],
};
