import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostArticle } from "@/components/blog/PostArticle";
import { PostReadTracker } from "@/components/blog/PostReadTracker";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { imageUrl } from "@/lib/admin/client-utils";
import { BLOG_PATH } from "@/lib/blog/content";
import { getHomeContent } from "@/lib/sanity/getHomeContent";
import { getPost, postPath } from "@/lib/sanity/getPosts";
import { buildPostStructuredData, serializeJsonLd } from "@/lib/seo/structuredData";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [post, { settings }] = await Promise.all([getPost(slug), getHomeContent()]);
  if (!post) return {};

  const title = post.seoTitle || `${post.title} | ${settings.brandName}`;
  const description = post.seoDescription || post.excerpt;
  const image = imageUrl(post.coverImage, 1200, 630) ?? settings.ogImageUrl ?? "/og";
  const images = [{ url: image, width: 1200, height: 630, alt: post.coverImage?.alt || post.title }];

  return {
    title,
    description,
    alternates: { canonical: postPath(post.slug) },
    openGraph: {
      type: "article",
      locale: "pt_BR",
      url: postPath(post.slug),
      siteName: settings.brandName,
      title,
      description,
      images,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const [post, { settings }] = await Promise.all([getPost(slug), getHomeContent()]);
  if (!post) notFound();

  const ctaHref = settings.headerCta.href.startsWith("#") ? `/${settings.headerCta.href}` : settings.headerCta.href;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildPostStructuredData(post, settings.brandName)) }}
      />
      <Header settings={settings} anchorsBase="/" showBlog />
      <main className="wrap post-page">
        <Link href={BLOG_PATH} className="post-back">← Todos os artigos</Link>
        <PostArticle
          title={post.title}
          excerpt={post.excerpt}
          category={post.category}
          coverImage={post.coverImage}
          author={post.author ?? undefined}
          publishedAt={post.publishedAt}
          body={post.body}
          cta={{ label: settings.headerCta.label, href: ctaHref }}
        />
        <PostReadTracker />
      </main>
      <Footer settings={settings} />
    </>
  );
}
