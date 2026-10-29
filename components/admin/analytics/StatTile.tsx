// Número principal + variação em relação ao período anterior.
// A direção vem em seta e texto, não só na cor.
export function StatTile({
  label,
  value,
  current,
  previous,
  upIsGood = true,
}: {
  label: string;
  value: string;
  current: number;
  previous: number;
  upIsGood?: boolean;
}) {
  const delta = previous > 0 ? (current - previous) / previous : null;
  const flat = delta === null || Math.abs(delta) < 0.005;
  const good = !flat && (delta > 0) === upIsGood;

  return (
    <div className="pd-card p-5">
      <p className="text-sm text-(--a-muted)">{label}</p>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight">{value}</p>
      <p
        className={`mt-3 text-xs ${
          flat ? "text-(--a-muted)" : good ? "text-(--a-ok)" : "text-(--a-danger)"
        }`}
      >
        {delta === null
          ? "Sem dados do período anterior"
          : flat
            ? "= igual ao período anterior"
            : `${delta > 0 ? "↑" : "↓"} ${Math.abs(Math.round(delta * 100))}% vs. período anterior`}
      </p>
    </div>
  );
}

// Número sem comparação com o período anterior, com uma linha explicativa
export function InfoTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="pd-card p-5">
      <p className="text-sm text-(--a-muted)">{label}</p>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight">{value}</p>
      <p className="mt-3 text-xs text-(--a-muted)">{note}</p>
    </div>
  );
}
