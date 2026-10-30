// Funções puras sobre o conteúdo dos artigos, usadas no site e no painel

export const BLOG_PATH = "/blog";

// Eventos do Umami. As métricas do blog são calculadas a partir deles
export const BLOG_READ_EVENT = "blog-leitura-completa";
export const BLOG_CTA_EVENT = "cta-blog-artigo";

export interface PostImage {
  _type?: string;
  _key?: string;
  asset?: { _ref: string; _type?: string };
  alt?: string;
  caption?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PostBody = Record<string, any>[];

export function plainText(body: PostBody | undefined) {
  return (body ?? [])
    .filter((block) => block._type === "block")
    .map((block) =>
      ((block.children ?? []) as { text?: string }[]).map((child) => child.text ?? "").join(""))
    .join("\n");
}

export function countWords(body: PostBody | undefined) {
  return plainText(body).split(/\s+/).filter(Boolean).length;
}

const WORDS_PER_MINUTE = 200;

export const readingMinutes = (words: number) => Math.max(1, Math.round(words / WORDS_PER_MINUTE));

// Aceita o traço final para não atrapalhar a digitação; `slugify` remove depois
export const slugifyTyping = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 96);

export const slugify = (value: string) => slugifyTyping(value).replace(/-+$/, "");

export const isValidSlug = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);

// Só libera endereços navegáveis: "javascript:" colado em um link não pode virar clique
export function safeHref(href: unknown) {
  if (typeof href !== "string") return undefined;
  const value = href.trim();
  return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value) ? value : undefined;
}

// Completa "site.com.br" digitado sem protocolo
export function normalizeHref(value: string) {
  const href = value.trim();
  if (!href) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("/") || href.startsWith("#")) return href;
  return href.includes("@") ? `mailto:${href}` : `https://${href}`;
}

// image-<id>-1200x800-png → dimensões, para o navegador reservar o espaço da imagem
export function imageDimensions(ref: string | undefined) {
  const match = ref?.match(/-(\d+)x(\d+)-[a-z0-9]+$/);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : undefined;
}

export const categoryPath = (name: string) => `${BLOG_PATH}/categoria/${slugify(name)}`;

// Categorias sem repetição: grafias com o mesmo endereço ("Regulatório", "regulatorio") são uma só
export function listCategories(names: (string | null | undefined)[]) {
  const bySlug = new Map<string, string>();
  for (const raw of names) {
    const name = raw?.trim();
    if (name && slugify(name) && !bySlug.has(slugify(name))) bySlug.set(slugify(name), name);
  }
  return [...bySlug]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export const formatPostDate = (iso: string) => dateFormat.format(new Date(iso));
