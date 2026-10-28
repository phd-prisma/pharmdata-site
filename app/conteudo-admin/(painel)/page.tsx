import Link from "next/link";
import { formatNumber } from "@/components/admin/analytics/format";
import { getAnalyticsSummary } from "@/lib/admin/analytics";
import { getOverview } from "@/lib/admin/data";
import { requireSession } from "@/lib/admin/session";
import { ADMIN_BASE } from "@/lib/admin/paths";

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Sao_Paulo",
    }).format(new Date()),
  );
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

export default async function OverviewPage() {
  const [{ team, partners }, session, visits] = await Promise.all([
    getOverview(),
    requireSession(),
    // Sem analytics (ou com o Umami fora do ar) a visão geral continua funcionando
    getAnalyticsSummary().catch(() => null),
  ]);
  const firstName = session.name.split(" ")[0];

  const cards = [
    {
      href: `${ADMIN_BASE}/pagina-inicial`,
      kicker: "Página",
      title: "Página Inicial",
      text: "Título e chamadas",
    },
    {
      href: `${ADMIN_BASE}/configuracoes`,
      kicker: "Documento",
      title: "Configurações do Site",
      text: "SEO, cabeçalho, contato, rodapé",
    },
    {
      href: `${ADMIN_BASE}/equipe`,
      kicker: "Coleção",
      title: "Membros da Equipe",
      text: plural(team, "pessoa", "pessoas"),
    },
    {
      href: `${ADMIN_BASE}/parceiros`,
      kicker: "Coleção",
      title: "Parceiros / Clientes",
      text: plural(partners, "empresa", "empresas"),
    },
  ];

  return (
    <>
      <p className="text-sm text-(--a-muted)">{greeting()}, {firstName}</p>
      <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Conteúdo do site</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="pd-card group flex min-h-52 flex-col p-6 transition-all hover:-translate-y-0.5 hover:border-(--a-line-2) hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)]"
          >
            <div className="flex items-center justify-between text-xs text-(--a-muted)">
              {card.kicker}
              <span className="text-base text-(--a-teal-2) transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
            <div className="mt-auto pt-10">
              <h2 className="text-xl font-semibold leading-snug tracking-tight">{card.title}</h2>
              <p className="mt-1 text-sm text-(--a-muted)">{card.text}</p>
            </div>
          </Link>
        ))}
      </div>

      {visits && (
        <Link
          href={`${ADMIN_BASE}/metricas`}
          className="pd-card group mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 px-6 py-5 transition-all hover:border-(--a-line-2) hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)]"
        >
          <span className="text-xs text-(--a-muted)">Métricas · últimos 7 dias</span>
          <span className="text-sm">
            <strong className="text-xl font-semibold tracking-tight">{formatNumber(visits.visitors)}</strong>{" "}
            {visits.visitors === 1 ? "visitante" : "visitantes"}
          </span>
          <span className="text-sm">
            <strong className="text-xl font-semibold tracking-tight">{formatNumber(visits.pageviews)}</strong>{" "}
            {visits.pageviews === 1 ? "página vista" : "páginas vistas"}
          </span>
          <span className="ml-auto text-sm text-(--a-teal-2)">
            Ver detalhes <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </span>
        </Link>
      )}
    </>
  );
}
