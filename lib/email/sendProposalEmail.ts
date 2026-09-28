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

// TODO: vervang dit door een echte koppeling met Resend (of een vergelijkbare e-maildienst) om
// de klant de hieronder opgebouwde e-mail daadwerkelijk te sturen. De inhoud (bouwVoorstelEmail)
// staat al klaar — deze placeholder logt 'm alleen naar de console.
export function sendProposalEmail(input: SendProposalEmailInput): SendProposalEmailResult {
  const { onderwerp, text } = bouwVoorstelEmail({
    klantNaam: input.klantNaam,
    veldtype: input.veldtype,
    afmeting: input.afmeting,
    designUrl: volledigeUrl(input.designUrl),
    voorstelUrl: volledigeUrl(`/voorstel/${input.aanvraagId}`),
  });

  console.log(
    `[placeholder] sendProposalEmail: zou deze e-mail sturen naar ${input.klantEmail}\nOnderwerp: ${onderwerp}\n\n${text}`
  );

  return {
    verzonden: false,
    reden: "sendProposalEmail is nog een placeholder; er is nog geen e-maildienst gekoppeld.",
  };
}
