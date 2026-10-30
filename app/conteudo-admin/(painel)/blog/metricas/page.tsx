import Link from "next/link";
import { formatDuration, formatNumber, formatPercent } from "@/components/admin/analytics/format";
import { PeriodView } from "@/components/admin/analytics/PeriodView";
import { RankTabs } from "@/components/admin/analytics/RankTabs";
import { InfoTile, StatTile } from "@/components/admin/analytics/StatTile";
import { VisitsChart } from "@/components/admin/analytics/VisitsChart";
import { type BlogAnalytics, getBlogAnalytics, parsePeriod, PERIODS } from "@/lib/admin/analytics";
import { listPosts } from "@/lib/admin/data";
import { ADMIN_BASE } from "@/lib/admin/paths";

const ratio = (part: number, total: number) => (total ? part / total : 0);

export default async function BlogMetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const period = parsePeriod((await searchParams).periodo);

  let data: BlogAnalytics | null = null;
  let failed = false;
  try {
    const posts = await listPosts();
    data = await getBlogAnalytics(
      period,
      posts.filter((post) => post.status !== "new"),
    );
  } catch (error) {
    console.error("Falha ao ler as métricas do blog", error);
    failed = true;
  }

  return (
    <PeriodView
      period={period}
      periods={Object.entries(PERIODS).map(([key, item]) => ({ key, label: item.label }))}
      heading={(
        <div>
          <Link href={`${ADMIN_BASE}/blog`} className="text-sm text-(--a-muted) hover:text-(--a-ink)">
            ← Blog
          </Link>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Métricas do blog</h1>
        </div>
      )}
    >
      {!data
        ? (
            <div className="pd-card mt-8 p-8 text-sm text-(--a-body)">
              {failed
                ? "Não foi possível carregar os dados do Umami agora. Tente de novo em alguns minutos."
                : "O analytics ainda não está configurado (faltam as variáveis UMAMI_API_URL, UMAMI_API_USERNAME e UMAMI_API_PASSWORD)."}
            </div>
          )
        : <Dashboard data={data} />}
    </PeriodView>
  );
}

function Dashboard({ data }: { data: BlogAnalytics }) {
  const { current, previous, posts } = data;
  const postViews = posts.reduce((sum, post) => sum + post.pageviews, 0);

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Visitantes do blog"
          value={formatNumber(current.visitors)}
          current={current.visitors}
          previous={previous.visitors}
        />
        <StatTile
          label="Páginas vistas"
          value={formatNumber(current.pageviews)}
          current={current.pageviews}
          previous={previous.pageviews}
        />
        <InfoTile
          label="Leituras até o fim"
          value={formatNumber(data.reads)}
          note={postViews
            ? `${formatPercent(Math.min(1, ratio(data.reads, postViews)))} das aberturas de artigo`
            : "Nenhum artigo aberto no período"}
        />
        <InfoTile
          label="Cliques no botão do artigo"
          value={formatNumber(data.ctaClicks)}
          note={current.visitors
            ? `${formatPercent(ratio(data.ctaClicks, current.visitors))} dos visitantes do blog`
            : "Nenhum visitante no período"}
        />
      </div>

      <section className="pd-card mt-4 overflow-hidden">
        <div className="flex items-baseline justify-between p-5 pb-3 text-sm sm:px-6">
          <h2 className="font-semibold">Artigos</h2>
          <span className="text-xs text-(--a-muted)">no período</span>
        </div>
        {posts.length === 0
          ? <p className="px-6 pb-6 text-sm text-(--a-muted)">Nenhum artigo publicado ainda.</p>
          : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm tabular-nums">
                  <thead className="border-y border-(--a-line) bg-(--a-input) text-xs text-(--a-muted)">
                    <tr>
                      <th className="px-5 py-2.5 font-medium sm:pl-6">Artigo</th>
                      <th className="px-3 py-2.5 text-right font-medium">Visitantes</th>
                      <th className="px-3 py-2.5 text-right font-medium">Aberturas</th>
                      <th className="px-3 py-2.5 text-right font-medium">Lidos até o fim</th>
                      <th className="py-2.5 pl-3 pr-5 text-right font-medium sm:pr-6">Tempo médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.path} className="border-b border-(--a-line) last:border-0">
                        <td className="max-w-0 w-1/2 truncate px-5 py-3 sm:pl-6" title={post.title}>
                          {post.id
                            ? <Link href={`${ADMIN_BASE}/blog/${post.id}`} className="font-medium hover:underline">{post.title}</Link>
                            : <span className="font-mono text-[13px] text-(--a-muted)">{post.title}</span>}
                        </td>
                        <td className="px-3 py-3 text-right">{formatNumber(post.visitors)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(post.pageviews)}</td>
                        <td className="px-3 py-3 text-right">
                          {post.reads === undefined
                            ? "–"
                            : `${formatNumber(post.reads)}${post.pageviews ? ` (${formatPercent(Math.min(1, ratio(post.reads, post.pageviews)))})` : ""}`}
                        </td>
                        <td className="py-3 pl-3 pr-5 text-right sm:pr-6">
                          {post.averageTime === undefined ? "–" : formatDuration(post.averageTime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </section>

      <section className="pd-card mt-4 p-5 sm:p-6">
        <div className="mb-6 flex items-baseline justify-between text-sm">
          <h2 className="font-semibold">Visitantes do blog por dia</h2>
          <span className="text-xs text-(--a-muted)">horário de Brasília</span>
        </div>
        <VisitsChart days={data.days} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <RankTabs
          title="De onde vieram"
          unit="visitantes"
          tabs={[
            { label: "Canais", items: data.channels },
            {
              label: "Assistentes de IA",
              items: data.aiAssistants,
              empty: "Nenhuma visita vinda do ChatGPT, Perplexity, Gemini, Claude ou Copilot ainda",
            },
            {
              label: "Sites",
              items: data.referrers,
              empty: "Todos chegaram digitando o endereço ou por link direto",
            },
            { label: "Porta de entrada", items: data.entries, mono: true },
          ]}
        />
        <RankTabs
          title="Quem lê"
          unit="visitantes"
          tabs={[
            { label: "Estados", items: data.regions },
            { label: "Cidades", items: data.cities },
            { label: "Países", items: data.countries },
            { label: "Aparelhos", items: data.devices },
            { label: "Sistema", items: data.systems },
            { label: "Navegador", items: data.browsers },
          ]}
        />
      </div>

      <p className="mt-6 text-xs text-(--a-muted)">
        Dados do Umami, sem cookies. “Lidos até o fim” conta quem chegou ao final do texto depois de pelo menos
        15 segundos na página. O tempo médio considera a visita inteira de quem abriu o artigo.
      </p>
    </>
  );
}
