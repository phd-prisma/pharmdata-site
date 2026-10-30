import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogListing } from "@/components/blog/BlogListing";
import { categoryPath, listCategories, slugify } from "@/lib/blog/content";
import { getHomeContent } from "@/lib/sanity/getHomeContent";
import { getPosts } from "@/lib/sanity/getPosts";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function findCategory(slug: string) {
  const posts = await getPosts();
  const category = listCategories(posts.map((post) => post.category)).find((item) => item.slug === slug);
  return { posts, category };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [{ category }, { settings }] = await Promise.all([findCategory(slug), getHomeContent()]);
  if (!category) return {};
  const title = `${category.name} | Blog | ${settings.brandName}`;
  const description = `Artigos sobre ${category.name} no blog da ${settings.brandName}.`;
  return {
    title,
    description,
    alternates: { canonical: categoryPath(category.name) },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: categoryPath(category.name),
      siteName: settings.brandName,
      title,
      description,
      images: [{ url: settings.ogImageUrl ?? "/og", width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params;
  const [{ posts, category }, { settings }] = await Promise.all([findCategory(slug), getHomeContent()]);
  if (!category) notFound();

  return (
    <BlogListing
      settings={settings}
      posts={posts.filter((post) => post.category && slugify(post.category) === slug)}
      categories={posts}
      title={category.name}
      activeCategory={slug}
    />
  );
}
