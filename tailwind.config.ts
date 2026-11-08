import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          groen: "#5FB238",
          oranje: "#E8792A",
          zwart: "#111111",
          // Donkerder dan de "echte" merkkleuren hierboven, alleen voor tekst die tegen wit
          // moet opvallen (of wit dat tegen deze kleur moet opvallen) -- #5FB238/#E8792A geven
          // daarvoor zelf maar ≈2.65:1 / ≈2.92:1 contrast (WCAG AA wil minimaal 4.5:1 voor
          // gewone tekst), wat op een telefoon in fel licht al snel onleesbaar wordt. Deze twee
          // halen ≈4.9:1 / ≈5.5:1 en blijven herkenbaar dezelfde kleurfamilie.
          "groen-donker": "#3E7F22",
          "oranje-donker": "#A8501A",
        },
      },
    },
  },
  plugins: [],
};

export default config;
