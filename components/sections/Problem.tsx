import type { HomePage } from "@/lib/sanity/types";

export function Problem({ content }: { content: HomePage["problem"] }) {
  return (
    <section id="problema" className="wrap section">
      <div className="sec-head">
        <div>
          <div className="eyebrow">{content.eyebrow}</div>
          <h2 className="h2">{content.title}</h2>
        </div>
        <p className="lead">{content.lead}</p>
      </div>
      <div className="rows">
        {content.items.map((item, i) => (
          <div key={i} className="row">
            <div className="row-main">
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="h3">{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
            <div className="impact">
              <span>{content.impactLabel}</span>
              <p>{item.impact}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
