import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacybeleid — reclame-borden.nl",
};

export default function PrivacybeleidPagina() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 text-sm text-neutral-700">
      <div>
        <h1 className="text-2xl font-semibold text-brand-zwart">Privacybeleid</h1>
        <p className="mt-1 text-neutral-500">Laatst bijgewerkt: 6 november 2026.</p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold text-brand-zwart">Wie is verantwoordelijk</h2>
        <p>
          Schaik Grafimedia B.V. (De Mediagraaf), [ADRES], KvK [KVK-NUMMER]. Vragen? Mail naar{" "}
          <a href="mailto:info@demediagraaf.nl" className="text-brand-groen underline">
            info@demediagraaf.nl
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-brand-zwart">Welke gegevens we verzamelen</h2>
        <p>
          Als je een reclamebord aanvraagt of een account aanmaakt, verwerken we: je naam,
          bedrijfsnaam, telefoonnummer en e-mailadres, de inhoud van je aanvraag (gewenste
          afmeting, tekst, logo of andere bestanden die je uploadt) en, als je reageert op een
          conceptontwerp, je feedback daarop.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-brand-zwart">Waarom we deze gegevens gebruiken</h2>
        <p>
          Uitsluitend om je aanvraag te kunnen behandelen: om een ontwerp voor je te maken, contact
          met je op te nemen over je bord, en om je account te laten werken (inloggen, je eigen
          aanvragen terugzien op <code className="rounded bg-neutral-100 px-1">/mijn-borden</code>
          ). We gebruiken je gegevens niet voor marketing en verkopen ze niet door aan derden.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-brand-zwart">Cookies</h2>
        <p>
          Deze site gebruikt alleen functionele cookies: om medewerkers op{" "}
          <code className="rounded bg-neutral-100 px-1">/intern</code> en klanten op{" "}
          <code className="rounded bg-neutral-100 px-1">/mijn-borden</code> ingelogd te houden.
          Geen tracking- of advertentiecookies.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-brand-zwart">Welke diensten we daarvoor gebruiken</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase</strong> — voor het opslaan van je gegevens, je aanvraag en, als je
            een account hebt, je inlogsessie.
          </li>
          <li>
            <strong>Vercel</strong> — host deze website.
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong> — een korte controle die bots tegenhoudt bij het
            versturen van formulieren en bij in- en registreren. Zie Cloudflare&apos;s{" "}
            <a
              href="https://www.cloudflare.com/turnstile-privacy-policy/"
              className="text-brand-groen underline"
              target="_blank"
              rel="noreferrer"
            >
              Turnstile Privacy Addendum
            </a>{" "}
            en{" "}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              className="text-brand-groen underline"
              target="_blank"
              rel="noreferrer"
            >
              Privacybeleid
            </a>
            .
          </li>
          <li>
            <strong>Resend</strong> — voor het versturen van e-mails over je aanvraag (bijv. als je
            conceptontwerp klaar is).
          </li>
          <li>
            <strong>Sentry</strong> — helpt ons technische fouten op de site op te sporen. Hierbij
            kunnen technische gegevens (zoals de pagina waar een fout optrad) worden verwerkt, nooit
            de inhoud van je aanvraag.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-brand-zwart">Hoe lang we je gegevens bewaren</h2>
        <p>
          Je aanvraag en de bijbehorende gegevens bewaren we [BEWAARTERMIJN, bijv. 7 jaar i.v.m. de
          fiscale bewaarplicht]. Verwijder je je account, dan kun je zelf niet meer inloggen, maar
          blijft de aanvraag zelf bewaard bij reclame-borden.nl (zie hieronder).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-brand-zwart">Jouw rechten</h2>
        <p>
          Heb je een account, dan kun je op{" "}
          <code className="rounded bg-neutral-100 px-1">/mijn-borden</code> zelf je gegevens
          downloaden (inzagerecht) of je account verwijderen (recht op vergetelheid). Wil je iets
          laten corrigeren, of heb je een andere vraag over je gegevens, neem dan contact op via{" "}
          <a href="mailto:info@demediagraaf.nl" className="text-brand-groen underline">
            info@demediagraaf.nl
          </a>
          . Ben je het niet eens met hoe we met je gegevens omgaan, dan kun je ook een klacht
          indienen bij de{" "}
          <a
            href="https://www.autoriteitpersoonsgegevens.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-groen underline"
          >
            Autoriteit Persoonsgegevens
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-brand-zwart">Contact</h2>
        <p>
          Vragen over dit privacybeleid? Mail naar{" "}
          <a href="mailto:info@demediagraaf.nl" className="text-brand-groen underline">
            info@demediagraaf.nl
          </a>
          .
        </p>
      </section>
    </div>
  );
}
