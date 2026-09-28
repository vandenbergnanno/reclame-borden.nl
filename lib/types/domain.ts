// Domeintypes die in de hele applicatie worden hergebruikt (frontend, API-routes, placeholders).
// Dit is de bron van waarheid voor de toegestane waarden — de database-CHECK-constraints
// in supabase/migrations moeten hiermee in lijn blijven.

// Focus van de tool is puur reclameborden (beslissing van de stagebegeleider). "andere-maat" is
// geen apart product, maar een reclamebord dat niet in de standaardmaten van de andere opties
// past — bij die keuze vult de klant zelf een gewenste afmeting in (zie `afmeting` op aanvragen).
export const VELDTYPEN = [
  "voetbal-zijlijn",
  "hockeyveld",
  "scorebord",
  "plattegrond",
  "andere-maat",
] as const;

export type Veldtype = (typeof VELDTYPEN)[number];

export const VELDTYPE_LABELS: Record<Veldtype, string> = {
  "voetbal-zijlijn": "Voetbalveld (zijlijn)",
  hockeyveld: "Hockeyveld",
  scorebord: "Scorebord",
  plattegrond: "Plattegrond",
  "andere-maat": "Andere maat",
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
