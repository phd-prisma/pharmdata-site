import { getHomeContent } from "@/lib/sanity/getHomeContent";
import { getPosts, postPath } from "@/lib/sanity/getPosts";
import { siteUrl } from "@/lib/seo/structuredData";

// Resumo do site em Markdown para assistentes de IA (padrão llms.txt),
// montado a partir do mesmo conteúdo do Sanity que alimenta a página
export const dynamic = "force-dynamic";

export async function GET() {
  const [{ settings, home, team, partners }, posts] = await Promise.all([getHomeContent(), getPosts()]);
  const faq = home.faq.items.filter((item) => item.question && item.answer);
  const clients = partners.map((partner) => partner.name).filter(Boolean);

  const lines = [
    `# ${settings.brandName}`,
    "",
    `> ${settings.description}`,
    "",
    home.hero.text,
    "",
    `Site: ${siteUrl}`,
    settings.contactEmail ? `Contato comercial: ${settings.contactEmail}` : null,
    settings.linkedinUrl ? `LinkedIn: ${settings.linkedinUrl}` : null,
    "",
    "## Números",
    ...home.stats.map((stat) => `- ${stat.value}: ${stat.label}`),
    "",
    `## ${home.problem.title}`,
    home.problem.lead,
    "",
    ...home.problem.items.map((item) => `- **${item.title}**: ${item.description} Impacto: ${item.impact}`),
    "",
    `## ${home.solution.title}`,
    home.solution.lead,
    "",
    ...home.solution.steps.map((step, i) => `${i + 1}. **${step.title}**: ${step.description} ${step.output}`),
    "",
    "## Diferenciais",
    ...home.differentials.items.map((item) => `- **${item.title}**: ${item.description}`),
    "",
    `## ${home.team.title}`,
    home.team.lead,
    "",
    ...team.map((member) => `- ${member.name}, ${member.role}`),
    "",
    clients.length === 0 ? null : `## Clientes e parceiros\n${clients.map((name) => `- ${name}`).join("\n")}\n`,
    faq.length === 0 ? null : `## Perguntas frequentes\n${faq.map((item) => `### ${item.question}\n${item.answer}`).join("\n\n")}\n`,
    posts.length === 0 ? null : `## Artigos do blog\n${posts.map((post) => `- [${post.title}](${siteUrl}${postPath(post.slug)})${post.excerpt ? `: ${post.excerpt}` : ""}`).join("\n")}\n`,
    "## Contato",
    `${home.contact.lead} Formulário: ${siteUrl}/#contato`,
  ];

  // null = bloco sem conteúdo; "" continua sendo linha em branco
  const body = lines.filter((line) => line !== null).join("\n");

  return new Response(body, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
