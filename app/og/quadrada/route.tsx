import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Imagem quadrada da página para buscadores (primaryImageOfPage no JSON-LD).
// O Google recorta a imagem em quadrado nos cartões de fonte da visão geral
// por IA; aqui a marca fica centralizada e legível mesmo em miniatura.
export const dynamic = "force-static";

const serif = await readFile(join(process.cwd(), "app/og/fonts/SourceSerif4-Medium.ttf"));
const mark = await readFile(join(process.cwd(), "public/icons/web-app-manifest-512x512.png"));
const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

export function GET() {
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
          gap: 48,
          background: "#f3f1eb",
          color: "#002a2d",
          fontFamily: "Source Serif 4",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markSrc} width={560} height={560} alt="" />
        <div style={{ fontSize: 150, letterSpacing: "-0.02em", lineHeight: 1 }}>Pharmdata</div>
      </div>
    ),
    {
      width: 1200,
      height: 1200,
      fonts: [{ name: "Source Serif 4", data: serif, style: "normal", weight: 500 }],
    },
  );
}
