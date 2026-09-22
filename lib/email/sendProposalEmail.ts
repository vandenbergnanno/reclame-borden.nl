export interface SendProposalEmailInput {
  klantEmail: string;
  aanvraagId: string;
  designUrl: string;
}

export interface SendProposalEmailResult {
  verzonden: boolean;
  reden: string;
}

// TODO: vervang dit door een echte koppeling met Resend (of een vergelijkbare e-maildienst)
// om de klant een e-mail te sturen met het concept-ontwerp en een link om goed te keuren
// of feedback te geven. Deze placeholder verzendt niets, maar bestaat zodat de rest van de
// flow (design klaar -> klant informeren) al een duidelijke aansluiting heeft.
export function sendProposalEmail(input: SendProposalEmailInput): SendProposalEmailResult {
  console.log(
    `[placeholder] sendProposalEmail: zou een voorstel-e-mail sturen naar ${input.klantEmail} voor aanvraag ${input.aanvraagId} (${input.designUrl}).`
  );

  return {
    verzonden: false,
    reden: "sendProposalEmail is nog een placeholder; er is nog geen e-maildienst gekoppeld.",
  };
}
