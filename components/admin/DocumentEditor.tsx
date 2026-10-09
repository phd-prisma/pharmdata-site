"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  deleteDocumentAction,
  discardDraftAction,
  publishAction,
  saveDraftAction,
} from "@/app/conteudo-admin/actions";
import { timeAgo } from "@/lib/admin/client-utils";
import type { CollectionType } from "@/lib/admin/data";
import type { DocStatus, DocumentSpec, EditableDocument } from "@/lib/admin/types";
import { useConfirm } from "./ConfirmDialog";
import { FieldList } from "./fields";
import { SeoPreview } from "./SeoPreview";
import { StatusBadge } from "./StatusBadge";

const AUTOSAVE_MS = 800;

type SaveState = "idle" | "pending" | "saving" | "error";

export function DocumentEditor({
  spec,
  doc,
  kicker,
  fallbackTitle,
  back,
  deletable,
  seoPreviewUrl,
}: {
  spec: DocumentSpec;
  doc: EditableDocument;
  kicker: string;
  fallbackTitle: string;
  back?: { href: string; label: string };
  deletable?: CollectionType;
  seoPreviewUrl?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState(doc.values);
  const [status, setStatus] = useState<DocStatus>(doc.status);
  const [updatedAt, setUpdatedAt] = useState(doc.updatedAt);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [group, setGroup] = useState(spec.groups[0]?.name);
  const [publishing, startPublish] = useTransition();
  const [, forceTick] = useState(0);
  const confirm = useConfirm();

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef(values);
  const inFlight = useRef<Promise<unknown>>(Promise.resolve());

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    setSaveState("saving");
    const request = saveDraftAction(doc.type, doc.id, latest.current);
    inFlight.current = request;
    try {
      const result = await request;
      setUpdatedAt(result.updatedAt);
      setStatus((current) => (current === "new" ? "new" : "draft"));
      setSaveState((state) => (state === "saving" ? "idle" : state));
    } catch {
      setSaveState("error");
    }
  }, [doc.id, doc.type]);

  const handleChange = (next: Record<string, unknown>) => {
    setValues(next);
    latest.current = next;
    setSaveState("pending");
    if (status === "published") setStatus("draft");
    clearTimeout(timer.current);
    timer.current = setTimeout(save, AUTOSAVE_MS);
  };

  // Garante que nada se perca ao sair com alterações pendentes
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (saveState === "pending" || saveState === "saving") event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  // Atualiza o "salvo há X" periodicamente
  useEffect(() => {
    const interval = setInterval(() => forceTick((tick) => tick + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const publish = () =>
    startPublish(async () => {
      if (saveState === "pending") await save();
      await inFlight.current;
      await publishAction(doc.type, doc.id);
      setStatus("published");
      setUpdatedAt(new Date().toISOString());
      router.refresh();
    });

  const discard = async () => {
    const ok = await confirm({
      title: "Descartar alterações?",
      description: "As alterações não publicadas serão perdidas e o conteúdo volta à última versão publicada.",
      confirmLabel: "Descartar",
      tone: "danger",
    });
    if (!ok) return;
    clearTimeout(timer.current);
    startPublish(async () => {
      await discardDraftAction(doc.type, doc.id);
      router.refresh();
    });
  };

  const remove = async () => {
    if (!deletable) return;
    const ok = await confirm({
      title: `Excluir ${title}?`,
      description: "O item sai do site e do Sanity. Essa ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    startPublish(() => deleteDocumentAction(deletable, doc.id));
  };

  const title = (values.name as string) || fallbackTitle;
  const visibleFields = group
    ? spec.fields.filter((field) => field.group === group)
    : spec.fields;
  const showSeo = seoPreviewUrl && group === "seo";
  const dirty = status !== "published";

  return (
    <>
      {back && (
        <Link href={back.href} className="text-sm text-(--a-muted) hover:text-(--a-ink)">
          ← {back.label}
        </Link>
      )}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-(--a-muted)">{kicker}</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">{title}</h1>
        </div>
        <StatusBadge status={status} updatedAt={updatedAt} />
      </div>

      {spec.groups.length > 1 && (
        <div className="pd-card mt-8 inline-flex max-w-full overflow-x-auto p-1.5">
          <div className="pd-segmented !bg-transparent !p-0" role="tablist">
            {spec.groups.map((item) => (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={group === item.name}
                onClick={() => setGroup(item.name)}
                className="aria-selected:!bg-(--a-soft)"
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={`mt-5 grid items-start gap-6 ${showSeo ? "lg:grid-cols-[minmax(0,1fr)_380px]" : ""}`}
      >
        <section className="pd-card p-6 sm:p-8" key={group}>
          <FieldList
            fields={visibleFields}
            fieldsets={spec.fieldsets}
            value={values}
            onChange={handleChange}
          />
        </section>
        {showSeo && <SeoPreview values={values} siteUrl={seoPreviewUrl} />}
      </div>

      {deletable && (
        <button
          type="button"
          onClick={remove}
          className="mt-8 text-sm text-(--a-danger) hover:underline"
        >
          Excluir
        </button>
      )}

      {/* Barra de publicação */}
      <div
        className={`fixed inset-x-0 bottom-5 z-40 mx-auto w-[min(640px,calc(100%-32px))] transition-all duration-300 ${
          dirty || saveState !== "idle"
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-2xl bg-(--a-teal) py-2.5 pl-5 pr-2.5 text-sm text-white shadow-[0_12px_32px_rgb(11_59_62/0.35)]">
          <span className="min-w-0 flex-1 truncate text-white/80">
            {saveState === "error"
              ? "Erro ao salvar. Verifique a conexão."
              : saveState === "pending" || saveState === "saving"
                ? "Salvando rascunho…"
                : `Rascunho salvo ${timeAgo(updatedAt)} · ainda não está no site`}
          </span>
          {status === "draft" && (
            <button
              type="button"
              onClick={discard}
              disabled={publishing}
              className="rounded-xl px-3 py-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Descartar
            </button>
          )}
          <button
            type="button"
            onClick={publish}
            disabled={publishing || saveState === "error"}
            className="rounded-xl bg-white px-4 py-2 font-medium text-(--a-teal) transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {publishing ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>
    </>
  );
}
