import type { HomePage } from "@/lib/sanity/types";

// Perguntas em <details>: a resposta fica no HTML mesmo fechada,
// então buscadores e assistentes de IA leem tudo
export function Faq({ content }: { content: HomePage["faq"] }) {
  const items = content.items.filter((item) => item.question && item.answer);
  if (items.length === 0) return null;

  return (
    <section id="perguntas" className="wrap section">
      <div className="sec-head" style={{ gridTemplateColumns: "1fr", maxWidth: 720 }}>
        <div>
          <div className="eyebrow">{content.eyebrow}</div>
          <h2 className="h2">{content.title}</h2>
        </div>
      </div>
      <div className="faq">
        {items.map((item, i) => (
          <details key={i} className="faq-item" open={i === 0}>
            <summary>
              <h3 className="h3">{item.question}</h3>
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
