"use client";

import { useState } from "react";
import type { Metric } from "@/lib/admin/analytics";
import { RankItems } from "./RankList";

// Mesmo cartão de ranking, com abas (ex.: Países / Estados / Cidades)
export function RankTabs({
  title,
  unit,
  tabs,
}: {
  title: string;
  unit: string;
  tabs: { label: string; items: Metric[]; mono?: boolean; empty?: string }[];
}) {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <section className="pd-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <h2 className="font-semibold">{title}</h2>
        <div className="pd-segmented max-w-full overflow-x-auto !p-[3px] [&>*]:!px-3 [&>*]:!py-1 [&>*]:!text-[13px]" role="tablist">
          {tabs.map((item, index) => (
            <button
              key={item.label}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => setActive(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-right text-xs text-(--a-muted)">{unit}</p>
      <div className="-mt-2">
        <RankItems items={tab.items} empty={tab.empty ?? "Nenhum dado no período"} mono={tab.mono} />
      </div>
    </section>
  );
}
