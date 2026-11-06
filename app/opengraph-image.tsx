import { ImageResponse } from "next/og";

// Next.js herkent dit bestand automatisch en zet de juiste og:image/twitter:image-meta erbij --
// geen los afbeeldingsbestand nodig. Simpele huisstijl-afbeelding (merkkleuren + naam), zodat een
// gedeelde link in WhatsApp/LinkedIn er verzorgd uitziet in plaats van helemaal geen voorbeeld te
// tonen.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111111",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 72, fontWeight: 700, color: "#ffffff" }}>reclame-borden</span>
          <span style={{ fontSize: 72, fontWeight: 700, color: "#5FB238" }}>.nl</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#E8792A", fontWeight: 600 }}>
          Ontwerp zelf je reclamebord
        </div>
      </div>
    ),
    size
  );
}
