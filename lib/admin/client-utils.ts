import { createImageUrlBuilder } from "@sanity/image-url";
import { ADMIN_BASE } from "@/lib/admin/paths";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

const builder = createImageUrlBuilder({ projectId, dataset });

export function imageUrl(ref: string | undefined, width: number, height?: number) {
  if (!ref) return undefined;
  const image = builder.image(ref).width(width).auto("format");
  return (height ? image.height(height).fit("crop") : image.fit("max")).url();
}

// file-<id>-<ext> → URL pública do arquivo no CDN do Sanity
export function fileUrl(ref: string | undefined) {
  const match = ref?.match(/^file-(.+)-([a-z0-9]+)$/);
  if (!match) return undefined;
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${match[1]}.${match[2]}`;
}

const relative = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function timeAgo(iso: string | undefined) {
  if (!iso) return "";
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "agora";
}

export function newKey() {
  return Math.random().toString(36).slice(2, 12);
}

export async function uploadFile(file: File, kind: "image" | "file") {
  const body = new FormData();
  body.set("file", file);
  body.set("kind", kind);
  const response = await fetch(`${ADMIN_BASE}/api/upload`, { method: "POST", body });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Falha no upload");
  return data as { _id: string; url: string; originalFilename?: string };
}
