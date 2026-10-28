"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

// Seletor de período: marca a opção na hora e esmaece os dados
// enquanto o servidor busca o novo período no Umami
export function PeriodView({
  period,
  periods,
  heading,
  children,
}: {
  period: string;
  periods: { key: string; label: string }[];
  heading: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useOptimistic(period);

  const choose = (key: string) => {
    if (key === selected) return;
    startTransition(() => {
      setSelected(key);
      router.push(`${pathname}?periodo=${key}`, { scroll: false });
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        {heading}
        <div className="flex items-center gap-3">
          {pending && <span className="text-xs text-(--a-muted)">Atualizando…</span>}
          <div className="pd-segmented" role="radiogroup" aria-label="Período">
            {periods.map((item) => (
              <button
                key={item.key}
                type="button"
                role="radio"
                aria-checked={item.key === selected}
                onClick={() => choose(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        aria-busy={pending}
        className={`transition-opacity duration-200 ${pending ? "pointer-events-none opacity-50" : ""}`}
      >
        {children}
      </div>
    </>
  );
}
