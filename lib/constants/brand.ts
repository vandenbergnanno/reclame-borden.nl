// Merkkleuren van reclame-borden.nl. Ook toegepast in tailwind.config.ts als `brand.groen` /
// `brand.oranje` / `brand.zwart` — gebruik die Tailwind-classes in components, en deze
// constanten alleen waar je de hex-waarde direct nodig hebt (bijv. buiten Tailwind).
export const BRAND_COLORS = {
  groen: "#5FB238",
  oranje: "#E8792A",
  zwart: "#111111",
} as const;

// Eén plek om het "Prototype"-label in de footer (app/layout.tsx) weer te geven of weg te halen,
// zodra de site echt live gaat voor klanten.
export const TOON_PROTOTYPE_LABEL = true;

// Contactgegevens voor de footer (app/layout.tsx) en het privacybeleid (app/privacybeleid/page.tsx) --
// één plek om in te vullen; leeg ("") betekent dat dat onderdeel daar simpelweg niet getoond wordt
// in plaats van een kaal "[ADRES]" op een live pagina te laten staan.
export const CONTACTGEGEVENS = {
  adres: "",
  telefoonnummer: "",
  kvkNummer: "",
} as const;

// Bewaartermijn voor het privacybeleid (app/privacybeleid/page.tsx) -- leeg totdat de gebruiker
// 'm zelf vaststelt (bijv. i.v.m. de fiscale bewaarplicht); dezelfde leeg/preview-aanpak als de
// homepage-placeholders in app/page.tsx (zie `toonPlaceholders` daar).
export const BEWAARTERMIJN = "";

// Vertrouwenssectie op de homepage ("Gedrukt door De Mediagraaf in Oudewater", zie app/page.tsx).
// De hele sectie rendert alleen als overOnsTekst niet leeg is -- zo staat er nooit een leeg blok
// live. klantLogos/reviews zijn optioneel en schuiven er vanzelf bij zodra ze gevuld zijn.
export const VERTROUWEN = {
  overOnsTekst: "",
  klantLogos: [] as { naam: string; afbeelding: string }[],
  reviews: [] as { tekst: string; naam: string }[],
};

// Homepage-content die nog ontbreekt (app/page.tsx) -- allemaal leeg totdat de gebruiker 'm invult.
// In productie laat een lege waarde hier het bijbehorende onderdeel (of de hele sectie) gewoon weg
// in plaats van een kale placeholdertekst te tonen; alleen in development, of met ?preview=1 in de
// URL, laat de pagina zien WAAR die content straks komt (zie `toonPlaceholders` in app/page.tsx).
export const HOMEPAGE_MEDIA = {
  heroAfbeelding: "",
  voorbeeldFotos: [
    { label: "FOTO: reclamebord bij sportveld", afbeelding: "" },
    { label: "FOTO: reclamebord bij bedrijfspand", afbeelding: "" },
    { label: "FOTO: reclamebord bij bouwproject", afbeelding: "" },
  ],
};

// Prijs-vanaf-tekst per standaardmaat (de maten zelf zijn echt, zie FORMATEN in app/page.tsx en
// lib/ontwerptool/reclamebord-maker.html -- de prijzen hiernaast zijn bewust placeholders, geen
// berekening uit de richtprijsformule van de ontwerptool, zie het overleg hierover).
export const PRIJZEN: Record<string, string> = {
  "300 × 80 cm": "",
  "320 × 80 cm": "",
  "300 × 70 cm": "",
  "244 × 61 cm": "",
};

// Eén waarde voor de levertijd, gebruikt op zowel de "Formaten en prijzen"-sectie als het
// tijdsbesparing-kaartje (app/page.tsx) -- bewust leeg totdat de gebruiker 'm zelf bevestigt, ook
// al staat een soortgelijke tekst al in de ontwerptool zelf (zie het overleg hierover).
export const LEVERTIJD = "";
