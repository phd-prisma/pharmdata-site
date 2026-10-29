import type { HomeContent } from "@/lib/sanity/types";

// Dados estruturados (schema.org) da página inicial. Buscadores e assistentes
// de IA usam isso para entender quem é a empresa, o que ela oferece e as
// respostas da FAQ, sem depender de interpretar o layout.

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://pharmdata.com.br"
).replace(/\/$/, "");

// Temas que o próprio site cita como especialidade
const KNOWS_ABOUT = [
  "Informação de medicamentos",
  "Dados regulatórios de medicamentos",
  "Curadoria farmacêutica",
  "Interoperabilidade em saúde",
  "Padronização semântica de medicamentos",
  "IDMP",
  "ANVISA",
  "CMED",
  "SNCR",
];

export function buildStructuredData({ settings, home, team }: HomeContent) {
  const orgId = `${siteUrl}/#organization`;

  const people = team
    .filter((member) => member.name)
    .map((member) => ({
      "@type": "Person",
      "name": member.name,
      "jobTitle": member.role || undefined,
      "sameAs": member.linkedinUrl ? [member.linkedinUrl] : undefined,
      "worksFor": { "@id": orgId },
    }));
  const founders = people.filter((person) => /fundador|fundadora|founder/i.test(person.jobTitle ?? ""));

  const faq = home.faq.items.filter((item) => item.question && item.answer);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": orgId,
      "name": settings.brandName,
      "url": siteUrl,
      "logo": `${siteUrl}/apple-icon.png`,
      "description": settings.description,
      "slogan": settings.footerTagline || undefined,
      "email": settings.contactEmail || undefined,
      "sameAs": settings.linkedinUrl ? [settings.linkedinUrl] : undefined,
      "areaServed": { "@type": "Country", "name": "Brasil" },
      "knowsAbout": KNOWS_ABOUT,
      "founder": founders.length ? founders : undefined,
      "employee": people.length ? people : undefined,
      "contactPoint": settings.contactEmail
        ? {
            "@type": "ContactPoint",
            "contactType": "sales",
            "email": settings.contactEmail,
            "availableLanguage": "Portuguese",
            "areaServed": "BR",
          }
        : undefined,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      "url": siteUrl,
      "name": settings.brandName,
      "description": settings.description,
      "inLanguage": "pt-BR",
      "publisher": { "@id": orgId },
    },
    {
      "@type": "Service",
      "@id": `${siteUrl}/#service`,
      "name": home.hero.eyebrow || settings.footerTagline,
      "serviceType": "Dados regulatórios de medicamentos",
      "description": home.hero.text,
      "provider": { "@id": orgId },
      "areaServed": { "@type": "Country", "name": "Brasil" },
      "audience": { "@type": "BusinessAudience", "audienceType": "Organizações de saúde e tecnologia" },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": home.solution.title,
        "itemListElement": home.solution.steps.map((step) => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": step.title,
            "description": [step.description, step.output].filter(Boolean).join(" "),
          },
        })),
      },
    },
  ];

  if (faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      "inLanguage": "pt-BR",
      "mainEntity": faq.map((item) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": { "@type": "Answer", "text": item.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

// JSON.stringify não escapa "<"; sem isso um texto do CMS poderia fechar o <script>
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
