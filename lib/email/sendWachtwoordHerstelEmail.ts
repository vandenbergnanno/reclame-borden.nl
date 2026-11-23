import { Resend } from "resend";

const GROEN = "#4a7c2a";
const ZWART = "#111111";

export interface WachtwoordHerstelEmailResultaat {
  verzonden: boolean;
  reden: string;
}

function bouwEmail(herstelUrl: string): { onderwerp: string; html: string; text: string } {
  const onderwerp = "Nieuw wachtwoord kiezen voor reclame-borden.nl";
  // Het tijdstip maakt elke mail anders. Zonder dit zet Gmail een tweede, identieke mail in
  // hetzelfde gesprek en verbergt de inhoud als "herhaalde tekst" (alleen een •••-knopje).
  const tijdstip = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const text = [
    "Hoi,",
    "",
    `Je hebt op ${tijdstip} gevraagd om een nieuw wachtwoord voor je account bij reclame-borden.nl.`,
    "Via deze link kies je een nieuw wachtwoord:",
    "",
    herstelUrl,
    "",
    "De link werkt één keer en is een uur geldig.",
    "Heb je dit niet zelf aangevraagd? Dan hoef je niets te doen, je wachtwoord blijft zoals het was.",
    "",
    "Met vriendelijke groet,",
    "reclame-borden.nl",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background-color:#fafafa;font-family:Arial,Helvetica,sans-serif;color:${ZWART};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:${ZWART};padding:20px 24px;">
                <span style="color:#ffffff;font-size:16px;font-weight:bold;">reclame-borden.nl</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="font-size:16px;margin:0 0 12px;">Hoi,</p>
                <p style="font-size:14px;line-height:1.5;margin:0 0 20px;">
                  Je hebt op ${tijdstip} gevraagd om een nieuw wachtwoord voor je account bij reclame-borden.nl.
                  Klik op de knop om een nieuw wachtwoord te kiezen.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:6px;background-color:${GROEN};">
                      <a
                        href="${herstelUrl}"
                        style="display:inline-block;padding:12px 20px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;"
                        >Nieuw wachtwoord kiezen</a
                      >
                    </td>
                  </tr>
                </table>
                <p style="font-size:12px;line-height:1.5;color:#666666;margin:20px 0 0;">
                  De link werkt één keer en is een uur geldig. Heb je dit niet zelf aangevraagd?
                  Dan hoef je niets te doen, je wachtwoord blijft zoals het was.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background-color:#fafafa;">
                <p style="font-size:11px;color:#999999;margin:0;">reclame-borden.nl — De Mediagraaf, Oudewater</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { onderwerp, html, text };
}

// De herstelmail versturen we zelf via Resend (zelfde aanpak als lib/email/sendProposalEmail.ts)
// in plaats van via Supabase's eigen "Reset Password"-mail: zo is de tekst Nederlands, hoeft er
// in het Supabase-dashboard geen sjabloon of redirect-URL voor aangepast te worden, en werkt de
// link ook als de klant 'm op een ander apparaat opent dan waar hij 'm aanvroeg.
export async function sendWachtwoordHerstelEmail(
  email: string,
  herstelUrl: string
): Promise<WachtwoordHerstelEmailResultaat> {
  const { onderwerp, html, text } = bouwEmail(herstelUrl);

  // Alleen lokaal: de link ook in de console, zodat de flow te testen is zonder dat de mail
  // echt aankomt. Nooit in productie -- daar hoort een inloglink niet in de serverlogs.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[wachtwoord-herstel] link voor ${email}: ${herstelUrl}`);
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { verzonden: false, reden: "RESEND_API_KEY ontbreekt (zie .env.example)." };
  }

  const afzender = process.env.RESEND_AFZENDER ?? "reclame-borden.nl <onboarding@resend.dev>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from: afzender, to: email, subject: onderwerp, html, text });

  if (error) return { verzonden: false, reden: error.message };
  return { verzonden: true, reden: "Verstuurd via Resend." };
}
