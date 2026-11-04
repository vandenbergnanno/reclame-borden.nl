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
// reclame-borden.nl daadwerkelijk als standaard voert. Vervang deze lijst zodra dat bekend is.
// De klant kan in het formulier altijd ook zelf een afmeting intypen via "Anders, namelijk...".
export const STANDAARD_AFMETINGEN = ["200 x 100 cm", "300 x 100 cm", "400 x 100 cm", "600 x 100 cm"] as const;

// Sentinel-waarde voor de "Anders, namelijk..."-optie in het formulier. Wordt nooit als
// zodanig opgeslagen: bij deze keuze vult de klant zelf de vrije tekst in `afmeting` in.
export const AFMETING_ANDERS = "anders" as const;

// Heeft de klant zelf al een bruikbaar bord staan, of moet er een nieuwe komen? Relevant voor
// reclame-borden.nl omdat een nieuw bord (materiaal + montage) extra kosten met zich meebrengt.
export const BORD_AANSCHAF_OPTIES = ["hergebruiken", "nieuw"] as const;

export type BordAanschaf = (typeof BORD_AANSCHAF_OPTIES)[number];

export const BORD_AANSCHAF_LABELS: Record<BordAanschaf, string> = {
  hergebruiken: "Ik heb al een bruikbaar bord — hergebruiken",
  nieuw: "Ik wil een nieuw bord aanschaffen",
};

// Bewust geen aparte "goedgekeurd"/"afgewezen"/"geëscaleerd"-statussen meer: een contentcheck
// escaleert niet langer naar een apart wachtvakje (de check blijft gewoon zichtbaar als "Te
// controleren"-signaal, zie content_checks), en de klantreactie op een voorstel is geen
// doodlopend eindpunt meer — goedkeuring stuurt de aanvraag direct door naar "nieuw" (de
// productieflow), afwijzing laat de AI automatisch een herzien concept terugmailen terwijl de
// aanvraag gewoon "voorstel_verstuurd" blijft. De klantreactie zelf blijft wel bewaard, als rij
// in de `feedback`-tabel (zie `feedback.goedgekeurd`).
export const AANVRAAG_STATUSSEN = ["nieuw", "in_behandeling", "voorstel_verstuurd", "gemaakt"] as const;

export type AanvraagStatus = (typeof AANVRAAG_STATUSSEN)[number];

export const AANVRAAG_STATUS_LABELS: Record<AanvraagStatus, string> = {
  nieuw: "Nieuw",
  in_behandeling: "In behandeling",
  voorstel_verstuurd: "Voorstel verstuurd",
  gemaakt: "Klaar voor levering",
};

// Eén plek voor de statuskleuren, zodat de statustabbladen, tabelbadges en detailpagina er
// allemaal hetzelfde uitzien.
export const AANVRAAG_STATUS_KLEUREN: Record<AanvraagStatus, string> = {
  nieuw: "bg-blue-100 text-blue-700",
  in_behandeling: "bg-amber-100 text-amber-700",
  voorstel_verstuurd: "bg-purple-100 text-purple-700",
  gemaakt: "bg-teal-100 text-teal-700",
};

// /intern (Aanvragen) toont alleen de fysieke productieflow als vakjes: tegen de tijd dat een
// aanvraag hier binnenkomt, is het voorstel door de klant al goedgekeurd. De klant-mailflow zelf
// (voorstel versturen, wachten op reactie, eventueel herzien) staat apart op /intern/concepten.
export const PRODUCTIE_STATUSSEN: readonly AanvraagStatus[] = ["nieuw", "in_behandeling", "gemaakt"];

// /intern/concepten toont de aanvragen die nog in de klant-mailflow zitten: een voorstel is
// gegenereerd en verstuurd, en er wordt gewacht op (of gereageerd op) een klantreactie.
export const CONCEPT_STATUSSEN: readonly AanvraagStatus[] = ["voorstel_verstuurd"];

// Vanaf hoeveel afwijzingen op rij we een aanvraag als "loopt vast" bestempelen — de AI komt er
// kennelijk zelf niet uit, dus is het moment om een medewerker het te laten overnemen. Gedeeld
// tussen /intern/concepten (de lijst zelf) en de navigatieteller in layout.tsx.
export const LOOPT_VAST_VANAF = 2;

// Simpel, apart doorstuur-pad voor de productiekant ("inkomend" -> "in behandeling" ->
// "gemaakt"), los van de klant-mailflow (voorstel_verstuurd). Elke status hier heeft een
// knoplabel voor de eenknops-doorstuuractie in het interne overzicht.
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

// Vanaf hier: velden van de zelfbedieningsontwerptool (reclamebord-maker). Zie
// supabase/migrations/0002_ontwerptool.sql.

export const BEDRUKKING_OPTIES = ["Enkelzijdig", "Dubbelzijdig"] as const;

export type Bedrukking = (typeof BEDRUKKING_OPTIES)[number];

export const LEVERING_OPTIES = ["Bezorgen", "Zelf ophalen in Oudewater"] as const;

export type Levering = (typeof LEVERING_OPTIES)[number];

// Eén meegestuurd bestand dat niet het hoofd-drukbestand/voorbeeld is: een logo dat de klant op
// het bord heeft gezet, of een losse bijlage ("nog een bestand meesturen"). Zie
// aanvragen.overige_bestanden.
export interface OverigBestand {
  naam: string;
  pad: string;
}
