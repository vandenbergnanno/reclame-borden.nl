// Domeintypes die in de hele applicatie worden hergebruikt (frontend, API-routes, placeholders).
// Dit is de bron van waarheid voor de toegestane waarden — de database-CHECK-constraints
// in supabase/migrations moeten hiermee in lijn blijven.

export const PRODUCTTYPEN = ["reclamebord", "visitekaartje", "bord-andere-maat"] as const;

export type Producttype = (typeof PRODUCTTYPEN)[number];

export const PRODUCTTYPE_LABELS: Record<Producttype, string> = {
  reclamebord: "Reclamebord",
  visitekaartje: "Visitekaartje",
  "bord-andere-maat": "Bord in een andere maat",
};

// Veldtypen zijn alleen van toepassing als producttype "reclamebord" is (borden langs een
// voetbal-/hockeyveld, scorebord of plattegrond). Bij "visitekaartje" en "bord-andere-maat"
// blijft dit veld leeg.
export const VELDTYPEN = [
  "voetbal-zijlijn",
  "hockeyveld",
  "scorebord",
  "plattegrond",
] as const;

export type Veldtype = (typeof VELDTYPEN)[number];

export const VELDTYPE_LABELS: Record<Veldtype, string> = {
  "voetbal-zijlijn": "Voetbalveld (zijlijn)",
  hockeyveld: "Hockeyveld",
  scorebord: "Scorebord",
  plattegrond: "Plattegrond",
};

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
