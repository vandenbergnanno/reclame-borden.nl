import { MediagraafLogo } from "@/components/MediagraafLogo";

const STAPPEN = [
  {
    titel: "Vertel je wens",
    omschrijving: "Kies je veldtype en beschrijf kort wat er op het bord moet komen.",
  },
  {
    titel: "Wij ontwerpen",
    omschrijving: "De Mediagraaf gaat ermee aan de slag en stelt een concept-ontwerp op.",
  },
  {
    titel: "Jij keurt goed",
    omschrijving: "Prima? Klaar. Nog niet helemaal? Geef feedback en we passen het aan.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-green-50 via-white to-orange-50 px-6 py-12 sm:px-12">
        <div className="mx-auto max-w-2xl text-center sm:text-left">
          <div className="mb-6 flex justify-center sm:justify-start">
            <MediagraafLogo size="lg" />
          </div>
          <h1 className="text-3xl font-semibold text-brand-zwart sm:text-4xl">
            Welkom bij de Conceptor
          </h1>
          <p className="mt-4 text-neutral-600">
            Vraag hier eenvoudig een ontwerp voor je reclamebord aan. Vertel ons kort je wens en
            welk type veld het is, en De Mediagraaf gaat ermee aan de slag. Je krijgt een
            concept-ontwerp terug dat je gewoon kunt goedkeuren — of van feedback voorzien als het
            nog niet helemaal klopt.
          </p>
          <div className="mt-6 flex justify-center sm:justify-start">
            <a
              href="/aanvraag"
              className="rounded bg-brand-groen px-5 py-2.5 font-medium text-white shadow-sm hover:opacity-90"
            >
              Nieuwe aanvraag indienen
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {STAPPEN.map((stap, index) => (
          <div key={stap.titel} className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-groen text-sm font-semibold text-white">
              {index + 1}
            </div>
            <h2 className="font-semibold text-brand-zwart">{stap.titel}</h2>
            <p className="mt-1 text-sm text-neutral-600">{stap.omschrijving}</p>
          </div>
        ))}
      </section>

      <p className="text-center text-sm text-neutral-500 sm:text-left">
        Ben je van De Mediagraaf?{" "}
        <a href="/intern" className="font-medium text-brand-zwart underline hover:text-brand-groen">
          Bekijk het interne overzicht
        </a>
        .
      </p>
    </div>
  );
}
