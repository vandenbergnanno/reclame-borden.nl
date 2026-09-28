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

// Belangrijk voor de echte koppeling: het model tekent alleen de achtergrond/stijl. Tekst, logo
// en contactgegevens worden hier nooit door gerenderd (AI-modellen zijn notoir slecht in
// leesbare tekst) — die komen apart en volgens vaste regels op het ontwerp, als losse
// tekst-/vectorelementen. Hoe de vrije tekst uit `wens` daarvoor wordt omgezet naar exacte
// tekstvelden (sponsornaam, slogan, ...) is nog een open ontwerpvraag — zie PROGRESS.md.
//
// Nog geen account/API-key bij een beeldgeneratie-dienst (stand: zie PROGRESS.md). Zolang
// REPLICATE_API_TOKEN ontbreekt, valt deze functie terug op de vaste testafbeelding, zodat de
// rest van de flow (opslag in `designs`, tonen in het interne overzicht) intussen gewoon te
// testen blijft. Zodra er een token is: vul `.env.local` in en implementeer
// `genereerAchtergrondMetReplicate` hieronder.
export async function generateDesign(input: GenerateDesignInput): Promise<GenerateDesignResult> {
  const replicateToken = process.env.REPLICATE_API_TOKEN;

  if (!replicateToken) {
    return {
      opslaglocatie: "placeholder/testafbeelding.png",
      status: "concept",
    };
  }

  const achtergrondUrl = await genereerAchtergrondMetReplicate(input, replicateToken);

  // TODO: hier de achtergrond ophalen en de tekst/logo/contactgegevens er als losse laag
  // overheen zetten (bijv. met `sharp` of een SVG-compositie), en het eindresultaat naar
  // Supabase Storage uploaden. Nu geven we de kale achtergrond-URL terug als tussenstap.
  return {
    opslaglocatie: achtergrondUrl,
    status: "concept",
  };
}

// TODO: implementeer de echte Replicate-aanroep zodra er een account/API-key is. Globale opzet:
// 1. Bouw een prompt uit `input.veldtype` en (het niet-tekstuele deel van) `input.wens`.
// 2. Gebruik idealiter een model dat gefinetuned/gestuurd is op de bestaande designs uit de
//    `designdatabase`-tabel (bijv. via image-to-image met een referentiedesign, of een eigen
//    getraind model) zodat het resultaat op de stijl van De Mediagraaf lijkt.
// 3. Roep de Replicate API aan (zie https://replicate.com/docs) en wacht het resultaat af.
async function genereerAchtergrondMetReplicate(
  _input: GenerateDesignInput,
  _replicateToken: string
): Promise<string> {
  throw new Error(
    "genereerAchtergrondMetReplicate is nog niet geïmplementeerd — REPLICATE_API_TOKEN stond aan maar de aanroep zelf ontbreekt nog."
  );
}
