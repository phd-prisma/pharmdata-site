import type { SiteSettings } from "@/lib/sanity/types";

import { BLOG_PATH } from "@/lib/blog/content";

export function Header({
  settings,
  anchorsBase = "",
  showBlog,
}: {
  settings: SiteSettings;
  // Fora da página inicial, as âncoras (#contato…) precisam apontar para ela
  anchorsBase?: string;
  showBlog?: boolean;
}) {
  const resolve = (href: string) => (href.startsWith("#") ? `${anchorsBase}${href}` : href);
  const hasBlogLink = settings.navigation.some((link) => link.href === BLOG_PATH);

  return (
    <header className="header">
      <div className="wrap">
        <a href={anchorsBase || "#top"} className="logo">
          {settings.brandName}
        </a>
        <nav className="nav">
          {settings.navigation.map((link) => (
            <a key={link.href} href={resolve(link.href)}>
              {link.label}
            </a>
          ))}
          {showBlog && !hasBlogLink && <a href={BLOG_PATH} data-umami-event="nav-blog">Blog</a>}
        </nav>
        <a href={resolve(settings.headerCta.href)} className="btn btn-primary" data-umami-event="cta-cabecalho">
          {settings.headerCta.label}
        </a>
      </div>
    </header>
  );
}
