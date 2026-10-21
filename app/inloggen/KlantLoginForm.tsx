"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browserClient";

type Modus = "inloggen" | "account_aanmaken";

// Gebruikt Supabase Auth rechtstreeks vanuit de browser (geen eigen wachtwoordopslag, zie de
// migratie 0003_klant_accounts.sql) voor zowel inloggen als een nieuw account aanmaken. Na een
// geslaagde signup koppelen we het account aan een klanten-rij via /api/account/koppel (met de
// service-role key, want RLS staat geen schrijfacties vanuit de klant zelf toe).
export function KlantLoginForm() {
  const router = useRouter();
  const [modus, setModus] = useState<Modus>("inloggen");
  const [naam, setNaam] = useState("");
  const [bedrijf, setBedrijf] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [melding, setMelding] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFoutmelding(null);
    setMelding(null);

    try {
      const supabase = createBrowserSupabaseClient();

      if (modus === "inloggen") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord });
        if (error) throw new Error(error.message === "Invalid login credentials" ? "Onjuist e-mailadres of wachtwoord." : error.message);
        // Best effort: als deze klant (bijvoorbeeld na het bevestigen van zijn e-mailadres) nog
        // niet gekoppeld was aan een eerdere gastaanvraag, gebeurt dat hier alsnog. Mislukt dit,
        // dan mag het inloggen zelf gewoon doorgaan -- /mijn-borden laat dan voorlopig geen
        // eerdere aanvragen zien in plaats van de klant helemaal te blokkeren.
        try {
          await fetch("/api/account/koppel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
        } catch {
          // zie hierboven
        }
        router.push("/mijn-borden");
        router.refresh();
        return;
      }

      // Account aanmaken
      const { data, error } = await supabase.auth.signUp({ email, password: wachtwoord });
      if (error) throw new Error(error.message);

      if (!data.session) {
        // Het Supabase-project vraagt om e-mailbevestiging voordat er een sessie is -- de
        // koppeling met de klantenrij (hieronder) kan dan nog niet, dat gebeurt automatisch
        // zodra de klant voor het eerst inlogt ná het bevestigen van zijn e-mailadres.
        setMelding("Check je e-mail om je account te bevestigen. Daarna kun je hier inloggen.");
        setBezig(false);
        return;
      }

      const koppelResponse = await fetch("/api/account/koppel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naam, bedrijf, telefoon }),
      });
      const koppelData = await koppelResponse.json();
      if (!koppelResponse.ok || !koppelData.ok) {
        throw new Error(koppelData.error ?? "Account aangemaakt, maar koppelen aan je gegevens is mislukt.");
      }

      router.push("/mijn-borden");
      router.refresh();
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
      setBezig(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-lg bg-neutral-100 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => { setModus("inloggen"); setFoutmelding(null); setMelding(null); }}
          className={`flex-1 rounded-md px-3 py-1.5 transition ${modus === "inloggen" ? "bg-white text-brand-zwart shadow-sm" : "text-neutral-500"}`}
        >
          Inloggen
        </button>
        <button
          type="button"
          onClick={() => { setModus("account_aanmaken"); setFoutmelding(null); setMelding(null); }}
          className={`flex-1 rounded-md px-3 py-1.5 transition ${modus === "account_aanmaken" ? "bg-white text-brand-zwart shadow-sm" : "text-neutral-500"}`}
        >
          Account aanmaken
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {modus === "account_aanmaken" && (
          <>
            <div>
              <label htmlFor="naam" className="mb-1 block text-sm font-medium text-brand-zwart">
                Naam *
              </label>
              <input
                id="naam"
                type="text"
                required
                value={naam}
                onChange={(event) => setNaam(event.target.value)}
                autoComplete="name"
                className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-brand-groen focus:outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bedrijf" className="mb-1 block text-sm font-medium text-brand-zwart">
                  Bedrijf / vereniging
                </label>
                <input
                  id="bedrijf"
                  type="text"
                  value={bedrijf}
                  onChange={(event) => setBedrijf(event.target.value)}
                  autoComplete="organization"
                  className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-brand-groen focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="telefoon" className="mb-1 block text-sm font-medium text-brand-zwart">
                  Telefoonnummer
                </label>
                <input
                  id="telefoon"
                  type="tel"
                  value={telefoon}
                  onChange={(event) => setTelefoon(event.target.value)}
                  autoComplete="tel"
                  className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-brand-groen focus:outline-none"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-brand-zwart">
            E-mailadres *
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-brand-groen focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="wachtwoord" className="mb-1 block text-sm font-medium text-brand-zwart">
            Wachtwoord *
          </label>
          <input
            id="wachtwoord"
            type="password"
            required
            minLength={6}
            value={wachtwoord}
            onChange={(event) => setWachtwoord(event.target.value)}
            autoComplete={modus === "inloggen" ? "current-password" : "new-password"}
            className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-brand-groen focus:outline-none"
          />
        </div>

        {melding && (
          <p className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{melding}</p>
        )}
        {foutmelding && (
          <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{foutmelding}</p>
        )}

        <button
          type="submit"
          disabled={bezig}
          className="w-full rounded bg-brand-groen px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {bezig ? "Bezig..." : modus === "inloggen" ? "Inloggen" : "Account aanmaken"}
        </button>

        {modus === "account_aanmaken" && (
          <p className="text-center text-xs text-neutral-500">
            Met een account aanmaken ga je akkoord met ons{" "}
            <a
              href="https://reclame-borden.nl/privacybeleid/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-brand-groen"
            >
              privacybeleid
            </a>
            .
          </p>
        )}
      </form>
    </div>
  );
}
