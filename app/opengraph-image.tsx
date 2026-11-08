import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Next.js herkent dit bestand automatisch en zet de juiste og:image/twitter:image-meta erbij --
// geen los afbeeldingsbestand nodig. Simpele huisstijl-afbeelding (logo + merkkleuren + naam),
// zodat een gedeelde link in WhatsApp/LinkedIn er verzorgd uitziet in plaats van helemaal geen
// voorbeeld te tonen.
//
// Het logo zelf (public/mediagraaf-logo.png) als base64 data-URI inlezen -- ImageResponse kan
// geen relatief bestandspad laden, en een absolute URL zou het eigen domein moeten kennen. Vereist
// de Node.js-runtime (niet de standaard edge-runtime van next/og) voor bestandstoegang, zelfde
// reden als app/aanvraag/route.ts.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const logoBuffer = await readFile(path.join(process.cwd(), "public/mediagraaf-logo.png"));
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;

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
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og's ImageResponse rendert zelf naar PNG, next/image is hier niet van toepassing */}
          <img src={logoDataUrl} width={116} height={200} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 64, fontWeight: 700, color: "#111111" }}>reclame-borden</span>
              <span style={{ fontSize: 64, fontWeight: 700, color: "#5FB238" }}>.nl</span>
            </div>
            <div style={{ marginTop: 16, fontSize: 28, color: "#E8792A", fontWeight: 600 }}>
              Ontwerp zelf je reclamebord
            </div>
          </div>
        </div>
        <div style={{ width: "100%", height: 16, backgroundColor: "#5FB238", marginTop: 56 }} />
      </div>
    ),
    size
  );
}
