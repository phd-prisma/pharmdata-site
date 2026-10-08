"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { sendContact } from "@/lib/contact/sendContact";
import type { HomePage, SiteSettings } from "@/lib/sanity/types";

export function Contact({
  content,
  settings,
}: {
  content: HomePage["contact"];
  settings: SiteSettings;
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError(undefined);
    startTransition(async () => {
      const result = await sendContact(data);
      if (result.ok) {
        formRef.current?.reset();
        setSent(true);
      } else {
        setError(result.error);
      }
    });
  }

  function handleReset() {
    setSent(false);
  }

  const { contactEmail: email, linkedinUrl } = settings;

  return (
    <section id="contato" className="contact">
      <div className="wrap">
        <div className="contact-copy">
          <div className="eyebrow">{content.eyebrow}</div>
          <h2 className="h2">{content.title}</h2>
          <p className="lead">{content.lead}</p>
          <div className="contact-links">
            <a href={`mailto:${email}`}>{email}</a>
            <a href={linkedinUrl} target="_blank" rel="noopener">
              {linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          </div>
        </div>
        <div className={`form-box${sent ? " is-sent" : ""}`} id="form-box">
          <form ref={formRef} id="contact-form" onSubmit={handleSubmit}>
            <div className="fields">
              <label>
                Nome
                <input name="nome" required />
              </label>
              <label>
                Empresa
                <input name="empresa" />
              </label>
              <label>
                E-mail
                <input type="email" name="email" required />
              </label>
              <label>
                Telefone
                <input type="tel" name="telefone" />
              </label>
            </div>
            <label>
              Mensagem
              <textarea name="mensagem" rows={4}></textarea>
            </label>
            <input
              type="text"
              name="website"
              className="hp-field"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <p className="legal">
              {content.legalPrefix}{" "}
              <a href={settings.privacyPolicyUrl} target="_blank" rel="noopener">
                Política de Privacidade
              </a>
              .
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Enviando…" : content.submitLabel}
            </button>
          </form>
          <div className="sent">
            <span>{content.successLabel}</span>
            <span>{content.successText}</span>
            <button type="button" onClick={handleReset}>
              {content.resetLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
