import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01";

const config = projectId ? { projectId, dataset, apiVersion } : null;

// Direto da API: conteúdo publicado aparece na hora (cota menor no Sanity)
export const sanityClient = config ? createClient({ ...config, useCdn: false }) : null;

// Via CDN: alguns segundos de atraso, mas cota 4x maior. Usado para robôs
export const sanityCdnClient = config ? createClient({ ...config, useCdn: true }) : null;

const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|linkedin|preview|embed|lighthouse|headless|monitor|uptime|curl|wget|python|axios|node-fetch|go-http/i;

export function isBot(userAgent: string | null) {
  return !userAgent || BOT_PATTERN.test(userAgent);
}
