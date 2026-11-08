"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { createBrowserSupabaseClient } from "@/lib/supabase/browserClient";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | Element, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
    };
  }
}

type Modus = "inloggen" | "account_aanmaken";

// Site key van Cloudflare Turnstile (zie .env.example) -- een publieke sleutel, mag in de browser.
// Leeg = CAPTCHA staat (nog) niet aan; dan wordt ook nooit een widget geladen en blijft
// captchaToken altijd leeg, wat prima is zolang "Enable CAPTCHA protection" in het Supabase-
// dashboard ook uit staat (zie de uitleg die hierover met de gebruiker is gedeeld).
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Dit inloggen gaat rechtstreeks vanuit de browser naar Supabase (geen eigen server-route, dus ook
// geen eigen IP-gebaseerde rate limiting zoals bij /api/intern/login). Deze afremming is daarom
// bewust per-browser (sessionStorage, geen account- of IP-blokkade): na een paar mislukte pogingen
// moet je even wachten voor de knop weer werkt. Dat haalt het tempo uit lukraak wachtwoorden
// proberen, maar is net als elke client-side maatregel te omzeilen door sessionStorage te wissen --
// de eigenlijke bescherming tegen brute-force blijft Supabase Auth's eigen rate limiting.
const MAX_POGINGEN = 5;
const WACHTTIJD_MS = 30_000;
const OPSLAGSLEUTEL = "mediagraaf_klant_login_pogingen";

function leesPogingen(): { aantal: number; geblokkeerdTot: number } {
  try {
    const ruw = window.sessionStorage.getItem(OPSLAGSLEUTEL);
    if (!ruw) return { aantal: 0, geblokkeerdTot: 0 };
    const data = JSON.parse(ruw);
    return { aantal: Number(data.aantal) || 0, geblokkeerdTot: Number(data.geblokkeerdTot) || 0 };
  } catch {
    return { aantal: 0, geblokkeerdTot: 0 };
  }
}

function schrijfPogingen(aantal: number, geblokkeerdTot: number) {
  try {
    window.sessionStorage.setItem(OPSLAGSLEUTEL, JSON.stringify({ aantal, geblokkeerdTot }));
  } catch {
    // sessionStorage kan geblokkeerd zijn (bijv. privénavigatie) -- dan werkt de afremming niet,
    // maar mag inloggen zelf niet kapot gaan.
  }
}

// Bij "Account aanmaken" zonder directe sessie (e-mailbevestiging vereist, zie hieronder) kan
// /api/account/koppel nog niet aangeroepen worden: die vereist een ingelogde sessie, en die is er
// pas ná het bevestigen. We bewaren naam/bedrijf/telefoon daarom tijdelijk, zodat de eerstvolgende
// geslaagde login in DEZELFDE browser (na het klikken op de bevestigingslink) ze alsnog kan
// meesturen -- zonder dit zou /api/account/koppel bij die eerste login met een lege naam
// aanroepen, en zonder bestaande klantenrij (nieuw account, geen eerdere gastaanvraag) geeft die
// route dan een 400 "Naam is verplicht" terug: er komt dan nooit een klantenrij voor dit account.
const WACHTENDE_SIGNUP_SLEUTEL = "mediagraaf_klant_wachtend_op_bevestiging";

function schrijfWachtendeSignup(email: string, naam: string, bedrijf: string, telefoon: string) {
  try {
    window.sessionStorage.setItem(WACHTENDE_SIGNUP_SLEUTEL, JSON.stringify({ email, naam, bedrijf, telefoon }));
  } catch {
    // Zie schrijfPogingen hierboven: zonder sessionStorage werkt deze koppeling straks niet,
    // maar dat is dan hetzelfde (bestaande) gedrag als vóór deze aanvulling.
  }
}

function leesWachtendeSignup(email: string): { naam: string; bedrijf: string; telefoon: string } | null {
  try {
    const ruw = window.sessionStorage.getItem(WACHTENDE_SIGNUP_SLEUTEL);
    if (!ruw) return null;
    const data = JSON.parse(ruw);
    if (data.email !== email) return null;
    return { naam: data.naam || "", bedrijf: data.bedrijf || "", telefoon: data.telefoon || "" };
  } catch {
    return null;
  }
}

function wisWachtendeSignup() {
  try {
    window.sessionStorage.removeItem(WACHTENDE_SIGNUP_SLEUTEL);
  } catch {
    // zie hierboven
  }
}

// Gebruikt Supabase Auth rechtstreeks vanuit de browser (geen eigen wachtwoordopslag, zie de
// migratie 0003_klant_accounts.sql) voor zowel inloggen als een nieuw account aanmaken. Na een
// geslaagde signup koppelen we het account aan een klanten-rij via /api/account/koppel (met de
// service-role key, want RLS staat geen schrijfacties vanuit de klant zelf toe).
// `vasteModus`: /inloggen en /account-aanmaken zijn bewust twee aparte pagina's (geen tabblad
// binnen één pagina) -- zonder account kon je eerder per ongeluk op de inlogpagina belanden en
// daar pas de knop "Account aanmaken" ontdekken. Met een vaste modus verdwijnt die tab-wissel
// hieronder, en toont het formulier alleen het veld dat bij die pagina hoort.
export function KlantLoginForm({ vasteModus }: { vasteModus?: Modus } = {}) {
  const router = useRouter();
  const [modus, setModus] = useState<Modus>(vasteModus ?? "inloggen");
  const [naam, setNaam] = useState("");
  const [bedrijf, setBedrijf] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [melding, setMelding] = useState<string | null>(null);
  const [geblokkeerdTot, setGeblokkeerdTot] = useState(0);
  const [resterendeSeconden, setResterendeSeconden] = useState(0);

  // Waar na een geslaagde login/signup naartoe? Standaard /mijn-borden, maar bijv. de ontwerptool
  // stuurt niet-ingelogde bezoekers hierheen met ?daarna=/aanvraag (zie app/aanvraag/route.ts),
  // zodat je na het inloggen gewoon verdergaat waar je was in plaats van naar /mijn-borden te
  // moeten navigeren. window.location.search lezen i.p.v. useSearchParams() omdat dat laatste een
  // Suspense-boundary rond deze client component zou vereisen, puur voor iets wat toch alleen in
  // de browser relevant is.
  const daarnaRef = useRef("/mijn-borden");
  useEffect(() => {
    const daarna = new URLSearchParams(window.location.search).get("daarna");
    if (daarna && daarna.startsWith("/")) daarnaRef.current = daarna;
  }, []);

  // Koppelen aan een klantenrij (zie de uitleg bij schrijfWachtendeSignup) en doorsturen -- gebruikt
  // door zowel de handmatige login hieronder als de automatische check bij het laden van de pagina
  // (zie de volgende useEffect): een klant die net op de bevestigingslink in zijn e-mail heeft
  // geklikt, is daarmee al ingelogd (Supabase zet de sessie vanuit de link zelf) en hoeft dan niet
  // ook nog het wachtwoord opnieuw in te typen.
  async function koppelEnGaVerder(emailVanSessie: string) {
    const wachtendeSignup = leesWachtendeSignup(emailVanSessie);
    try {
      await fetch("/api/account/koppel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wachtendeSignup ?? {}),
      });
      wisWachtendeSignup();
    } catch {
      // zie schrijfPogingen hierboven: koppelen mag best eens mislukken, inloggen zelf niet.
    }
    router.push(daarnaRef.current);
    router.refresh();
  }

  // Automatisch verdergaan als er al een sessie is bij het laden van deze pagina -- dat is het
  // geval vlak na het klikken op de bevestigingslink in de e-mail (emailRedirectTo wijst hierheen,
  // zie de signup-tak hieronder): Supabase zet de sessie dan al vanuit de link zelf, dus zonder dit
  // zou de klant alsnog handmatig opnieuw moeten inloggen met het wachtwoord dat hij net heeft
  // gekozen, terwijl hij feitelijk al is ingelogd.
  useEffect(() => {
    let actief = true;
    (async () => {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (actief && data.session?.user.email) {
        await koppelEnGaVerder(data.session.user.email);
      }
    })();
    return () => { actief = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alleen bij het laden van de pagina checken
  }, []);

  // Onzichtbare Turnstile-widget: één keer renderen zodra het script geladen is, en na elke
  // poging resetten (een Supabase-captchaToken is maar één keer bruikbaar) zodat er voor de
  // volgende poging weer een vers token klaarstaat.
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileToken = useRef("");
  function laadTurnstile() {
    if (!TURNSTILE_SITE_KEY || turnstileWidgetId.current !== null || !window.turnstile) return;
    turnstileWidgetId.current = window.turnstile.render("#klantTurnstile", {
      sitekey: TURNSTILE_SITE_KEY,
      // Geen `size` meegeven: "invisible" is geen geldige waarde voor dat veld (de widget-api
      // gooit er anders een fout op) -- of de widget onzichtbaar is, hangt af van het widget-type
      // (Managed/Non-Interactive/Invisible) dat bij deze sitekey hoort in het Cloudflare-dashboard.
      theme: "light",
      // "interaction-only": de widget blijft onzichtbaar tenzij Cloudflare een interactieve check
      // nodig vindt -- de managed-modus die het dashboard zelf ook aanbiedt, maar hier expliciet
      // code-side afgedwongen in plaats van afhankelijk van een dashboard-instelling.
      appearance: "interaction-only",
      callback: (token: string) => { turnstileToken.current = token; },
      "error-callback": () => { turnstileToken.current = ""; },
      "expired-callback": () => {
        turnstileToken.current = "";
        if (turnstileWidgetId.current !== null) window.turnstile?.reset(turnstileWidgetId.current);
      },
    });
  }

  useEffect(() => {
    setGeblokkeerdTot(leesPogingen().geblokkeerdTot);
  }, []);

  useEffect(() => {
    if (!geblokkeerdTot) return;
    const bijwerken = () => setResterendeSeconden(Math.max(0, Math.ceil((geblokkeerdTot - Date.now()) / 1000)));
    bijwerken();
    const interval = setInterval(bijwerken, 1000);
    return () => clearInterval(interval);
  }, [geblokkeerdTot]);

  const geblokkeerd = geblokkeerdTot > Date.now();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (modus === "inloggen" && leesPogingen().geblokkeerdTot > Date.now()) {
      return;
    }

    setBezig(true);
    setFoutmelding(null);
    setMelding(null);

    // Elk token is maar één keer bruikbaar bij Supabase -- na deze poging (ongeacht de uitkomst)
    // alvast resetten, zodat er een vers token klaarstaat tegen de tijd dat de klant opnieuw
    // probeert. Zonder site key is widgetId nooit gezet en doet dit niets.
    const captchaToken = turnstileToken.current || undefined;
    if (turnstileWidgetId.current !== null) window.turnstile?.reset(turnstileWidgetId.current);
    turnstileToken.current = "";

    try {
      if (modus === "inloggen") {
        // Gaat via onze eigen route (niet rechtstreeks supabase.auth.signInWithPassword), die er
        // eerst een eigen IP-gebaseerde rate limit tussen zet (zie app/api/klant/login/route.ts)
        // -- de sessionStorage-afremming hieronder blijft daarnaast bestaan als extra, cosmetische
        // laag (werkt ook nog als iemand JS-staat reset, dan vangt de server-kant het alsnog op).
        const inlogResponse = await fetch("/api/klant/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, wachtwoord, cf_turnstile_token: captchaToken }),
        });
        const inlogData = await inlogResponse.json();

        if (!inlogResponse.ok || !inlogData.ok) {
          // Alleen een fout wachtwoord/e-mailadres telt mee voor de afremming -- een
          // configuratiefout, de server-rate-limit zelf (429) of iets anders mag niet onterecht
          // meetellen.
          if (inlogResponse.status === 401) {
            const { aantal } = leesPogingen();
            const nieuwAantal = aantal + 1;
            if (nieuwAantal >= MAX_POGINGEN) {
              const tot = Date.now() + WACHTTIJD_MS;
              schrijfPogingen(0, tot);
              setGeblokkeerdTot(tot);
            } else {
              schrijfPogingen(nieuwAantal, 0);
            }
          }
          throw new Error(inlogData.error ?? "Inloggen is mislukt.");
        }
        schrijfPogingen(0, 0);
        setGeblokkeerdTot(0);
        await koppelEnGaVerder(email);
        return;
      }

      // Account aanmaken
      // Gaat, net als inloggen hierboven, via onze eigen route (zie
      // app/api/klant/registreren/route.ts) in plaats van rechtstreeks supabase.auth.signUp: die
      // route verifieert het Turnstile-token zelf op de server. emailRedirectTo: zonder dit stuurt
      // Supabase na het klikken op de bevestigingslink naar de "Site URL" uit de
      // projectinstellingen, die niet per se (nog) goed staat ingesteld -- hiermee komt de klant
      // altijd terug op onze eigen inlogpagina, waar hij meteen kan inloggen.
      const registrerenResponse = await fetch("/api/klant/registreren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          wachtwoord,
          cf_turnstile_token: captchaToken,
          emailRedirectTo: `${window.location.origin}/inloggen`,
        }),
      });
      const registrerenData = await registrerenResponse.json();
      if (!registrerenResponse.ok || !registrerenData.ok) {
        throw new Error(registrerenData.error ?? "Account aanmaken is mislukt.");
      }

      if (!registrerenData.heeftSessie) {
        // Het Supabase-project vraagt om e-mailbevestiging voordat er een sessie is -- de
        // koppeling met de klantenrij (hieronder) kan dan nog niet, dat gebeurt automatisch
        // zodra de klant voor het eerst inlogt ná het bevestigen van zijn e-mailadres (zie de
        // inloggen-tak hierboven). Bewaar naam/bedrijf/telefoon vast, zodat die eerste koppeling
        // dan nog steeds een klantenrij kan aanmaken in plaats van op een lege naam te stranden.
        schrijfWachtendeSignup(email, naam, bedrijf, telefoon);
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

      router.push(daarnaRef.current);
      router.refresh();
    } catch (error) {
      setFoutmelding(error instanceof Error ? error.message : "Onbekende fout.");
      setBezig(false);
    }
  }

  return (
    <div>
      {TURNSTILE_SITE_KEY && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" onLoad={laadTurnstile} />
      )}
      {!vasteModus && (
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
      )}

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
            minLength={8}
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
        {modus === "inloggen" && geblokkeerd && (
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Te veel mislukte pogingen. Probeer het over {resterendeSeconden} seconden opnieuw.
          </p>
        )}

        {/* Geen vaste 0x0-afmeting meer: bij widget-mode "Managed" (zie Cloudflare-dashboard) kan
            Cloudflare hier soms een zichtbare checkbox tonen aan een verdachte bezoeker -- een
            vast dichtgeknepen vakje zou die dan onbruikbaar maken. Vlak boven de verstuurknop,
            zodat 'm niemand mist als Cloudflare toch een interactieve check nodig vindt. */}
        <div id="klantTurnstile" className="flex justify-center empty:hidden" />

        <button
          type="submit"
          disabled={bezig || (modus === "inloggen" && geblokkeerd)}
          className="w-full rounded bg-brand-groen-donker px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {bezig ? "Bezig..." : modus === "inloggen" ? "Inloggen" : "Account aanmaken"}
        </button>

        {modus === "account_aanmaken" && (
          <p className="text-center text-xs text-neutral-500">
            Met een account aanmaken ga je akkoord met ons{" "}
            <a
              href="/privacybeleid"
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

      {vasteModus === "inloggen" && (
        <p className="mt-4 text-center text-sm text-neutral-600">
          Nog geen account?{" "}
          <a href="/account-aanmaken" className="font-medium text-brand-groen-donker underline">
            Account aanmaken
          </a>
        </p>
      )}
      {vasteModus === "account_aanmaken" && (
        <p className="mt-4 text-center text-sm text-neutral-600">
          Al een account?{" "}
          <a href="/inloggen" className="font-medium text-brand-groen-donker underline">
            Inloggen
          </a>
        </p>
      )}
    </div>
  );
}
