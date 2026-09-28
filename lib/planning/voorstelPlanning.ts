// Het voorstel (concept-ontwerp) wordt bewust niet meteen na het indienen gegenereerd en
// verstuurd, ook al zou dat straks technisch binnen enkele seconden kunnen. Een reactie na
// 1 minuut verraadt meteen dat er een AI achter zit; met 45 minuten tot een uur vertraging
// oogt het alsof een medewerker er echt naar gekeken heeft.
export const VOORSTEL_VERTRAGING_MINUTEN = { min: 45, max: 60 } as const;

// Berekent een willekeurig tijdstip binnen die bandbreedte, vanaf het opgegeven moment
// (standaard nu). Wordt bij het indienen van een aanvraag opgeslagen in
// `aanvragen.voorstel_gepland_op`.
export function berekenVoorstelGeplandOp(vanaf: Date = new Date()): Date {
  const { min, max } = VOORSTEL_VERTRAGING_MINUTEN;
  const minuten = min + Math.random() * (max - min);
  return new Date(vanaf.getTime() + minuten * 60_000);
}
