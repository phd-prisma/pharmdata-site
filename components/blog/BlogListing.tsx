import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { imageUrl } from "@/lib/admin/client-utils";
import { BLOG_PATH, categoryPath, formatPostDate, listCategories } from "@/lib/blog/content";
import { postPath, type PostSummary } from "@/lib/sanity/getPosts";
import type { SiteSettings } from "@/lib/sanity/types";

export function BlogListing({
  settings,
  posts,
  categories,
  title,
  activeCategory,
}: {
  settings: SiteSettings;
  posts: PostSummary[];
  // Todos os artigos: o menu de categorias não muda com o filtro
  categories: PostSummary[];
  title: string;
  activeCategory?: string;
}) {
  const menu = listCategories(categories.map((post) => post.category));

  return (
    <>
      <Header settings={settings} anchorsBase="/" showBlog />
      <main className="wrap blog-index">
        <header>
          <span className="eyebrow">Blog</span>
          <h1 className="h2">{title}</h1>
        </header>
        {menu.length > 0 && (
          <nav className="blog-categories" aria-label="Categorias">
            <Link href={BLOG_PATH} aria-current={activeCategory ? undefined : "page"}>Todos</Link>
            {menu.map((category) => (
              <Link
                key={category.slug}
                href={categoryPath(category.name)}
                aria-current={activeCategory === category.slug ? "page" : undefined}
              >
                {category.name}
              </Link>
            ))}
          </nav>
        )}
        {posts.length === 0
          ? <p className="blog-empty">Em breve, novos artigos por aqui.</p>
          : (
              <ul className="blog-list">
                {posts.map((post) => {
                  const cover = imageUrl(post.coverImage, 800, 450);
                  return (
                    <li key={post._id} className="blog-item">
                      <Link href={postPath(post.slug)}>
                        <div>
                          <p className="post-meta">
                            {post.category && `${post.category} · `}
                            {formatPostDate(post.publishedAt)} · {post.minutes} min de leitura
                          </p>
                          <h2>{post.title}</h2>
                          {post.excerpt && <p className="excerpt">{post.excerpt}</p>}
                        </div>
                        {cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt={post.coverImage?.alt ?? ""} width={800} height={450} loading="lazy" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
      </main>
      <Footer settings={settings} />
    </>
  );
}
