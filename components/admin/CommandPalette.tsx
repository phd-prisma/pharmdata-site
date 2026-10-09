"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export interface SearchItem {
  label: string;
  hint: string;
  href: string;
}

const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function CommandPalette({
  onClose,
  items,
}: {
  onClose: () => void;
  items: SearchItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const term = normalize(query.trim());
    return term ? items.filter((item) => normalize(item.label).includes(term)) : items;
  }, [items, query]);

  function go(item: SearchItem | undefined) {
    if (!item) return;
    onClose();
    router.push(item.href);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/20 px-4 pt-[14vh] backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-label="Buscar"
        className="pd-card pd-fade-in w-full max-w-lg overflow-hidden shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, results.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            }
            if (event.key === "Enter") go(results[active]);
          }}
          placeholder="Buscar seções, pessoas e parceiros…"
          className="w-full border-b border-(--a-line) bg-transparent px-5 py-4 text-[15px] outline-none"
        />
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-(--a-muted)">
              Nada encontrado
            </li>
          )}
          {results.map((item, index) => (
            <li key={item.href}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => go(item)}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm ${
                  index === active ? "bg-(--a-soft)" : ""
                }`}
              >
                <span>{item.label}</span>
                <span className="text-xs text-(--a-muted)">{item.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
