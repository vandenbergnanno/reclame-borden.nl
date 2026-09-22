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
        },
      },
    },
  },
  plugins: [],
};

export default config;
