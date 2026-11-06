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
