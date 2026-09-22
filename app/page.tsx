export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-brand-zwart">Conceptor — fundament</h1>
      <p className="text-neutral-700">
        Dit is de basis van de tool waarmee klanten van De Mediagraaf zelf een ontwerpwens voor
        een reclamebord kunnen indienen, en waar intern de status van aanvragen gevolgd kan
        worden. Deze versie bevat nog geen echte AI-koppelingen — alleen de structuur,
        het datamodel en een werkend formulier met opslag.
      </p>
      <div className="flex gap-4">
        <a
          href="/aanvraag"
          className="rounded bg-brand-groen px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Nieuwe aanvraag indienen
        </a>
        <a
          href="/intern"
          className="rounded border border-brand-zwart px-4 py-2 font-medium text-brand-zwart hover:bg-neutral-100"
        >
          Intern overzicht
        </a>
      </div>
    </div>
  );
}
