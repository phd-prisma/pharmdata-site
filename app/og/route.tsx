import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Imagem de compartilhamento padrão, usada quando nenhuma é enviada no Sanity
export const dynamic = "force-static";

const fontsDir = join(process.cwd(), "app/og/fonts");
const serif = await readFile(join(fontsDir, "SourceSerif4-Medium.ttf"));
const mono = await readFile(join(fontsDir, "IBMPlexMono-Regular.ttf"));

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#002a2d",
          color: "#f3f1eb",
          fontFamily: "Source Serif 4",
        }}
      >
        <div style={{ fontSize: 44 }}>Pharmdata</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontFamily: "IBM Plex Mono",
              fontSize: 22,
              color: "#e2b36b",
              textTransform: "uppercase",
            }}
          >
            Infraestrutura de dados regulatórios de medicamentos
          </div>
          <div style={{ fontSize: 62, lineHeight: 1.1 }}>
            Informação de medicamentos, estruturada para o seu sistema.
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Source Serif 4", data: serif, style: "normal", weight: 500 },
        { name: "IBM Plex Mono", data: mono, style: "normal", weight: 400 },
      ],
    },
  );
}
