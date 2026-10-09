import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ADMIN_BASE } from "@/lib/admin/paths";
import { Providers } from "@/lib/providers";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://pharmdata.com.br",
  ),
  title: "Pharmdata — Infraestrutura de dados regulatórios de medicamentos",
  description:
    "Especialistas em informação de medicamentos no Brasil, entregando dados estruturados e interoperáveis com curadoria contínua.",
};

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
const umamiScriptUrl =
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim() || "https://cloud.umami.is/script.js";

export const viewport: Viewport = {
  themeColor: "#002a2d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${sourceSerif4.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
      {umamiWebsiteId && (
        // Não conta visitas ao painel e ao Studio
        <Script id="umami-filter" strategy="beforeInteractive">
          {`window.pdUmamiFilter=function(type,payload){return /^\\/(${ADMIN_BASE.slice(1)}|studio)(\\/|$)/.test(location.pathname)?false:payload}`}
        </Script>
      )}
      {umamiWebsiteId && (
        <Script
          src={umamiScriptUrl}
          data-website-id={umamiWebsiteId}
          data-before-send="pdUmamiFilter"
          strategy="afterInteractive"
        />
      )}
    </html>
  );
}
