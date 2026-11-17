"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Toestand = "laden" | "formulier" | "geen_link" | "klaar";

export function WachtwoordInstellenForm() {
  const router = useRouter();
  const [toestand, setToestand] = useState<Toestand>("laden");
  const [token, setToken] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [zichtbaar, setZichtbaar] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  // De code staat achter de # (zie app/wachtwoord-instellen/page.tsx), dus alleen hier in de
  // browser uit te lezen.
  useEffect(() => {
    const uitLink = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token") ?? "";
    setToken(uitLink);
    setToestand(uitLink ? "formulier" : "geen_link");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFoutmelding(null);

    try {
      const response = await fetch("/api/klant/wachtwoord-instellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, wachtwoord }),
      });
      let data: { ok?: boolean; error?: string; verlopen?: boolean };
      try {
        data = await response.json();
      } catch {
        throw new Error("Er ging iets mis. Probeer het opnieuw.");
      }
      if (!response.ok || !data.ok) {
        if (data.verlopen) {
          setToestand("geen_link");
          return;
        }
        throw new Error(data.error ?? "Er ging iets mis. Probeer het opnieuw.");
      }

      // De klant is nu ingelogd. Zelfde koppelstap als na een gewone login (zie
      // app/inloggen/KlantLoginForm.tsx); mag mislukken zonder dat dit scherm daar last van heeft.
      try {
        await fetch("/api/account/koppel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch {
        // zie hierboven
      }

      // De code is verbruikt: haal 'm uit de adresbalk, zodat hij niet in de geschiedenis blijft staan.
      window.history.replaceState(null, "", window.location.pathname);
      setToestand("klaar");
      router.refresh();
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
    } finally {
      setBezig(false);
    }
  }

  if (toestand === "laden") {
    return <p className="text-sm text-neutral-500">Even geduld...</p>;
  }

  if (toestand === "geen_link") {
    return (
      <div className="space-y-4">
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Deze link is verlopen of al een keer gebruikt. Vraag een nieuwe aan, dan sturen we je opnieuw een mail.
        </p>
        <a
          href="/wachtwoord-vergeten"
          className="inline-block rounded bg-brand-groen-donker px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Nieuwe link aanvragen
        </a>
      </div>
    );
  }

  if (toestand === "klaar") {
    return (
      <div className="space-y-4">
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Je nieuwe wachtwoord is opgeslagen en je bent ingelogd.
        </p>
        <a
          href="/mijn-borden"
          className="inline-block rounded bg-brand-groen-donker px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Naar mijn borden
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="wachtwoord" className="mb-1 block text-sm font-medium text-brand-zwart">
          Nieuw wachtwoord *
        </label>
        <input
          id="wachtwoord"
          type={zichtbaar ? "text" : "password"}
          required
          autoFocus
          minLength={8}
          maxLength={72}
          value={wachtwoord}
          onChange={(event) => setWachtwoord(event.target.value)}
          autoComplete="new-password"
          className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-brand-groen focus:outline-none"
        />
        <p className="mt-1 text-xs text-neutral-500">Minimaal 8 tekens.</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={zichtbaar} onChange={(event) => setZichtbaar(event.target.checked)} />
        Laat het wachtwoord zien
      </label>

      {foutmelding && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{foutmelding}</p>
      )}

      <button
        type="submit"
        disabled={bezig}
        className="w-full rounded bg-brand-groen-donker px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {bezig ? "Bezig..." : "Wachtwoord opslaan"}
      </button>
    </form>
  );
}
