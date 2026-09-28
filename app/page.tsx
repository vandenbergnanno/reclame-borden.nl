export default function HomePage() {
  return (
    <div className="space-y-6 text-center sm:text-left">
      <h1 className="text-3xl font-semibold text-brand-zwart">Welkom bij De Mediagraaf Conceptor</h1>
      <p className="mx-auto max-w-2xl text-neutral-600 sm:mx-0">
        Vraag hier eenvoudig een ontwerp voor je reclamebord aan. Vertel ons kort je wens en welk
        type veld het is, en De Mediagraaf gaat ermee aan de slag. Je krijgt een concept-ontwerp
        terug dat je gewoon kunt goedkeuren — of van feedback voorzien als het nog niet helemaal
        klopt.
      </p>
      <div className="flex justify-center gap-4 sm:justify-start">
        <a
          href="/aanvraag"
          className="rounded bg-brand-groen px-5 py-2.5 font-medium text-white hover:opacity-90"
        >
          Nieuwe aanvraag indienen
        </a>
      </div>
      <p className="text-sm text-neutral-500">
        Ben je van De Mediagraaf?{" "}
        <a href="/intern" className="font-medium text-brand-zwart underline hover:text-brand-groen">
          Bekijk het interne overzicht
        </a>
        .
      </p>
    </div>
  );
}
