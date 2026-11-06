// Elke "aanvragen.id"/"klanten.id"/etc. is een Postgres uuid-kolom. Een route- of query-param die
// geen geldige UUID is (bijv. /voorstel/test) geeft Postgres zelf een harde fout ("invalid input
// syntax for type uuid") zodra die rechtstreeks in een .eq()-vergelijking terechtkomt -- die rauwe
// foutmelding hoort nooit naar de bezoeker te gaan. Dit filtert zulke waardes er al uit vóórdat de
// database wordt aangeroepen, zodat "geen geldige UUID" hetzelfde pad volgt als "bestaat niet".
const UUID_PATROON = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isGeldigeUuid(waarde: string): boolean {
  return UUID_PATROON.test(waarde);
}
