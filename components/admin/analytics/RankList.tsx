import type { Metric } from "@/lib/admin/analytics";
import { formatNumber } from "./format";

// Ranking com barra de fundo proporcional ao maior valor
export function RankList({
  title,
  unit,
  items,
  empty = "Nenhum dado no período",
  mono,
}: {
  title: string;
  unit: string;
  items: Metric[];
  empty?: string;
  mono?: boolean;
}) {
  return (
    <section className="pd-card p-5">
      <div className="flex items-baseline justify-between text-sm">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-xs text-(--a-muted)">{unit}</span>
      </div>
      <RankItems items={items} empty={empty} mono={mono} />
    </section>
  );
}

export function RankItems({ items, empty, mono }: { items: Metric[]; empty: string; mono?: boolean }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  if (items.length === 0) return <p className="mt-6 pb-2 text-sm text-(--a-muted)">{empty}</p>;
  return (
    <ol className="mt-4 space-y-1">
      {items.map((item) => (
        <li key={item.label} className="relative flex items-center gap-3 px-2.5 py-1.5 text-sm">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-md bg-(--a-tint-1)"
            style={{ width: `${(item.value / max) * 100}%` }}
          />
          <span
            className={`relative min-w-0 flex-1 truncate ${mono ? "font-mono text-[13px]" : ""}`}
            title={item.label}
          >
            {item.label}
          </span>
          <span className="relative tabular-nums text-(--a-body)">{formatNumber(item.value)}</span>
        </li>
      ))}
    </ol>
  );
}
