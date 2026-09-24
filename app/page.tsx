import { PRODUCTTYPEN, PRODUCTTYPE_LABELS, type Producttype } from "@/lib/types/domain";

const PRODUCT_OMSCHRIJVINGEN: Record<Producttype, string> = {
  reclamebord: "Langs het voetbal- of hockeyveld, als scorebord of plattegrond.",
  visitekaartje: "In jouw huisstijl, met logo en contactgegevens.",
  "bord-andere-maat": "Heb je iets dat niet in de standaardmaten past? Ook prima.",
};

export default function HomePage() {
  return (
    <div className="space-y-10">
      <div className="space-y-3 text-center sm:text-left">
        <h1 className="text-3xl font-semibold text-brand-zwart">
          Waar mogen we een ontwerp voor maken?
        </h1>
        <p className="mx-auto max-w-2xl text-neutral-600 sm:mx-0">
          Kies hieronder wat je nodig hebt, vertel ons kort je wens, en De Mediagraaf gaat ermee
          aan de slag. Je krijgt een concept-ontwerp terug dat je gewoon kunt goedkeuren — of van
          feedback voorzien als het nog niet helemaal klopt.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PRODUCTTYPEN.map((producttype) => (
          <a
            key={producttype}
            href={`/aanvraag?type=${producttype}`}
            className="group flex flex-col rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-groen hover:shadow-md"
          >
            <span className="text-lg font-semibold text-brand-zwart group-hover:text-brand-groen">
              {PRODUCTTYPE_LABELS[producttype]}
            </span>
            <span className="mt-2 text-sm text-neutral-600">
              {PRODUCT_OMSCHRIJVINGEN[producttype]}
            </span>
            <span className="mt-4 text-sm font-medium text-brand-groen">Start hier →</span>
          </a>
        ))}
      </div>

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
