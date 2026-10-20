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
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/intern/:path*", "/api/aanvragen", "/api/aanvragen/:path*"],
};
