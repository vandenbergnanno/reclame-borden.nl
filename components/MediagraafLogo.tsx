import Image from "next/image";

// Het echte beeldmerk van De Mediagraaf (het mannetje-met-hoge-hoed-logo + wordmark), gehaald uit
// de ontwerptool (lib/ontwerptool/reclamebord-maker.html) — zie public/mediagraaf-logo.png.
const HOOGTE = {
  sm: 36,
  lg: 128,
} as const;

// Oorspronkelijke afbeelding is 192 x 330.
const VERHOUDING = 192 / 330;

export function MediagraafLogo({ size = "sm" }: { size?: keyof typeof HOOGTE }) {
  const hoogte = HOOGTE[size];
  const breedte = Math.round(hoogte * VERHOUDING);

  return (
    <Image
      src="/mediagraaf-logo.png"
      alt="De Mediagraaf"
      width={breedte}
      height={hoogte}
      style={{ height: hoogte, width: breedte }}
      priority
    />
  );
}
