// Domeintypes die in de hele applicatie worden hergebruikt (frontend, API-routes, placeholders).
// Dit is de bron van waarheid voor de toegestane waarden — de database-CHECK-constraints
// in supabase/migrations moeten hiermee in lijn blijven.

// Focus van de tool is puur reclameborden (beslissing van de stagebegeleider).
export const VELDTYPEN = ["voetbal-zijlijn", "hockeyveld", "scorebord", "plattegrond"] as const;

export type Veldtype = (typeof VELDTYPEN)[number];

export const VELDTYPE_LABELS: Record<Veldtype, string> = {
  "voetbal-zijlijn": "Voetbalveld (zijlijn)",
  hockeyveld: "Hockeyveld",
  scorebord: "Scorebord",
  plattegrond: "Plattegrond",
};

// TODO: dit zijn placeholder-afmetingen — de stagebegeleider bepaalt nog welke maten De
// Mediagraaf daadwerkelijk als standaard voert. Vervang deze lijst zodra dat bekend is.
// De klant kan in het formulier altijd ook zelf een afmeting intypen via "Anders, namelijk...".
export const STANDAARD_AFMETINGEN = ["200 x 100 cm", "300 x 100 cm", "400 x 100 cm", "600 x 100 cm"] as const;

// Sentinel-waarde voor de "Anders, namelijk..."-optie in het formulier. Wordt nooit als
// zodanig opgeslagen: bij deze keuze vult de klant zelf de vrije tekst in `afmeting` in.
export const AFMETING_ANDERS = "anders" as const;

export const AANVRAAG_STATUSSEN = [
  "nieuw",
  "in_behandeling",
  "voorstel_verstuurd",
  "goedgekeurd",
  "afgewezen",
  "geescaleerd",
] as const;

export type AanvraagStatus = (typeof AANVRAAG_STATUSSEN)[number];

export const AANVRAAG_STATUS_LABELS: Record<AanvraagStatus, string> = {
  nieuw: "Nieuw",
  in_behandeling: "In behandeling",
  voorstel_verstuurd: "Voorstel verstuurd",
  goedgekeurd: "Goedgekeurd",
  afgewezen: "Afgewezen",
  geescaleerd: "Geëscaleerd",
};

export const DESIGN_STATUSSEN = ["concept", "definitief", "vervangen"] as const;

export type DesignStatus = (typeof DESIGN_STATUSSEN)[number];
