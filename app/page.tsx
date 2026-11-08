import type { ReactNode } from "react";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { VERTROUWEN } from "@/lib/constants/brand";

const STAPPEN = [
  {
    titel: "Kies je formaat",
    omschrijving: "Pak een standaardmaat, of vul je eigen afmeting in. Werk je bord in twee delen? Ook dat kan.",
  },
  {
    titel: "Ontwerp je bord",
    omschrijving:
      "Begin met een kant-en-klare indeling, voeg je eigen logo en tekst toe, en pas kleuren en lettertypes aan. Je ziet meteen hoe het wordt.",
  },
  {
    titel: "Verstuur je aanvraag",
    omschrijving:
      "Je krijgt altijd eerst een drukproef om goed te keuren. Geen tijd of zin om zelf te ontwerpen? Kies dan 'Laat ons het ontwerp maken' en stuur gewoon je logo mee.",
  },
];

const VOORDELEN = [
  {
    titel: "Zelf aan het stuur",
    omschrijving: "Sleep je logo, typ je tekst en kies je kleuren, rechtstreeks op een voorbeeld van je eigen bord.",
    icoon: <IconPenseel />,
  },
  {
    titel: "Kant-en-klare sjablonen",
    omschrijving: "Geen zin om vanaf nul te beginnen? Kies een van de twintig indelingen als startpunt.",
    icoon: <IconRaster />,
  },
  {
    titel: "Direct een voorbeeld",
    omschrijving: "Geen verrassingen achteraf: je ziet precies hoe je bord eruit komt te zien, ook van een afstand.",
    icoon: <IconOog />,
  },
  {
    titel: "Meteen drukklaar",
    omschrijving: "De tool maakt er automatisch een compleet drukbestand van, met de juiste afloop en resolutie.",
    icoon: <IconBestand />,
  },
];

// Dezelfde 4 standaardmaten als in de ontwerptool zelf (lib/ontwerptool/reclamebord-maker.html,
// FORMATEN-array) -- bewust hergebruikt in plaats van verzonnen, de prijs erbij is nog een
// placeholder (zie [PRIJS VANAF] hieronder).
const FORMATEN = ["300 × 80 cm", "320 × 80 cm", "300 × 70 cm", "244 × 61 cm"];

