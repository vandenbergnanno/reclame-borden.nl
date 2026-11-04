// Simpele gedeelde-wachtwoord-poort voor /intern: één wachtwoord voor iedereen bij
// reclame-borden.nl, geen individuele accounts. Voldoende voor dit stadium (nog geen Supabase-project,
// dus geen echte gebruikersdatabase). Vervang dit door Supabase Auth met per-medewerker accounts
// zodra er wel een project gekoppeld is — zie PROGRESS.md.
export const INTERN_SESSIE_COOKIE = "mediagraaf_intern_ingelogd";
export const INTERN_SESSIE_MAX_LEEFTIJD_SECONDEN = 60 * 60 * 12; // 12 uur
