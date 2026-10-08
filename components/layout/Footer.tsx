import type { SiteSettings } from "@/lib/sanity/types";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="brand">
          <span>{settings.brandName}</span>
          <span>{settings.footerTagline}</span>
        </div>
        <nav>
          <a href={settings.privacyPolicyUrl} target="_blank" rel="noopener">
            Política de Privacidade
          </a>
          <a href={settings.termsUrl} target="_blank" rel="noopener">
            Termos de Uso
          </a>
        </nav>
      </div>
    </footer>
  );
}
