import { NextResponse } from "next/server";
import { INTERN_SESSIE_COOKIE, INTERN_SESSIE_MAX_LEEFTIJD_SECONDEN } from "@/lib/auth/internSessie";

export async function POST(request: Request) {
  const verwachtWachtwoord = process.env.INTERN_WACHTWOORD;

  if (!verwachtWachtwoord) {
    return NextResponse.json(
      { ok: false, error: "INTERN_WACHTWOORD is niet ingesteld (zie .env.example)." },
      { status: 500 }
    );
  }

  let body: { wachtwoord?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }

  if (typeof body.wachtwoord !== "string" || body.wachtwoord !== verwachtWachtwoord) {
    return NextResponse.json({ ok: false, error: "Onjuist wachtwoord." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(INTERN_SESSIE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: INTERN_SESSIE_MAX_LEEFTIJD_SECONDEN,
    path: "/",
  });
  return response;
}
