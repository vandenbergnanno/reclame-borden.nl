export interface ContentCheckResult {
  probleem: string;
  geblokkeerd: boolean;
  toelichting: string;
}

// TODO: vervang deze trefwoorden-check door een echte Claude API-koppeling die de
// ingevoerde ontwerpwens analyseert op (a) contentregels (geen contactgegevens op een
// reclamebord) en (b) een korte briefanalyse voor de latere designgeneratie.
// Deze placeholder bestaat zodat het datamodel (content_checks) en de aanvraagflow
// nu al end-to-end werken, zonder afhankelijkheid van een externe AI-dienst.
export function analyzeRequest(wens: string): ContentCheckResult[] {
  const resultaten: ContentCheckResult[] = [];

  const bevatEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(wens);
  if (bevatEmail) {
    resultaten.push({
      probleem: "e-mailadres gedetecteerd",
      geblokkeerd: true,
      toelichting: "Contactgegevens zoals e-mailadressen horen niet op een reclamebord thuis.",
    });
  }

  const bevatTelefoonnummer = /(\+?\d[\s-]?){8,}/.test(wens);
  if (bevatTelefoonnummer) {
    resultaten.push({
      probleem: "telefoonnummer gedetecteerd",
      geblokkeerd: true,
      toelichting: "Er is een reeks cijfers gevonden die op een telefoonnummer lijkt.",
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
