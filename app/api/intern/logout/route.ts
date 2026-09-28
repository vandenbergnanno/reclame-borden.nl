import { NextResponse } from "next/server";
import { INTERN_SESSIE_COOKIE } from "@/lib/auth/internSessie";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(INTERN_SESSIE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
