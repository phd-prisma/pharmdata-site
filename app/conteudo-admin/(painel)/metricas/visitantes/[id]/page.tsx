import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDuration, formatNumber } from "@/components/admin/analytics/format";
import { getVisitor, parsePeriod, type VisitorActivity } from "@/lib/admin/analytics";
import { ADMIN_BASE } from "@/lib/admin/paths";

const TZ = "America/Sao_Paulo";
const dayFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });
const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: TZ });

// Agrupa a atividade em visitas, da mais recente para a mais antiga
function groupByVisit(activity: VisitorActivity[]) {
  const visits = new Map<string, VisitorActivity[]>();
  for (const item of [...activity].sort((a, b) => a.at.localeCompare(b.at))) {
    visits.set(item.visitId, [...(visits.get(item.visitId) ?? []), item]);
  }
  return [...visits.values()].reverse();
}

export default async function VisitorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const period = parsePeriod(query.periodo);
  const data = await getVisitor(id).catch((error) => {
    console.error("Falha ao ler visitante no Umami", error);
    return null;
  });
  if (!data) notFound();

  const { visitor, activity } = data;
  const visits = groupByVisit(activity);

  const facts = [
    { label: "Local", value: visitor.location },
    { label: "Aparelho", value: `${visitor.device} · ${visitor.system}` },
    { label: "Navegador", value: visitor.browser },
    { label: "Idioma", value: visitor.language || "—" },
    { label: "Primeira visita", value: dateTime.format(new Date(visitor.firstAt)) },
    { label: "Última visita", value: dateTime.format(new Date(visitor.lastAt)) },
  ];

  return (
    <>
      <Link
        href={`${ADMIN_BASE}/metricas/visitantes?periodo=${period}`}
        className="text-sm text-(--a-muted) hover:text-(--a-ink)"
      >
        ← Visitantes
      </Link>
      <div className="mt-2">
        <p className="text-xs text-(--a-muted)">Visitante</p>
        <h1 className="mt-1 font-mono text-[26px] font-semibold tracking-tight">#{visitor.id.slice(0, 6)}</h1>
        <p className="mt-1 text-sm text-(--a-muted)">
          {formatNumber(visitor.visits)} {visitor.visits === 1 ? "visita" : "visitas"} ·{" "}
          {formatNumber(visitor.views)} {visitor.views === 1 ? "página vista" : "páginas vistas"}
        </p>
      </div>

      <div className="mt-8 grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <dl className="pd-card divide-y divide-(--a-line) px-5 py-2 text-sm">
          {facts.map((fact) => (
            <div key={fact.label} className="flex justify-between gap-4 py-2.5">
              <dt className="text-(--a-muted)">{fact.label}</dt>
              <dd className="text-right">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <section className="pd-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Caminho no site</h2>
          {visits.length === 0
            ? <p className="mt-4 text-sm text-(--a-muted)">Nenhuma atividade registrada no domínio oficial.</p>
            : (
                <ol className="mt-5 space-y-6">
                  {visits.map((items) => {
                    const first = items[0];
                    const last = items[items.length - 1];
                    const seconds = (new Date(last.at).getTime() - new Date(first.at).getTime()) / 1000;
                    return (
                      <li key={first.visitId}>
                        <p className="text-sm font-medium first-letter:uppercase">{dayFormat.format(new Date(first.at))}</p>
                        <p className="mt-0.5 text-xs text-(--a-muted)">
                          {first.referrer ? `Veio de ${first.referrer}` : "Acesso direto"}
                          {items.length > 1 && ` · ${formatDuration(seconds)} no site`}
                        </p>
                        <ol className="mt-3 border-l border-(--a-line-2) pl-4">
                          {items.map((item, index) => (
                            <li key={index} className="relative flex items-baseline gap-3 py-1.5 text-sm">
                              <span
                                aria-hidden
                                className={`absolute -left-[21px] top-3 size-2 rounded-full ring-2 ring-(--a-card) ${
                                  item.kind === "event" ? "bg-(--a-warn)" : "bg-(--a-teal-2)"
                                }`}
                              />
                              <span className="w-11 shrink-0 tabular-nums text-xs text-(--a-muted)">
                                {timeFormat.format(new Date(item.at))}
                              </span>
                              {item.kind === "event"
                                ? <span className="font-medium text-(--a-warn)">★ {item.label}</span>
                                : <span className="font-mono text-[13px]">{item.label}</span>}
                            </li>
                          ))}
                        </ol>
                      </li>
                    );
                  })}
                </ol>
              )}
        </section>
      </div>
    </>
  );
}
