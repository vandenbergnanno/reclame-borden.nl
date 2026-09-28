import { NextResponse, type NextRequest } from "next/server";
import { INTERN_SESSIE_COOKIE } from "@/lib/auth/internSessie";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/intern/login") {
    return NextResponse.next();
  }

  const ingelogd = request.cookies.get(INTERN_SESSIE_COOKIE)?.value === "1";
  if (!ingelogd) {
    const loginUrl = new URL("/intern/login", request.url);
    loginUrl.searchParams.set("van", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Beschermt de interne pagina's zelf, en de API-route waarmee een medewerker de status van een
// aanvraag wijzigt. Het publieke klantformulier (/aanvraag, POST /api/aanvragen) blijft bewust
// buiten deze poort.
export const config = {
  matcher: ["/intern/:path*", "/api/aanvragen/:id/status"],
};
