"use client";

import { useState } from "react";
import type { DayPoint } from "@/lib/admin/analytics";
import { formatLongDate, formatNumber, formatShortDate } from "./format";

const HEIGHT = 220;

// Escala "redonda" para o eixo: 0 / 5 / 10, 0 / 20 / 40, 0 / 500 / 1000…
function niceScale(max: number) {
  if (max <= 4) return { top: 4, ticks: [0, 2, 4] };
  const rough = max / 2;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough)!;
  return { top: step * 2, ticks: [0, step, step * 2] };
}

// Visitantes por dia (colunas), com detalhe ao passar o mouse
export function VisitsChart({ days }: { days: DayPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const { top, ticks } = niceScale(Math.max(...days.map((day) => day.visitors)));
  const labelEvery = Math.ceil(days.length / 6);
  const active = hover === null ? null : days[hover];

  return (
    <div>
      <div className="relative flex gap-3">
        {/* Eixo Y */}
        <div className="relative w-8 shrink-0 text-right text-[11px] tabular-nums text-(--a-muted)" style={{ height: HEIGHT }}>
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-0 translate-y-1/2 leading-none" style={{ bottom: `${(tick / top) * 100}%` }}>
              {formatNumber(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1" style={{ height: HEIGHT }} onMouseLeave={() => setHover(null)}>
          {ticks.map((tick) => (
            <div
              key={tick}
              aria-hidden
              className="absolute inset-x-0 border-t border-(--a-line)"
              style={{ bottom: `${(tick / top) * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 flex gap-0.5">
            {days.map((day, index) => (
              <div
                key={day.date}
                onMouseEnter={() => setHover(index)}
                className="flex h-full min-w-0 flex-1 items-end justify-center"
              >
                <div
                  className={`w-full max-w-6 rounded-t-[4px] transition-colors ${
                    hover === index ? "bg-(--a-teal)" : "bg-(--a-teal-2)"
                  }`}
                  style={{
                    height: day.visitors ? `${(day.visitors / top) * 100}%` : 0,
                    minHeight: day.visitors ? 2 : 0,
                  }}
                />
              </div>
            ))}
          </div>

          {active && hover !== null && (
            <div
              className="pointer-events-none absolute top-0 z-10 w-max -translate-x-1/2 rounded-xl border border-(--a-line) bg-(--a-card) px-3 py-2 text-xs shadow-[0_8px_24px_rgb(0_0_0/0.08)]"
              style={{
                left: `clamp(70px, ${((hover + 0.5) / days.length) * 100}%, calc(100% - 70px))`,
              }}
            >
              <p className="font-medium capitalize">{formatLongDate(active.date)}</p>
              <p className="mt-1 text-(--a-body)">
                <span className="mr-1.5 inline-block size-2 rounded-full bg-(--a-teal-2)" />
                {formatNumber(active.visitors)} {active.visitors === 1 ? "visitante" : "visitantes"}
              </p>
              <p className="text-(--a-muted)">
                {formatNumber(active.pageviews)} {active.pageviews === 1 ? "página vista" : "páginas vistas"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Eixo X */}
      <div className="ml-11 mt-2 flex gap-0.5 text-[11px] text-(--a-muted)">
        {days.map((day, index) => (
          <span key={day.date} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">
            {index % labelEvery === 0 ? formatShortDate(day.date) : ""}
          </span>
        ))}
      </div>

      <details className="mt-4 text-sm">
        <summary className="text-(--a-muted) hover:text-(--a-ink)">Ver em tabela</summary>
        <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-(--a-line)">
          <table className="w-full text-left tabular-nums">
            <thead className="sticky top-0 bg-(--a-soft) text-xs text-(--a-muted)">
              <tr>
                <th className="px-3 py-2 font-medium">Dia</th>
                <th className="px-3 py-2 text-right font-medium">Visitantes</th>
                <th className="px-3 py-2 text-right font-medium">Páginas vistas</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((day) => (
                <tr key={day.date} className="border-t border-(--a-line)">
                  <td className="px-3 py-1.5 capitalize">{formatLongDate(day.date)}</td>
                  <td className="px-3 py-1.5 text-right">{formatNumber(day.visitors)}</td>
                  <td className="px-3 py-1.5 text-right">{formatNumber(day.pageviews)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
