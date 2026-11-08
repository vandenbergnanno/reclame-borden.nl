// Tijdelijke, gedeelde-wachtwoord-poort vóór de HELE site (zie middleware.ts), zolang
// reclame-borden.nl nog niet echt publiek live is -- los van en bovenop de bestaande
// /intern-poort (lib/auth/internSessie.ts). Weer verwijderen zodra de site echt live gaat.
export const SITE_SESSIE_COOKIE = "mediagraaf_site_toegang";
// 30 dagen: dit is een lichte "kom er maar in"-poort voor testers/begeleider, geen gevoelige
// sessie, dus een lang-levende cookie is hier prettiger dan steeds opnieuw inloggen.
export const SITE_SESSIE_MAX_LEEFTIJD_SECONDEN = 60 * 60 * 24 * 30;
