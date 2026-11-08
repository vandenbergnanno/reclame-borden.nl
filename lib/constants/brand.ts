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

// Vertrouwenssectie op de homepage ("Gedrukt door De Mediagraaf in Oudewater", zie app/page.tsx).
// De hele sectie rendert alleen als overOnsTekst niet leeg is -- zo staat er nooit een leeg blok
// live. klantLogos/reviews zijn optioneel en schuiven er vanzelf bij zodra ze gevuld zijn.
export const VERTROUWEN = {
  overOnsTekst: "",
  klantLogos: [] as { naam: string; afbeelding: string }[],
  reviews: [] as { tekst: string; naam: string }[],
};