// De drie voorbeeldcategorieën die voor "Zo kan jouw bord eruitzien" zijn aangeleverd -- nog geen
// echte foto's, alleen de categorieën staan al vast.
const VOORBEELDCATEGORIEEN = [
  "FOTO: reclamebord bij sportveld",
  "FOTO: reclamebord bij bedrijfspand",
  "FOTO: reclamebord bij bouwproject",
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white px-6 py-14 sm:px-12 sm:py-20">
        <div className="mx-auto grid max-w-4xl items-center gap-10 sm:grid-cols-2">
          <div className="text-center sm:text-left">
            <p className="font-semibold uppercase tracking-wide text-brand-groen-donker">Gratis ontwerptool</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-brand-zwart sm:text-5xl">
              Jouw reclamebord, in ongeveer 10 minuten ontworpen
            </h1>
            <p className="mt-5 text-lg text-neutral-600">
              Stel zelf je bord samen met je eigen logo, tekst en kleuren — en zie meteen het resultaat.
            </p>
            <div className="mt-8 flex flex-col items-center gap-2 sm:items-start">
              <a
                href="/aanvraag"
                className="rounded-full bg-brand-oranje-donker px-6 py-3 font-medium text-white shadow-sm transition hover:opacity-90"
              >
                Begin met ontwerpen →
              </a>
              <p className="text-xs text-neutral-500">Gratis account nodig, duurt 1 minuut</p>
            </div>
          </div>
          <MediaPlaceholder label="SCREENSHOT OF VIDEO: ontwerptool in actie" />
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-brand-zwart sm:text-3xl">Zo kan jouw bord eruitzien</h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {VOORBEELDCATEGORIEEN.map((label) => (
            <MediaPlaceholder key={label} label={label} aspectClassName="aspect-square" />
          ))}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-brand-zwart sm:text-3xl">Wat kun je met de tool?</h2>
          <p className="mt-2 text-neutral-600">
            Alles wat je nodig hebt om zelf een professioneel reclamebord te ontwerpen, zonder
            ontwerpsoftware of voorkennis.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
          {VOORDELEN.map((voordeel) => (
            <div key={voordeel.titel} className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-groen/10 text-brand-groen">
                {voordeel.icoon}
              </div>
              <div>
                <h3 className="font-semibold text-brand-zwart">{voordeel.titel}</h3>
                <p className="mt-1 text-sm text-neutral-600">{voordeel.omschrijving}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-brand-zwart sm:text-3xl">Formaten en prijzen</h2>
        </div>
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-4">
          {FORMATEN.map((maat) => (
            <div key={maat} className="rounded-2xl border border-neutral-200 bg-white p-5 text-center">
              <p className="font-semibold text-brand-zwart">{maat}</p>
              <p className="mt-1 text-sm text-neutral-500">[PRIJS VANAF]</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-6 max-w-4xl space-y-1 text-center text-sm text-neutral-600">
          <p>1- of 2-zijdig bedrukt. Ook mogelijk: je bord in 2 delen.</p>
          <p>Levertijd ongeveer 3 weken (productie 5 werkdagen).</p>
          <p>Je krijgt altijd eerst een drukproef om goed te keuren, voordat er iets gedrukt wordt.</p>
        </div>
      </section>

      <section className="rounded-3xl bg-gradient-to-br from-green-50 via-white to-orange-50 px-6 py-12 sm:px-12">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 sm:items-center">
          <div>
            <p className="font-semibold uppercase tracking-wide text-brand-oranje-donker">Tijdsbesparing</p>
            <h2 className="mt-2 text-2xl font-semibold text-brand-zwart sm:text-3xl">
              Van idee tot drukproef, zonder te wachten
            </h2>
            <p className="mt-3 text-neutral-600">
              Geen e-mails heen en weer sturen om kleine aanpassingen door te geven. Jij bepaalt
              zelf hoe je bord eruitziet en past alles meteen zelf aan. Pas als je helemaal
              tevreden bent, verstuur je &rsquo;m.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <dt className="text-3xl font-semibold text-brand-groen-donker">10 min</dt>
              <dd className="mt-1 text-sm text-neutral-600">om zelf een compleet ontwerp samen te stellen</dd>
            </div>
            <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <dt className="text-3xl font-semibold text-brand-groen-donker">[X] werkdagen</dt>
              <dd className="mt-1 text-sm text-neutral-600">van goedkeuring tot levering</dd>
            </div>
          </dl>
        </div>
      </section>

      <section>
        <h2 className="text-center text-2xl font-semibold text-brand-zwart sm:text-3xl">Zo werkt het</h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {STAPPEN.map((stap, index) => (
            <div key={stap.titel} className="rounded-2xl border border-neutral-200 bg-white p-6">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand-groen-donker text-sm font-semibold text-white">
                {index + 1}
              </div>
              <h3 className="font-semibold text-brand-zwart">{stap.titel}</h3>
              <p className="mt-2 text-sm text-neutral-600">{stap.omschrijving}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <a
            href="/aanvraag"
            className="rounded-full bg-brand-oranje-donker px-6 py-3 font-medium text-white shadow-sm transition hover:opacity-90"
          >
            Begin met ontwerpen →
          </a>
          <p className="text-xs text-neutral-500">Gratis account nodig, duurt 1 minuut</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold text-brand-zwart">Al eerder een bord laten maken?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-600">
          Maak een gratis account aan en zie al je aanvragen en hun status op één plek terug, zodat
          je niet hoeft te bellen of mailen om te weten waar je bestelling staat.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/account-aanmaken"
            className="rounded-full bg-brand-groen-donker px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            Account aanmaken
          </a>
          <a
            href="/inloggen"
            className="text-sm font-medium text-brand-zwart underline hover:text-brand-groen"
          >
            Ik heb al een account
          </a>
        </div>
      </section>

      {VERTROUWEN.overOnsTekst && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-center sm:p-8">
          <h2 className="text-xl font-semibold text-brand-zwart">Gedrukt door De Mediagraaf in Oudewater</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-600">{VERTROUWEN.overOnsTekst}</p>

          {VERTROUWEN.klantLogos.length > 0 && (
            <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-6">
              {VERTROUWEN.klantLogos.map((logo) => (
                // eslint-disable-next-line @next/next/no-img-element -- klantlogo's zijn losse, extern aangeleverde bestanden, geen vaste breedte/hoogte nodig
                <img key={logo.naam} src={logo.afbeelding} alt={logo.naam} className="h-10 w-auto grayscale" />
              ))}
            </div>
          )}

          {VERTROUWEN.reviews.length > 0 && (
            <div className="mx-auto mt-6 grid max-w-xl gap-4 sm:grid-cols-2">
              {VERTROUWEN.reviews.map((review) => (
                <div key={review.naam} className="rounded-xl bg-neutral-50 p-4 text-left text-sm">
                  <p className="text-neutral-700">&ldquo;{review.tekst}&rdquo;</p>
                  <p className="mt-2 font-medium text-brand-zwart">{review.naam}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function IconPenseel(): ReactNode {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
      <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
    </svg>
  );
}

function IconRaster(): ReactNode {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconOog(): ReactNode {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconBestand(): ReactNode {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}
