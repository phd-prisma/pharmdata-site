import "./site.css";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { Problem } from "@/components/sections/Problem";
import { Solution } from "@/components/sections/Solution";
import { Differentials } from "@/components/sections/Differentials";
import { Team } from "@/components/sections/Team";
import { Clients } from "@/components/sections/Clients";
import { Contact } from "@/components/sections/Contact";
import { Faq } from "@/components/sections/Faq";
import { getHomeContent } from "@/lib/sanity/getHomeContent";
import { hasPublishedPosts } from "@/lib/sanity/getPosts";
import { buildStructuredData, serializeJsonLd } from "@/lib/seo/structuredData";

// Renderiza a cada visita: o Amplify não persiste a revalidação (ISR) do Next 16,
// então o conteúdo publicado no Sanity aparece em segundos, sem novo deploy
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getHomeContent();
  const title = settings.siteTitle;
  const description = settings.description;
  const images = [
    { url: settings.ogImageUrl ?? "/og", width: 1200, height: 630, alt: title },
  ];

  return {
    title,
    description,
    applicationName: settings.brandName,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: "/",
      siteName: settings.brandName,
      title,
      description,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function Home() {
  const [content, showBlog] = await Promise.all([getHomeContent(), hasPublishedPosts()]);
  const { settings, home, team, partners } = content;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildStructuredData(content)) }}
      />
      <Header settings={settings} showBlog={showBlog} />
      <main>
        <Hero content={home.hero} />
        <Stats stats={home.stats} />
        <Problem content={home.problem} />
        <Solution content={home.solution} />
        <Differentials content={home.differentials} />
        <Team content={home.team} members={team} />
        <Clients content={home.clients} partners={partners} />
        <Faq content={home.faq} />
        <Contact content={home.contact} settings={settings} />
      </main>
      <Footer settings={settings} />
    </>
  );
}
