"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { veiligPad } from "@/lib/security/veiligPad";

export function InternLoginForm({ terugNaar }: { terugNaar?: string }) {
  const router = useRouter();
  const [wachtwoord, setWachtwoord] = useState("");
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFoutmelding(null);

    try {
      const response = await fetch("/api/intern/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wachtwoord }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Onjuist wachtwoord.");
      }

      // Nooit blind naar een extern adres doorsturen dat via de querystring is meegegeven.
      const kandidaat = veiligPad(terugNaar, "/intern");
      const bestemming = kandidaat.startsWith("/intern") ? kandidaat : "/intern";
      router.push(bestemming);
      router.refresh();
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
      setBezig(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="wachtwoord" className="mb-1 block text-sm font-medium text-brand-zwart">
          Wachtwoord
        </label>
        <input
          id="wachtwoord"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          value={wachtwoord}
          onChange={(event) => setWachtwoord(event.target.value)}
          className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-brand-groen focus:outline-none"
        />
      </div>

      {foutmelding && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{foutmelding}</p>
      )}

      <button
        type="submit"
        disabled={bezig}
        className="w-full rounded bg-brand-groen-donker px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {bezig ? "Bezig..." : "Inloggen"}
      </button>
    </form>
  );
}
