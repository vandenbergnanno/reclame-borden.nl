"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Een achtergrondplanner (zie instrumentation.ts + lib/planning/scheduler.ts) doet dit inmiddels
// ook automatisch, elke minuut. Deze knop roept dezelfde route handmatig aan, puur zodat je tijdens
// het testen niet hoeft te wachten tot de achtergrondplanner er zelf aan toekomt.
export function VerwerkGeplandeVoorstellenKnop() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "bezig" | "fout">("idle");
  const [melding, setMelding] = useState<string | null>(null);

  async function verwerk() {
    setStatus("bezig");
    setMelding(null);

    try {
      const response = await fetch("/api/aanvragen/verwerk-geplande-voorstellen", { method: "POST" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Onbekende fout.");
      }

      const aantalMislukt = Array.isArray(data.mislukt) ? data.mislukt.length : 0;
      const basisMelding =
        data.verwerkt === 0
          ? "Geen aanvragen waarvan het geplande tijdstip al verstreken is."
          : `${data.verwerkt} aanvraag/aanvragen verwerkt.`;

      setMelding(aantalMislukt > 0 ? `${basisMelding} (${aantalMislukt} mislukt — zie serverlogs)` : basisMelding);
      setStatus(aantalMislukt > 0 ? "fout" : "idle");
      router.refresh();
    } catch (error) {
      setStatus("fout");
      setMelding(error instanceof Error ? error.message : "Onbekende fout.");
    }
  }

  return (
    <div className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={verwerk}
          disabled={status === "bezig"}
          className="rounded border border-brand-zwart px-3 py-1.5 text-sm font-medium text-brand-zwart hover:bg-white disabled:opacity-50"
        >
          {status === "bezig" ? "Bezig..." : "Verwerk geplande voorstellen nu"}
        </button>
        {melding && (
          <span className={`text-sm ${status === "fout" ? "text-red-700" : "text-neutral-600"}`}>{melding}</span>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Dit gebeurt ook automatisch, elke minuut, zodra het &ldquo;voorstel gepland op&rdquo;-tijdstip
        van een aanvraag verstreken is. Deze knop is er puur om dat niet te hoeven afwachten tijdens
        het testen.
      </p>
    </div>
  );
}
