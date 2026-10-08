import type { HomePage } from "@/lib/sanity/types";

export function Stats({ stats }: { stats: HomePage["stats"] }) {
  return (
    <section className="stats">
      <div className="wrap">
        {stats.map((stat) => (
          <div key={stat.value} className="stat">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
