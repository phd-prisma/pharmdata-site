import { cache } from "react";
import { defaultContent } from "@/lib/content/defaults";
import { sanityClient } from "./client";
import { urlForImage, urlForLogo, urlForOgImage } from "./imageUrl";
import { HOME_CONTENT_QUERY } from "./queries";
import type { HomeContent, SiteSettingsQueryResult } from "./types";

function isEmpty(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

// Mesmo formato do valor, com textos e listas vazios.
function blank<T>(value: T): T {
  if (typeof value === "string") return "" as T;
  if (Array.isArray(value)) return [] as T;
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, blank(item)]),
    ) as T;
  }
  return value;
}

// Preenche com o padrão tudo que não foi cadastrado no Sanity, campo a campo.
// Listas preenchidas no Sanity substituem a lista padrão inteira; campos
// vazios dentro de um item ficam vazios em vez de herdar o texto de outro item.
function withFallback<T>(fallback: T, value: unknown): T {
  if (isEmpty(value)) return fallback;
  if (Array.isArray(fallback)) {
    if (!Array.isArray(value)) return fallback;
    const itemShape = blank(fallback[0]);
    return value.map((item) =>
      itemShape === undefined ? item : withFallback(itemShape, item),
    ) as T;
  }
  if (typeof fallback === "object" && fallback !== null) {
    if (typeof value !== "object" || Array.isArray(value)) return fallback;
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = { ...source };
    for (const [key, fallbackValue] of Object.entries(fallback)) {
      result[key] = withFallback(fallbackValue, source[key]);
    }
    return result as T;
  }
  return typeof value === typeof fallback ? (value as T) : fallback;
}

type HomeContentQueryResult = Partial<Omit<HomeContent, "settings">> & {
  settings?: SiteSettingsQueryResult | null;
};

async function fetchHomeContent(): Promise<HomeContentQueryResult | null> {
  if (!sanityClient) return null;
  try {
    // Sem cache de dados do Next: a página já é dinâmica e precisa do conteúdo atual
    return await sanityClient.fetch<HomeContentQueryResult>(
      HOME_CONTENT_QUERY,
      {},
      { cache: "no-store" },
    );
  } catch (error) {
    console.error("Falha ao buscar conteúdo no Sanity:", error);
    return null;
  }
}

export const getHomeContent = cache(async (): Promise<HomeContent> => {
  const data = await fetchHomeContent();

  const team = isEmpty(data?.team)
    ? defaultContent.team
    : data!.team!.map((member) => ({
        ...member,
        photoUrl: urlForImage(member.photo),
      }));

  const { privacyPolicyFileUrl, termsFileUrl, ...settings } =
    data?.settings ?? {};

  return {
    settings: {
      ...withFallback(defaultContent.settings, settings),
      ...(privacyPolicyFileUrl && { privacyPolicyUrl: privacyPolicyFileUrl }),
      ...(termsFileUrl && { termsUrl: termsFileUrl }),
      ogImageUrl: urlForOgImage(settings.ogImage),
    },
    home: withFallback(defaultContent.home, data?.home),
    team,
    partners: isEmpty(data?.partners)
      ? defaultContent.partners
      : data!.partners!.map((partner) => ({
          ...partner,
          logoUrl: urlForLogo(partner.logo),
        })),
  };
});
