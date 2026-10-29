import Link from "next/link";
import { formatNumber } from "@/components/admin/analytics/format";
import { PeriodView } from "@/components/admin/analytics/PeriodView";
import { getVisitors, parsePeriod, PERIODS } from "@/lib/admin/analytics";
import { timeAgo } from "@/lib/admin/client-utils";
import { ADMIN_BASE } from "@/lib/admin/paths";

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params.periodo);
  const page = Math.max(1, Number(params.pagina) || 1);

  let data: Awaited<ReturnType<typeof getVisitors>> = null;
  let failed = false;
  try {
    data = await getVisitors(period, page);
  } catch (error) {
    console.error("Falha ao ler visitantes no Umami", error);
    failed = true;
  }

  const pageHref = (target: number) => `${ADMIN_BASE}/metricas/visitantes?periodo=${period}&pagina=${target}`;

  return (
    <>
      <Link href={`${ADMIN_BASE}/metricas?periodo=${period}`} className="text-sm text-(--a-muted) hover:text-(--a-ink)">
        ← Métricas
      </Link>
      <div className="mt-2" />
      <PeriodView
        period={period}
        periods={Object.entries(PERIODS).map(([key, item]) => ({ key, label: item.label }))}
        heading={(
          <div>
            <p className="text-xs text-(--a-muted)">Métricas</p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Visitantes</h1>
            <p className="mt-1 max-w-xl text-sm text-(--a-muted)">
              Cada linha é um navegador em um aparelho. O Umami não usa cookies nem identifica a pessoa:
              a mesma pessoa no celular e no notebook aparece duas vezes, e a contagem recomeça a cada mês.
            </p>
          </div>
        )}
      >
        {!data
          ? (
              <div className="pd-card mt-8 p-8 text-sm text-(--a-body)">
                {failed
                  ? "Não foi possível carregar os visitantes agora. Tente de novo em alguns minutos."
                  : "O analytics ainda não está configurado."}
              </div>
            )
          : data.visitors.length === 0
            ? <div className="pd-card mt-8 p-8 text-sm text-(--a-muted)">Nenhum visitante no período.</div>
            : (
                <>
                  <div className="pd-card mt-8 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="border-b border-(--a-line) text-xs text-(--a-muted)">
                        <tr>
                          <th className="px-5 py-3 font-medium">Visitante</th>
                          <th className="px-5 py-3 font-medium">Local</th>
                          <th className="px-5 py-3 font-medium">Aparelho</th>
                          <th className="px-5 py-3 text-right font-medium">Visitas</th>
                          <th className="px-5 py-3 text-right font-medium">Páginas</th>
                          <th className="px-5 py-3 font-medium">Última visita</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.visitors.map((visitor) => (
                          <tr key={visitor.id} className="group relative border-b border-(--a-line) last:border-0 hover:bg-(--a-input)">
                            <td className="px-5 py-3">
                              <Link
                                href={`${ADMIN_BASE}/metricas/visitantes/${visitor.id}?periodo=${period}`}
                                className="font-mono text-[13px] text-(--a-teal-2) after:absolute after:inset-0 group-hover:underline"
                              >
                                #{visitor.id.slice(0, 6)}
                              </Link>
                              {visitor.visits > 1 && (
                                <span className="ml-2 rounded-full bg-(--a-ok-bg) px-2 py-0.5 text-[11px] text-(--a-ok)">
                                  voltou
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3">{visitor.location}</td>
                            <td className="px-5 py-3 text-(--a-body)">
                              {visitor.device}
                              <span className="text-(--a-muted)"> · {visitor.system} · {visitor.browser}</span>
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums">{formatNumber(visitor.visits)}</td>
                            <td className="px-5 py-3 text-right tabular-nums">{formatNumber(visitor.views)}</td>
                            <td className="px-5 py-3 text-(--a-body)" title={dateTime.format(new Date(visitor.lastAt))}>
                              {timeAgo(visitor.lastAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {(page > 1 || data.hasMore) && (
                    <div className="mt-4 flex items-center justify-between text-sm">
                      {page > 1
                        ? <Link href={pageHref(page - 1)} className="text-(--a-teal-2) hover:underline">← Anteriores</Link>
                        : <span />}
                      <span className="text-(--a-muted)">Página {page}</span>
                      {data.hasMore
                        ? <Link href={pageHref(page + 1)} className="text-(--a-teal-2) hover:underline">Próximos →</Link>
                        : <span />}
                    </div>
                  )}
                </>
              )}
      </PeriodView>
    </>
  );
}
