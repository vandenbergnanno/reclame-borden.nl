import { MediagraafLogo } from "@/components/MediagraafLogo";

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

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-green-50 via-white to-orange-50 px-6 py-12 sm:px-12">
        <div className="mx-auto max-w-2xl text-center sm:text-left">
          <div className="mb-6 flex justify-center sm:justify-start">
            <MediagraafLogo size="lg" />
          </div>
          <h1 className="text-3xl font-semibold text-brand-zwart sm:text-4xl">
            Ontwerp je eigen reclamebord
          </h1>
          <p className="mt-4 text-neutral-600">
            Met onze gratis ontwerptool stel je zelf je reclamebord samen: kies een formaat, begin
            met een sjabloon of een leeg bord, en voeg je logo, tekst en kleuren toe. Je werkt
            rechtstreeks op een voorbeeld van je bord, en kunt alles verplaatsen, aanpassen of
            weghalen tot het klopt. Liever dat wij het voor je ontwerpen? Dat kan ook — stuur dan
            gewoon je logo en een korte omschrijving mee.
          </p>
          <div className="mt-6 flex justify-center sm:justify-start">
            <a
              href="/aanvraag"
              className="rounded bg-brand-groen px-5 py-2.5 font-medium text-white shadow-sm hover:opacity-90"
            >
              Begin met ontwerpen
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
