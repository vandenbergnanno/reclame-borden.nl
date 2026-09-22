import type { Veldtype } from "@/lib/types/domain";

export interface GenerateDesignInput {
  aanvraagId: string;
  veldtype: Veldtype;
  wens: string;
}

export interface GenerateDesignResult {
  opslaglocatie: string;
  status: "concept";
}

// TODO: vervang dit door een echte koppeling met een beeldgeneratie-model (bijv. Replicate
// of fal.ai), gefinetuned op de bestaande, niet-AI-gemaakte designs van De Mediagraaf
// (zie de `designdatabase`-tabel). Belangrijk voor die koppeling: het model tekent alleen
// de achtergrond/stijl — tekst, logo en contactgegevens worden hier nooit door gerenderd,
// maar apart en volgens vaste regels op het ontwerp geplaatst.
// Deze placeholder geeft nu een vaste testafbeelding terug zodat de rest van de flow
// (opslag in `designs`, tonen in het interne overzicht) al gebouwd en getest kan worden.
export function generateDesign(_input: GenerateDesignInput): GenerateDesignResult {
  return {
    opslaglocatie: "placeholder/testafbeelding.png",
    status: "concept",
  };
}
