import type { MetadataRoute } from "next";
import { BLOG_PATH, categoryPath, listCategories } from "@/lib/blog/content";
import { getPosts, postPath } from "@/lib/sanity/getPosts";
import { siteUrl } from "@/lib/seo/structuredData";

// Artigo publicado entra no sitemap sem precisar de novo deploy
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    ...(posts.length
      ? [
          { url: `${siteUrl}${BLOG_PATH}`, changeFrequency: "weekly" as const, priority: 0.7 },
          ...listCategories(posts.map((post) => post.category)).map((category) => ({
            url: `${siteUrl}${categoryPath(category.name)}`,
            changeFrequency: "weekly" as const,
            priority: 0.5,
          })),
          ...posts.map((post) => ({
            url: `${siteUrl}${postPath(post.slug)}`,
            lastModified: post.updatedAt,
            priority: 0.6,
          })),
        ]
      : []),
  ];
}
