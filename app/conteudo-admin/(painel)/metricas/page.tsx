import { formatDuration, formatNumber, formatPercent } from "@/components/admin/analytics/format";
import { PeriodView } from "@/components/admin/analytics/PeriodView";
import { RankList } from "@/components/admin/analytics/RankList";
import { RankTabs } from "@/components/admin/analytics/RankTabs";
import { StatTile } from "@/components/admin/analytics/StatTile";
import { VisitsChart } from "@/components/admin/analytics/VisitsChart";
import { type Analytics, getAnalytics, parsePeriod, PERIODS } from "@/lib/admin/analytics";

const ratio = (part: number, total: number) => (total ? part / total : 0);

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const period = parsePeriod((await searchParams).periodo);

  let data: Analytics | null = null;
  let failed = false;
  try {
    data = await getAnalytics(period);
  } catch (error) {
    console.error("Falha ao ler o Umami", error);
    failed = true;
  }

  return (
    <PeriodView
      period={period}
      periods={Object.entries(PERIODS).map(([key, item]) => ({ key, label: item.label }))}
      heading={(
        <div>
          <p className="text-xs text-(--a-muted)">Analytics</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Métricas do site</h1>
          {data && (
            <p className="mt-1 flex items-center gap-2 text-sm text-(--a-muted)">
              <span className={`size-2 rounded-full ${data.activeNow ? "bg-(--a-ok)" : "bg-(--a-line-2)"}`} />
              {data.activeNow === 1 ? "1 pessoa no site agora" : `${data.activeNow} pessoas no site agora`}
            </p>
          )}
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

function Dashboard({ data }: { data: Analytics }) {
  const { current, previous } = data;

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Visitantes"
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
        <StatTile
          label="Taxa de rejeição"
          value={formatPercent(ratio(current.bounces, current.visits))}
          current={ratio(current.bounces, current.visits)}
          previous={ratio(previous.bounces, previous.visits)}
          upIsGood={false}
        />
        <StatTile
          label="Tempo médio por visita"
          value={formatDuration(ratio(current.totaltime, current.visits))}
          current={ratio(current.totaltime, current.visits)}
          previous={ratio(previous.totaltime, previous.visits)}
        />
      </div>

      <section className="pd-card mt-4 p-5 sm:p-6">
        <div className="mb-6 flex items-baseline justify-between text-sm">
          <h2 className="font-semibold">Visitantes por dia</h2>
          <span className="text-xs text-(--a-muted)">horário de Brasília</span>
        </div>
        <VisitsChart days={data.days} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <RankList title="Páginas mais vistas" unit="visitantes" items={data.pages} mono />
        <RankList
          title="De onde vieram"
          unit="visitantes"
          items={data.referrers}
          empty="Todos chegaram digitando o endereço ou por link direto"
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <RankTabs
          title="Localização"
          unit="visitantes"
          tabs={[
            { label: "Países", items: data.countries },
            { label: "Estados", items: data.regions },
            { label: "Cidades", items: data.cities },
          ]}
        />
        <RankTabs
          title="Aparelhos"
          unit="visitantes"
          tabs={[
            { label: "Tipo", items: data.devices },
            { label: "Sistema", items: data.systems },
            { label: "Navegador", items: data.browsers },
            { label: "Tela", items: data.screens },
          ]}
        />
      </div>

      <p className="mt-6 text-xs text-(--a-muted)">
        Dados do Umami, sem cookies. Visitas ao painel e ao Studio não entram na contagem.
      </p>
    </>
  );
}
