import { STANDAARD_AFMETINGEN, type BordAanschaf } from "@/lib/types/domain";
import type { ContentCheckResult } from "./analyzeRequest";

// Bij een nieuw bord in een afwijkende maat (niet een van de standaardmaten) weet de tool niet of
// De Mediagraaf zo'n bord daadwerkelijk bij de leverancier kan bestellen. Dat moet een medewerker
// handmatig checken vóórdat er een voorstel naar de klant gaat — vandaar escalatie in plaats van
// gewoon doorgaan alsof het geen probleem is. Bij "hergebruiken" speelt dit niet: de klant heeft
// het bord al, er hoeft dan niets besteld te worden.
export function controleerAfmetingBeschikbaarheid(
  bordAanschaf: BordAanschaf,
  afmeting: string
): ContentCheckResult | null {
  const isStandaardmaat = (STANDAARD_AFMETINGEN as readonly string[]).includes(afmeting);

  if (bordAanschaf === "nieuw" && !isStandaardmaat) {
    return {
      probleem: "afwijkende maat bij nieuw bord",
      geblokkeerd: true,
      toelichting: `Controleer of een nieuw bord van ${afmeting} besteld kan worden bij de leverancier voordat het voorstel wordt verstuurd.`,
    };
  }

  return null;
}
