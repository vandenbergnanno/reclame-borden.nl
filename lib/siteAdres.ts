// Het adres waarop de bezoeker de site gebruikt, voor links in mails (wachtwoord vergeten,
// bevestigingsmail opnieuw). Niet `new URL(request.url).origin`: op Vercel is dat het interne
// adres van één bepaalde versie (iets als reclame-borden-xxxx.vercel.app), en dat zit achter een
// Vercel-login -- een klant kwam daar via de link in zijn mail op vast te zitten.
//
// Volgorde: de host waarmee de browser binnenkwam (Vercel zet die in x-forwarded-host; die kan
// alleen een domein zijn dat aan dit project hangt), anders de Host-header, anders request.url.
export function siteAdres(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host && /^[a-z0-9.-]+(:\d+)?$/i.test(host)) {
    const lokaal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
    return `${lokaal ? "http" : "https"}://${host}`;
  }
  return new URL(request.url).origin;
}
