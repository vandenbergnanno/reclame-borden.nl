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

// Heeft de klant zelf al een bruikbaar bord staan, of moet er een nieuwe komen? Relevant voor
// De Mediagraaf omdat een nieuw bord (materiaal + montage) extra kosten met zich meebrengt.
export const BORD_AANSCHAF_OPTIES = ["hergebruiken", "nieuw"] as const;

export type BordAanschaf = (typeof BORD_AANSCHAF_OPTIES)[number];

export const BORD_AANSCHAF_LABELS: Record<BordAanschaf, string> = {
  hergebruiken: "Ik heb al een bruikbaar bord — hergebruiken",
  nieuw: "Ik wil een nieuw bord aanschaffen",
};

export const AANVRAAG_STATUSSEN = [
  "nieuw",
  "in_behandeling",
  "voorstel_verstuurd",
  "goedgekeurd",
  "afgewezen",
  "geescaleerd",
  "gemaakt",
] as const;

export type AanvraagStatus = (typeof AANVRAAG_STATUSSEN)[number];

export const AANVRAAG_STATUS_LABELS: Record<AanvraagStatus, string> = {
  nieuw: "Nieuw",
  in_behandeling: "In behandeling",
  voorstel_verstuurd: "Voorstel verstuurd",
  goedgekeurd: "Goedgekeurd",
  afgewezen: "Afgewezen",
  geescaleerd: "Geëscaleerd",
  gemaakt: "Klaar voor levering",
};

// Eén plek voor de statuskleuren, zodat de statustabbladen, tabelbadges en detailpagina er
// allemaal hetzelfde uitzien.
export const AANVRAAG_STATUS_KLEUREN: Record<AanvraagStatus, string> = {
  nieuw: "bg-blue-100 text-blue-700",
  in_behandeling: "bg-amber-100 text-amber-700",
  voorstel_verstuurd: "bg-purple-100 text-purple-700",
  goedgekeurd: "bg-green-100 text-green-700",
  afgewezen: "bg-red-100 text-red-700",
  geescaleerd: "bg-orange-100 text-orange-700",
  gemaakt: "bg-teal-100 text-teal-700",
};

// Simpel, apart doorstuur-pad voor de productiekant ("inkomend" -> "in behandeling" ->
// "gemaakt"), los van de klant-goedkeuringsflow (voorstel_verstuurd/goedgekeurd/afgewezen). Elke
// status hier heeft een knoplabel voor de eenknops-doorstuuractie in het interne overzicht.
export const VOLGENDE_PRODUCTIESTATUS: Partial<Record<AanvraagStatus, { status: AanvraagStatus; label: string }>> = {
  nieuw: { status: "in_behandeling", label: "Start behandeling" },
  in_behandeling: { status: "gemaakt", label: "Markeer als klaar voor levering" },
};

// Nederlandse provincies, gebruikt om te bepalen waar een klant/bord naartoe moet. De klant kiest
// dit zelf in het aanvraagformulier (zie `klanten.provincie`).
export const PROVINCIES = [
  "Drenthe",
  "Flevoland",
  "Friesland",
  "Gelderland",
  "Groningen",
  "Limburg",
  "Noord-Brabant",
  "Noord-Holland",
  "Overijssel",
  "Utrecht",
  "Zeeland",
  "Zuid-Holland",
] as const;

export type Provincie = (typeof PROVINCIES)[number];

export const DESIGN_STATUSSEN = ["concept", "definitief", "vervangen"] as const;

export type DesignStatus = (typeof DESIGN_STATUSSEN)[number];
