"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browserClient";

// AVG-rechten voor de klant: eigen gegevens downloaden (inzagerecht) en het account verwijderen
// (recht op vergetelheid). Verwijderen koppelt alleen het account los; de aanvragen zelf blijven
// bestaan voor reclame-borden.nl (zie app/api/account/verwijderen/route.ts) -- dat wordt hieronder ook
// expliciet aan de klant uitgelegd, anders lijkt "account verwijderen" alsof ook de bestelgeschiedenis
// verdwijnt. Bewust klein/onopvallend onderaan de pagina: moet er wel zijn (wettelijke verplichting),
// maar hoeft niet de aandacht te trekken zoals de rest van de pagina.
export function AccountActies() {
  const router = useRouter();
  const [bezig, setBezig] = useState<"exporteren" | "verwijderen" | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [bevestigen, setBevestigen] = useState(false);

  async function downloadGegevens() {
    setBezig("exporteren");
    setFoutmelding(null);
    try {
      const response = await fetch("/api/account/exporteren");
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Downloaden van je gegevens is mislukt.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mijn-gegevens-reclame-borden-nl.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
    } finally {
      setBezig(null);
    }
  }

  async function verwijderAccount() {
    setBezig("verwijderen");
    setFoutmelding(null);
    try {
      const response = await fetch("/api/account/verwijderen", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Account verwijderen is mislukt.");
      }
      await createBrowserSupabaseClient().auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
      setBezig(null);
    }
  }

  return (
    <div className="space-y-2 text-xs text-neutral-400">
      {foutmelding && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{foutmelding}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={downloadGegevens}
          disabled={bezig !== null}
          className="underline decoration-dotted hover:text-neutral-600 disabled:opacity-50"
        >
          {bezig === "exporteren" ? "Bezig..." : "Download mijn gegevens"}
        </button>

        {!bevestigen && (
          <button
            type="button"
            onClick={() => setBevestigen(true)}
            disabled={bezig !== null}
            className="underline decoration-dotted hover:text-neutral-600 disabled:opacity-50"
          >
            Account verwijderen
          </button>
        )}
      </div>

      {bevestigen && (
        <div className="flex flex-wrap items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm">
          <p className="text-red-700">
            Weet je het zeker? Je kunt dan niet meer inloggen. Je aanvragen blijven wel bewaard bij reclame-borden.nl
            zelf (voor garantie en boekhouding), maar jij kunt ze daarna niet meer terugzien.
          </p>
          <button
            type="button"
            onClick={verwijderAccount}
            disabled={bezig !== null}
            className="whitespace-nowrap rounded bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {bezig === "verwijderen" ? "Bezig..." : "Ja, verwijderen"}
          </button>
          <button
            type="button"
            onClick={() => setBevestigen(false)}
            disabled={bezig !== null}
            className="whitespace-nowrap rounded border border-neutral-300 px-3 py-1.5 font-medium text-brand-zwart disabled:opacity-50"
          >
            Annuleren
          </button>
        </div>
      )}
    </div>
  );
}
