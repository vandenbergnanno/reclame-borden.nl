"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { veiligPad } from "@/lib/security/veiligPad";
import { useTurnstile } from "@/lib/security/useTurnstile";

// Zelfde opzet als app/inloggen/KlantLoginForm.tsx: een publieke sitekey, mag in de browser.
// Leeg = CAPTCHA staat (nog) niet aan.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function InternLoginForm({ terugNaar }: { terugNaar?: string }) {
  const router = useRouter();
  const [wachtwoord, setWachtwoord] = useState("");
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const { laad, haalToken } = useTurnstile("internTurnstile");
  function laadTurnstile() {
    laad(TURNSTILE_SITE_KEY);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFoutmelding(null);

    const captchaToken = await haalToken(!!TURNSTILE_SITE_KEY);

    try {
      const response = await fetch("/api/intern/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wachtwoord, cf_turnstile_token: captchaToken }),
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
      {TURNSTILE_SITE_KEY && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" onLoad={laadTurnstile} />
      )}
      <div id="internTurnstile" className="flex justify-center empty:hidden" />
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
