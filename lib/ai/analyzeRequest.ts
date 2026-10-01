export interface ContentCheckResult {
  probleem: string;
  // Geen automatische afkeuring van de klant — dit toont alleen een "Te controleren"-signaal op
  // het interne overzicht, de aanvraag loopt er verder gewoon doorheen. Sommige klanten willen
  // bewust wél hun telefoonnummer op het bord; dat is een afweging die De Mediagraaf zelf per
  // klant maakt, niet iets wat de tool voor iedereen hard zou moeten afkeuren.
  geblokkeerd: boolean;
  toelichting: string;
}

// TODO: vervang deze trefwoorden-check door een echte Claude API-koppeling die de
// ingevoerde ontwerpwens analyseert op (a) contentregels (contactgegevens signaleren) en
// (b) een korte briefanalyse voor de latere designgeneratie.
// Deze placeholder bestaat zodat het datamodel (content_checks) en de aanvraagflow
// nu al end-to-end werken, zonder afhankelijkheid van een externe AI-dienst.
export function analyzeRequest(wens: string): ContentCheckResult[] {
  const resultaten: ContentCheckResult[] = [];

  const bevatEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(wens);
  if (bevatEmail) {
    resultaten.push({
      probleem: "e-mailadres gedetecteerd",
      geblokkeerd: true,
      toelichting: "Overleg met de klant of dit e-mailadres echt op het bord moet komen.",
    });
  }

  const bevatTelefoonnummer = /(\+?\d[\s-]?){8,}/.test(wens);
  if (bevatTelefoonnummer) {
    resultaten.push({
      probleem: "telefoonnummer gedetecteerd",
      geblokkeerd: true,
      toelichting: "Overleg met de klant of dit telefoonnummer echt op het bord moet komen.",
    });
  }

  if (resultaten.length === 0) {
    resultaten.push({
      probleem: "geen probleem gevonden",
      geblokkeerd: false,
      toelichting: "Placeholder-check (trefwoorden) heeft niets verdachts gevonden in de ingevoerde wens.",
    });
  }

  return resultaten;
}
