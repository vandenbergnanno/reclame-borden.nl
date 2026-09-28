import { Resend } from "resend";
import type { Veldtype } from "@/lib/types/domain";
import { bouwVoorstelEmail } from "./voorstelEmailTemplate";

export interface SendProposalEmailInput {
  klantEmail: string;
  klantNaam: string;
  aanvraagId: string;
  veldtype: Veldtype;
  afmeting: string;
  /** Root-relatief (bijv. "/placeholder-ontwerp.svg") of al een volledige URL. */
  designUrl: string;
}

export interface SendProposalEmailResult {
  verzonden: boolean;
  reden: string;
}

// Basis-URL van de site, nodig omdat e-mailclients geen relatieve paden kunnen laden. Voor lokaal
// gebruik is localhost prima; zet APP_URL bij een echte deployment op het publieke domein.
function volledigeUrl(pad: string): string {
  if (pad.startsWith("http://") || pad.startsWith("https://")) return pad;
  const basis = process.env.APP_URL ?? "http://localhost:3000";
  return new URL(pad, basis).toString();
}

// Nog geen Resend-account/API-key (stand: zie PROGRESS.md). Zolang RESEND_API_KEY ontbreekt,
// logt deze functie de opgebouwde e-mail naar de console in plaats van 'm te versturen — de
// rest van de flow (aanvraag -> voorstel -> klant reageert) blijft zo gewoon te testen.
// Zodra er een key is: vul `.env.local` in (RESEND_API_KEY en RESEND_AFZENDER) en er wordt
// automatisch echt verstuurd, zonder verdere codewijziging nodig.
export async function sendProposalEmail(input: SendProposalEmailInput): Promise<SendProposalEmailResult> {
  const { onderwerp, html, text } = bouwVoorstelEmail({
    klantNaam: input.klantNaam,
    veldtype: input.veldtype,
    afmeting: input.afmeting,
    designUrl: volledigeUrl(input.designUrl),
    voorstelUrl: volledigeUrl(`/voorstel/${input.aanvraagId}`),
  });

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log(
      `[placeholder] sendProposalEmail: zou deze e-mail sturen naar ${input.klantEmail}\nOnderwerp: ${onderwerp}\n\n${text}`
    );

    return {
      verzonden: false,
      reden: "sendProposalEmail is nog een placeholder; RESEND_API_KEY ontbreekt (zie .env.example).",
    };
  }

  const afzender = process.env.RESEND_AFZENDER ?? "De Mediagraaf <onboarding@resend.dev>";
  const resend = new Resend(resendApiKey);

  const { error } = await resend.emails.send({
    from: afzender,
    to: input.klantEmail,
    subject: onderwerp,
    html,
    text,
  });

  if (error) {
    console.error(`[sendProposalEmail] Resend gaf een fout voor aanvraag ${input.aanvraagId}:`, error);
    return { verzonden: false, reden: error.message };
  }

  return { verzonden: true, reden: "Verstuurd via Resend." };
}
