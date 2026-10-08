import type { HomePage } from "@/lib/sanity/types";

export function Differentials({
  content,
}: {
  content: HomePage["differentials"];
}) {
  return (
    <section id="diferenciais" className="wrap section">
      <div
        className="sec-head"
        style={{ gridTemplateColumns: "1fr", maxWidth: 720 }}
      >
        <div>
          <div className="eyebrow">{content.eyebrow}</div>
          <h2 className="h2">{content.title}</h2>
        </div>
      </div>
      <div className="diffs">
        {content.items.map((item, i) => (
          <div key={i} className="diff">
            <span>{String.fromCharCode(65 + i)}</span>
            <h3 className="h3">{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
      <p className="result">
        <em>{content.resultLabel}</em> {content.resultText}
      </p>
    </section>
  );
}
