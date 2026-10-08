import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pharmdata",
    short_name: "Pharmdata",
    description: "Especialistas em informação de medicamentos no Brasil.",
    id: "/",
    start_url: "/",
    display: "standalone",
    theme_color: "#002a2d",
    background_color: "#f3f1eb",
    icons: [
      {
        src: "/icons/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
