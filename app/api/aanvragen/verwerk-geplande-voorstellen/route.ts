import { NextResponse } from "next/server";
import { verwerkGeplandeVoorstellen } from "@/lib/planning/verwerkGeplandeVoorstellen";

export const runtime = "nodejs";

// Sinds de achtergrondplanner (zie instrumentation.ts + lib/planning/scheduler.ts) draait dit nu
// ook automatisch elke minuut — deze route (en de testknop op /intern/concepten die 'm aanroept)
// bestaat nog om niet te hoeven wachten tijdens het testen, en als basis voor een eventuele echte
// scheduler bij een latere deployment (zie lib/planning/scheduler.ts voor de beperkingen daarvan).
export async function POST() {
  try {
    const { verwerkt, mislukt } = await verwerkGeplandeVoorstellen();
    return NextResponse.json({ ok: true, verwerkt: verwerkt.length, aanvraagIds: verwerkt, mislukt });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Onbekende fout." },
      { status: 500 }
    );
  }
}
