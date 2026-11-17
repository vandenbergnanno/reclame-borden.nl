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
  overOnsTekst:
    "reclame-borden.nl is een site van De Mediagraaf, drukkerij in Oudewater. Je ontwerp komt bij ons binnen, je krijgt een drukproef en pas na jouw akkoord gaat het bord in productie.",
  klantLogos: [] as { naam: string; afbeelding: string }[],
  reviews: [] as { tekst: string; naam: string }[],
};

// Beeld op de homepage (app/page.tsx). De schermafbeelding is van de ontwerptool zelf; de
// voorbeeldborden zijn in diezelfde tool gemaakt (dus precies wat een klant ook kan maken) en de
// bedrijven erop zijn verzonnen -- dat staat er op de pagina ook bij. Een bord vervangen of
// toevoegen: zet het plaatje in public/home/ en vul hier de echte breedte/hoogte in pixels in.
export const HOMEPAGE_MEDIA = {
  hero: {
    afbeelding: "/home/ontwerptool.webp",
    breedte: 2880,
    hoogte: 1496,
    alt: "De ontwerptool: een reclamebord van een bakkerij waarvan de naam wordt aangepast",
  },
  voorbeeldBorden: [
    { soort: "Bakkerij", formaat: "300 × 80 cm", afbeelding: "/home/bord-bakkerij.webp", breedte: 1800, hoogte: 480 },
    { soort: "Autobedrijf", formaat: "300 × 80 cm", afbeelding: "/home/bord-autobedrijf.webp", breedte: 1800, hoogte: 480 },
    { soort: "Hovenier", formaat: "320 × 80 cm", afbeelding: "/home/bord-hovenier.webp", breedte: 1800, hoogte: 450 },
    { soort: "Timmerbedrijf", formaat: "300 × 70 cm", afbeelding: "/home/bord-timmerbedrijf.webp", breedte: 1800, hoogte: 420 },
    { soort: "Cafetaria, sponsorbord", formaat: "300 × 80 cm", afbeelding: "/home/bord-cafetaria.webp", breedte: 1800, hoogte: 480 },
    { soort: "Kapsalon", formaat: "244 × 61 cm", afbeelding: "/home/bord-kapsalon.webp", breedte: 1800, hoogte: 450 },
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
