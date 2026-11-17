"use client";

import { useState, type FormEvent } from "react";

export function WachtwoordVergetenForm() {
  const [email, setEmail] = useState("");
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [verstuurd, setVerstuurd] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFoutmelding(null);

    try {
      const response = await fetch("/api/klant/wachtwoord-vergeten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      let data: { ok?: boolean; error?: string };
      try {
        data = await response.json();
      } catch {
        throw new Error("Er ging iets mis. Probeer het opnieuw.");
      }
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Er ging iets mis. Probeer het opnieuw.");
      }
      setVerstuurd(true);
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
    } finally {
      setBezig(false);
    }
  }

  if (verstuurd) {
    return (
      <div className="space-y-4">
        <p className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Hoort er een account bij <strong>{email}</strong>? Dan staat er binnen een paar minuten een mail
          in je inbox met een link om een nieuw wachtwoord te kiezen. Kijk ook even bij je ongewenste mail.
        </p>
        <p className="text-sm text-neutral-600">
          Niets ontvangen?{" "}
          <button
            type="button"
            onClick={() => setVerstuurd(false)}
            className="font-medium text-brand-groen-donker underline"
          >
            Probeer het opnieuw
          </button>{" "}
          of{" "}
          <a href="/inloggen" className="font-medium text-brand-groen-donker underline">
            ga terug naar inloggen
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-brand-zwart">
            E-mailadres *
          </label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
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
          {bezig ? "Bezig..." : "Stuur mij een link"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-neutral-600">
        Weet je het weer?{" "}
        <a href="/inloggen" className="font-medium text-brand-groen-donker underline">
          Inloggen
        </a>
      </p>
    </>
  );
}
