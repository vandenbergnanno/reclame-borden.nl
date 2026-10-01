import { STANDAARD_AFMETINGEN, type BordAanschaf } from "@/lib/types/domain";
import type { ContentCheckResult } from "./analyzeRequest";

// Bij een nieuw bord in een afwijkende maat (niet een van de standaardmaten) weet de tool niet of
// De Mediagraaf zo'n bord daadwerkelijk bij de leverancier kan bestellen. Dit houdt de
// aanvraagflow zelf niet tegen (het voorstel wordt gewoon automatisch gegenereerd en verstuurd
// zoals altijd) — het toont alleen een "Te controleren"-signaal op het interne overzicht, zodat
// een medewerker dit kan nagaan. Bij "hergebruiken" speelt dit niet: de klant heeft het bord al,
// er hoeft dan niets besteld te worden.
export function controleerAfmetingBeschikbaarheid(
  bordAanschaf: BordAanschaf,
  afmeting: string
): ContentCheckResult | null {
  const isStandaardmaat = (STANDAARD_AFMETINGEN as readonly string[]).includes(afmeting);

  if (bordAanschaf === "nieuw" && !isStandaardmaat) {
    return {
      probleem: "afwijkende maat bij nieuw bord",
      geblokkeerd: true,
      toelichting: `Controleer of een nieuw bord van ${afmeting} besteld kan worden bij de leverancier.`,
    };
  }

  return null;
}
