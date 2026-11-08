// Voorkomt een open redirect wanneer een ?van=/?daarna=-querystring na het inloggen bepaalt waar
// je naartoe gaat: zo'n waarde komt rechtstreeks van de bezoeker (en kan dus in een phishinglink
// staan), nooit vertrouwen zonder controle. "/evil.com" is een onschuldig eigen pad, maar
// "//evil.com" en "/\evil.com" worden door browsers als protocol-relatieve URL naar een ANDER
// domein behandeld, en een waarde met "://" erin kan een complete, externe URL zijn.
export function veiligPad(pad: string | null | undefined, terugval = "/"): string {
  if (!pad) return terugval;
  if (!pad.startsWith("/")) return terugval;
  if (pad.startsWith("//") || pad.startsWith("/\\")) return terugval;
  if (pad.includes("://")) return terugval;
  return pad;
}
