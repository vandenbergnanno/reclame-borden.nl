import { VELDTYPE_LABELS, type Veldtype } from "@/lib/types/domain";

export interface VoorstelEmailInput {
  klantNaam: string;
  veldtype: Veldtype;
  afmeting: string;
  /** Volledige URL (e-mailclients laden geen relatieve paden). */
  designUrl: string;
  /** Volledige URL naar de publieke voorstelpagina (/voorstel/[id]). */
  voorstelUrl: string;
  /**
   * True wanneer dit een herzien concept is naar aanleiding van afwijzende klantfeedback (zie
   * app/api/aanvragen/[id]/feedback/route.ts), zodat de mail dat ook benoemt in plaats van te
   * doen alsof het de eerste keer is.
   */
  isHerzien?: boolean;
}

export interface VoorstelEmailContent {
  onderwerp: string;
  html: string;
  text: string;
}

const GROEN = "#5FB238";
const ZWART = "#111111";

// Simpele, met de hand geschreven HTML-e-mail (tabellen + inline styles, zoals gebruikelijk voor
// e-mailclients die weinig CSS ondersteunen). Bevat geen door AI gegenereerde tekst of afbeelding
// die niet klopt: de gegevens komen rechtstreeks uit de aanvraag.
export function bouwVoorstelEmail(input: VoorstelEmailInput): VoorstelEmailContent {
  const veldtypeLabel = VELDTYPE_LABELS[input.veldtype] ?? input.veldtype;
  const onderwerp = input.isHerzien
    ? "Je herziene concept-ontwerp van reclame-borden.nl is klaar!"
    : "Je concept-ontwerp van reclame-borden.nl is klaar!";
  const introTekst = input.isHerzien
    ? `We hebben je feedback verwerkt en een nieuw concept-ontwerp gemaakt voor jouw <strong>${veldtypeLabel}</strong> (${input.afmeting}). Bekijk het hieronder.`
    : `Goed nieuws! We hebben een concept-ontwerp gemaakt voor jouw <strong>${veldtypeLabel}</strong> (${input.afmeting}). Bekijk het hieronder.`;

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
                <span style="color:#ffffff;font-size:16px;font-weight:bold;">reclame-borden.nl <span style="color:${GROEN};">Conceptor</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="font-size:16px;margin:0 0 12px;">Hoi ${input.klantNaam},</p>
                <p style="font-size:14px;line-height:1.5;margin:0 0 16px;">
                  ${introTekst}
                </p>
                <img
                  src="${input.designUrl}"
                  alt="Concept-ontwerp"
                  width="432"
                  style="width:100%;max-width:432px;border-radius:8px;display:block;margin:0 0 20px;"
                />
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:6px;background-color:${GROEN};">
                      <a
                        href="${input.voorstelUrl}"
                        style="display:inline-block;padding:12px 20px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;"
                        >Bekijk en reageer op je voorstel</a
                      >
                    </td>
                  </tr>
                </table>
                <p style="font-size:12px;color:#666666;margin:20px 0 0;">
                  Op die pagina kun je het ontwerp goedkeuren, of feedback geven als er nog iets
                  moet veranderen.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background-color:#fafafa;">
                <p style="font-size:11px;color:#999999;margin:0;">reclame-borden.nl — Oudewater</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Hoi ${input.klantNaam},`,
    "",
    input.isHerzien
      ? `We hebben je feedback verwerkt en een nieuw concept-ontwerp gemaakt voor jouw ${veldtypeLabel} (${input.afmeting}).`
      : `Goed nieuws! We hebben een concept-ontwerp gemaakt voor jouw ${veldtypeLabel} (${input.afmeting}).`,
    "",
    `Bekijk je voorstel en reageer erop via: ${input.voorstelUrl}`,
    "",
    "Met vriendelijke groet,",
    "reclame-borden.nl",
  ].join("\n");

  return { onderwerp, html, text };
}
