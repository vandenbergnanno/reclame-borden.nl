import type { Bedrukking } from "@/lib/types/domain";

// Dezelfde prijzen per cm² als de rekentool op reclame-borden.nl/prijs-berekenen (teruggevonden via
// het ingebouwde Gravity Forms-rekenveld van die pagina) en als de prijsindicatie in de ontwerptool
// zelf (zie lib/ontwerptool/reclamebord-maker.html) -- hier gebruikt om een snelle schatting te
// geven van de omzet die in de openstaande aanvragen zit. Nadrukkelijk een schatting voor intern
// gebruik, geen officiële prijsberekening richting klanten.
const PRIJS_PER_CM2: Record<Bedrukking, number> = { Enkelzijdig: 0.0092, Dubbelzijdig: 0.0136 };

// "afmeting" is vrije tekst (bijv. "300 x 80 cm", of iets getypts bij "Eigen maat") -- dit pakt de
// eerste twee getallen eruit, in welke volgorde en met welk scheidingsteken dan ook geschreven.
function parseAfmetingCm(afmeting: string): { breedte: number; hoogte: number } | null {
  const match = afmeting.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/i);
  if (!match) return null;
  const breedte = Number(match[1].replace(",", "."));
  const hoogte = Number(match[2].replace(",", "."));
  if (!Number.isFinite(breedte) || !Number.isFinite(hoogte) || breedte <= 0 || hoogte <= 0) return null;
  return { breedte, hoogte };
}

// Geeft null als de afmeting niet te lezen viel (bijv. een heel ongebruikelijke eigen maat) --
// zo'n aanvraag telt dan niet mee in de schatting, in plaats van een onzinprijs te tonen.
export function schatPrijs(afmeting: string, aantal: number, bedrukking: Bedrukking): number | null {
  const maat = parseAfmetingCm(afmeting);
  if (!maat) return null;
  const prijsPerStuk = maat.breedte * maat.hoogte * PRIJS_PER_CM2[bedrukking];
  return Math.round(prijsPerStuk * Math.max(1, aantal));
}
