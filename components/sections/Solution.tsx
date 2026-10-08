import type { HomePage } from "@/lib/sanity/types";

export function Solution({ content }: { content: HomePage["solution"] }) {
  return (
    <section id="solucao" className="dark">
      <div className="wrap">
        <div className="sec-head" style={{ marginBottom: 64 }}>
          <div>
            <div className="eyebrow">{content.eyebrow}</div>
            <h2 className="h2">{content.title}</h2>
          </div>
          <p className="lead">{content.lead}</p>
        </div>
        <div className="steps">
          {content.steps.map((step, i) => (
            <div key={i} className="step">
              <div className="step-top">
                <span>{step.stage}</span>
                <span>{step.tag}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <p className="out">{step.output}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
