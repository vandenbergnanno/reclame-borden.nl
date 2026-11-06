import { Resend } from "resend";

// Zelfde opzet als sendProposalEmail.ts: zonder RESEND_API_KEY wordt er alleen gelogd in plaats
// van echt verstuurd, zodat de rest van de aanpas-flow (zie app/api/aanvragen/[id]/klant-bewerken/route.ts)
// ook zonder Resend-account te testen blijft.
export interface KlantWijzigingInput {
  aanvraagId: string;
  klantNaam: string;
}

// Medewerker-adres, zelfde als de footer-contactgegevens (app/layout.tsx) en het privacybeleid --
// er is geen apart "medewerker-mailadres" in .env, dit is het enige adres dat reclame-borden.nl
// zelf gebruikt voor klantcontact.
const MEDEWERKER_ADRES = "info@demediagraaf.nl";

export async function sendKlantWijzigingNotificatie({ aanvraagId, klantNaam }: KlantWijzigingInput): Promise<void> {
  const onderwerp = `Klant heeft aanvraag aangepast — ${klantNaam}`;
  const basis = process.env.APP_URL ?? "http://localhost:3000";
  const link = new URL(`/intern/${aanvraagId}`, basis).toString();
  const text = `${klantNaam} heeft zijn aanvraag aangepast nadat deze al was ingediend.\n\nBekijk de aanvraag (met de vorige versie eronder): ${link}`;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log(`[placeholder] sendKlantWijzigingNotificatie: zou deze e-mail sturen naar ${MEDEWERKER_ADRES}\nOnderwerp: ${onderwerp}\n\n${text}`);
    return;
  }

  const afzender = process.env.RESEND_AFZENDER ?? "reclame-borden.nl <onboarding@resend.dev>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from: afzender, to: MEDEWERKER_ADRES, subject: onderwerp, text });

  if (error) {
    console.error(`[sendKlantWijzigingNotificatie] Resend gaf een fout voor aanvraag ${aanvraagId}:`, error);
  }
}
