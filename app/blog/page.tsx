import type { Metadata } from "next";
import { BlogListing } from "@/components/blog/BlogListing";
import { BLOG_PATH } from "@/lib/blog/content";
import { getHomeContent } from "@/lib/sanity/getHomeContent";
import { getPosts } from "@/lib/sanity/getPosts";

// Mesmo motivo da página inicial: publicado no painel, aparece sem novo deploy
export const dynamic = "force-dynamic";

const TITLE = "Blog";
const DESCRIPTION = "Artigos sobre informação de medicamentos, dados regulatórios e interoperabilidade em saúde.";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getHomeContent();
  const title = `${TITLE} | ${settings.brandName}`;
  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: BLOG_PATH },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: BLOG_PATH,
      siteName: settings.brandName,
      title,
      description: DESCRIPTION,
      images: [{ url: settings.ogImageUrl ?? "/og", width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function BlogPage() {
  const [{ settings }, posts] = await Promise.all([getHomeContent(), getPosts()]);
  return <BlogListing settings={settings} posts={posts} categories={posts} title={DESCRIPTION} />;
}
