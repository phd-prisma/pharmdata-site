"use client";

import { useEffect, useState } from "react";
import type { HomePage } from "@/lib/sanity/types";

export function Hero({ content }: { content: HomePage["hero"] }) {
  const { records } = content;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (records.length < 2) return;
    const interval = setInterval(
      () => setCurrent((i) => (i + 1) % records.length),
      4200,
    );
    return () => clearInterval(interval);
  }, [records.length]);

  const record = records[current % records.length];

  return (
    <section id="top" className="wrap hero">
      <div className="hero-copy">
        <div className="eyebrow">{content.eyebrow}</div>
        <h1>{content.title}</h1>
        <p>{content.text}</p>
        <div className="actions">
          <a href={content.primaryCta.href} className="btn btn-primary">
            {content.primaryCta.label}
          </a>
          <a href={content.secondaryCta.href} className="btn btn-ghost">
            {content.secondaryCta.label}
          </a>
        </div>
      </div>
      {record && (
        <div className="record" aria-label="Exemplo de registro de medicamento">
          <div className="record-top">
            <span>{content.recordLabel}</span>
            <span className="status">
              <i></i>
              {content.recordStatus}
            </span>
          </div>
          <div className="record-name">
            <div>{record.name}</div>
            <div>{record.form}</div>
          </div>
          <div className="record-fields">
            {record.fields.map((field) => (
              <div key={field.label} className="field">
                <span>{field.label}</span>
                <span>{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
