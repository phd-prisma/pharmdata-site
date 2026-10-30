import { headers } from "next/headers";
import { cache } from "react";
import { BLOG_PATH, readingMinutes } from "@/lib/blog/content";
import type { PostBody, PostImage } from "@/lib/blog/content";
import { isBot, sanityCdnClient, sanityClient } from "./client";

export interface PostAuthor {
  name?: string;
  role?: string;
  linkedinUrl?: string;
}

export interface PostSummary {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  coverImage?: PostImage;
  publishedAt: string;
  updatedAt: string;
  author?: PostAuthor | null;
  minutes: number;
}

export interface Post extends PostSummary {
  body: PostBody;
  seoTitle?: string;
  seoDescription?: string;
}

const PUBLISHED = `_type == "post" && defined(slug.current) && defined(publishedAt) && !(_id in path("drafts.**"))`;

const SUMMARY = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  coverImage,
  publishedAt,
  "updatedAt": _updatedAt,
  "author": author->{ name, role, linkedinUrl },
  "words": length(string::split(pt::text(body), " "))
`;

const POSTS_QUERY = `*[${PUBLISHED}] | order(publishedAt desc) { ${SUMMARY} }`;
const POST_QUERY = `*[${PUBLISHED} && slug.current == $slug][0] { ${SUMMARY}, body, seoTitle, seoDescription }`;
const HAS_POSTS_QUERY = `count(*[${PUBLISHED}]) > 0`;

export const postPath = (slug: string) => `${BLOG_PATH}/${slug}`;

// Mesmo critério da página inicial: pessoas leem da API, robôs do CDN
async function client() {
  const userAgent = (await headers()).get("user-agent");
  return isBot(userAgent) ? sanityCdnClient : sanityClient;
}

type WithWords<T> = T & { words?: number | null };

function withMinutes<T extends PostSummary>({ words, ...post }: WithWords<T>) {
  return { ...post, minutes: readingMinutes(words ?? 0) } as unknown as T;
}

// Sem o Sanity, a lista fica vazia em vez de derrubar o sitemap e o llms.txt
export const getPosts = cache(async (): Promise<PostSummary[]> => {
  const sanity = await client();
  if (!sanity) return [];
  try {
    const posts = await sanity.fetch<WithWords<PostSummary>[]>(POSTS_QUERY, {}, { cache: "no-store" });
    return posts.map((post) => withMinutes(post));
  } catch (error) {
    console.error("Falha ao buscar artigos no Sanity:", error);
    return [];
  }
});

// Erro aqui sobe de propósito: responder 404 numa queda do Sanity tiraria o artigo do Google
export const getPost = cache(async (slug: string): Promise<Post | null> => {
  const sanity = await client();
  if (!sanity) return null;
  const post = await sanity.fetch<WithWords<Post> | null>(POST_QUERY, { slug }, { cache: "no-store" });
  return post ? withMinutes(post) : null;
});

export const hasPublishedPosts = cache(async () => {
  const sanity = await client();
  if (!sanity) return false;
  try {
    return await sanity.fetch<boolean>(HAS_POSTS_QUERY, {}, { cache: "no-store" });
  } catch {
    return false;
  }
});
