import type { AuthError } from "@supabase/supabase-js";
import { GENERIEKE_SERVERFOUT } from "./serverFout";

// Supabase Auth geeft bij signUp()/signInWithPassword() rauwe, Engelse foutmeldingen terug
// (error.message) -- die mogen nooit rechtstreeks naar de klant: deels omdat het Engels is, maar
// vooral omdat sommige (bijv. een mislukte mailserver) interne details verraden die een klant
// toch niets zeggen. error.code (zie @supabase/auth-js' ErrorCode-type) is waar mogelijk een
// betrouwbaardere basis dan de berichttekst zelf, die tussen Supabase-versies kan wijzigen.
//
// `loggen`: of dit de moeite waard is om naar Sentry te sturen. Een klant die een zwak wachtwoord
// kiest of al een account heeft, is geen systeemfout -- een mislukte bevestigingsmail of iets
// onverwachts wel.
export function vertaalSignupFout(
  error: AuthError
): { bericht: string; loggen: boolean; kanBevestigingOpnieuw: boolean } {
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return {
        bericht: "Dit e-mailadres heeft al een account. Log in, of vraag hieronder een nieuwe bevestigingsmail aan.",
        loggen: false,
        kanBevestigingOpnieuw: true,
      };
    case "weak_password":
      return { bericht: "Kies een sterker wachtwoord (minimaal 8 tekens).", loggen: false, kanBevestigingOpnieuw: false };
    case "email_address_invalid":
      return { bericht: "Vul een geldig e-mailadres in.", loggen: false, kanBevestigingOpnieuw: false };
    case "over_email_send_rate_limit":
      return {
        bericht: "Er zijn net te veel bevestigingsmails verstuurd. Probeer het over een paar minuten opnieuw.",
        loggen: false,
        kanBevestigingOpnieuw: false,
      };
  }
  // Geen eigen foutcode voor "de mailserver kon de bevestigingsmail niet versturen" -- Supabase
  // geeft dat als generieke 'unexpected_failure', dus die herkennen we aan de berichttekst.
  if (/sending confirmation email/i.test(error.message)) {
    return {
      bericht:
        "We konden je bevestigingsmail niet versturen. Probeer het over een paar minuten opnieuw of mail naar info@demediagraaf.nl.",
      loggen: true,
      kanBevestigingOpnieuw: true,
    };
  }
  return { bericht: GENERIEKE_SERVERFOUT, loggen: true, kanBevestigingOpnieuw: false };
}

export function vertaalLoginFout(
  error: AuthError
): { bericht: string; loggen: boolean; nietBevestigd: boolean; kanBevestigingOpnieuw: boolean } {
  if (error.code === "email_not_confirmed") {
    return {
      bericht: "Dit account is nog niet bevestigd. Check je e-mail, of vraag hieronder een nieuwe bevestigingsmail aan.",
      loggen: false,
      nietBevestigd: true,
      kanBevestigingOpnieuw: true,
    };
  }
  if (error.message === "Invalid login credentials") {
    return { bericht: "Onjuist e-mailadres of wachtwoord.", loggen: false, nietBevestigd: false, kanBevestigingOpnieuw: false };
  }
  return { bericht: GENERIEKE_SERVERFOUT, loggen: true, nietBevestigd: false, kanBevestigingOpnieuw: false };
}
