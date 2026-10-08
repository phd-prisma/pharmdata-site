import type { SiteSettings } from "@/lib/sanity/types";

export function Header({ settings }: { settings: SiteSettings }) {
  return (
    <header className="header">
      <div className="wrap">
        <a href="#top" className="logo">
          {settings.brandName}
        </a>
        <nav className="nav">
          {settings.navigation.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a href={settings.headerCta.href} className="btn btn-primary">
          {settings.headerCta.label}
        </a>
      </div>
    </header>
  );
}
