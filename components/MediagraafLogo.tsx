// TIJDELIJK beeldmerk in de merkkleuren van De Mediagraaf, tot het echte logo binnen is.
// Vervang dan simpelweg de inhoud van dit component door een <img>/<Image> die verwijst naar
// het bestand in /assets/brand — de rest van de app (header, homepage) hoeft niet aangepast te
// worden, die gebruiken allebei alleen <MediagraafLogo />.
const MAAT = {
  sm: { doos: "h-8 w-8", letter: "text-base", punt: "h-2.5 w-2.5", tekst: "text-base" },
  lg: { doos: "h-16 w-16", letter: "text-3xl", punt: "h-4 w-4", tekst: "text-2xl" },
} as const;

export function MediagraafLogo({
  size = "sm",
  metTekst = true,
  donkereAchtergrond = false,
}: {
  size?: keyof typeof MAAT;
  metTekst?: boolean;
  /** Zet op true wanneer het logo op een donkere achtergrond staat (bijv. de header). */
  donkereAchtergrond?: boolean;
}) {
  const maat = MAAT[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative flex ${maat.doos} shrink-0 items-center justify-center rounded-xl bg-brand-groen`}
      >
        <span className={`font-bold text-white ${maat.letter}`}>M</span>
        <span
          className={`absolute -right-1 -top-1 ${maat.punt} rounded-full border-2 border-white bg-brand-oranje`}
        />
      </div>
      {metTekst && (
        <span
          className={`font-semibold ${maat.tekst} ${donkereAchtergrond ? "text-white" : "text-brand-zwart"}`}
        >
          De Mediagraaf
        </span>
      )}
    </div>
  );
}
