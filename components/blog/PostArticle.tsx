import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { imageUrl } from "@/lib/admin/client-utils";
import {
  BLOG_CTA_EVENT,
  categoryPath,
  countWords,
  formatPostDate,
  imageDimensions,
  type PostBody,
  type PostImage,
  readingMinutes,
  safeHref,
} from "@/lib/blog/content";

// Mesmo componente na página pública e na prévia do painel: o que aparece
// enquanto se escreve é exatamente o que vai para o site

/* eslint-disable @next/next/no-img-element */
const components: PortableTextComponents = {
  block: {
    normal: ({ value, children }) => <p data-block={value._key}>{children}</p>,
    h2: ({ value, children }) => <h2 data-block={value._key}>{children}</h2>,
    h3: ({ value, children }) => <h3 data-block={value._key}>{children}</h3>,
    blockquote: ({ value, children }) => <blockquote data-block={value._key}>{children}</blockquote>,
  },
  listItem: ({ value, children }) => <li data-block={value._key}>{children}</li>,
  marks: {
    link: ({ value, children }) => {
      const href = safeHref(value?.href);
      if (!href) return <>{children}</>;
      const external = /^https?:/i.test(href);
      return (
        <a href={href} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }: { value: PostImage }) => {
      const src = imageUrl(value, 1440);
      if (!src) return null;
      const size = imageDimensions(value.asset?._ref);
      return (
        <figure data-block={value._key}>
          <img src={src} alt={value.alt ?? ""} loading="lazy" {...size} />
          {value.caption && <figcaption>{value.caption}</figcaption>}
        </figure>
      );
    },
  },
};

export function PostBodyContent({ body }: { body: PostBody | undefined }) {
  if (!body?.length) return null;
  return <PortableText value={body as never} components={components} onMissingComponent={false} />;
}

export function PostArticle({
  title,
  excerpt,
  category,
  coverImage,
  author,
  publishedAt,
  body,
  cta,
  placeholders,
}: {
  title?: string;
  excerpt?: string;
  category?: string;
  coverImage?: PostImage;
  author?: { name?: string; role?: string };
  publishedAt?: string;
  body?: PostBody;
  cta?: { label: string; href: string };
  // Na prévia, mostra um aviso nos campos ainda vazios
  placeholders?: boolean;
}) {
  const minutes = readingMinutes(countWords(body));
  const cover = imageUrl(coverImage, 1600, 900);

  return (
    <article className="post-article">
      <header className="post-head">
        <p className="post-meta">
          {category?.trim() && (
            <>
              <a href={categoryPath(category)}>{category.trim()}</a>
              <span aria-hidden> · </span>
            </>
          )}
          {publishedAt ? formatPostDate(publishedAt) : placeholders ? "Data da publicação" : null}
          <span aria-hidden> · </span>
          {minutes} min de leitura
        </p>
        <h1>{title || (placeholders ? <span className="post-empty">Título do artigo</span> : null)}</h1>
        {excerpt && <p className="post-excerpt">{excerpt}</p>}
        {author?.name && (
          <p className="post-author">
            <strong>{author.name}</strong>
            {author.role && <span>{author.role}</span>}
          </p>
        )}
      </header>

      {cover && (
        <figure className="post-cover">
          <img src={cover} alt={coverImage?.alt ?? ""} width={1600} height={900} fetchPriority="high" />
        </figure>
      )}

      <div className="post-body">
        {body?.length
          ? <PostBodyContent body={body} />
          : placeholders && <p className="post-empty">O texto aparece aqui conforme você escreve.</p>}
      </div>

      {cta && (
        <aside className="post-cta">
          <p>Quer entender como isso se aplica à sua operação?</p>
          <a href={cta.href} className="post-cta-btn" data-umami-event={BLOG_CTA_EVENT}>
            {cta.label}
          </a>
        </aside>
      )}
    </article>
  );
}
