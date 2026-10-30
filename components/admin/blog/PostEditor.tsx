"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  deleteDocumentAction,
  discardDraftAction,
  publishPostAction,
  saveDraftAction,
} from "@/app/conteudo-admin/actions";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { FieldList } from "@/components/admin/fields";
import { SeoPreview } from "@/components/admin/SeoPreview";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PostArticle } from "@/components/blog/PostArticle";
import { timeAgo } from "@/lib/admin/client-utils";
import { ADMIN_BASE } from "@/lib/admin/paths";
import type { DocStatus, DocumentSpec, EditableDocument } from "@/lib/admin/types";
import {
  BLOG_PATH,
  countWords,
  isValidSlug,
  plainText,
  type PostBody,
  type PostImage,
  readingMinutes,
  slugify,
  slugifyTyping,
} from "@/lib/blog/content";
import type { BodyEditorHandle } from "./BodyEditor";

// Só no navegador: o editor gera chaves aleatórias, que não bateriam com as do servidor
const BodyEditor = dynamic(() => import("./BodyEditor").then((mod) => mod.BodyEditor), {
  ssr: false,
  loading: () => <div className="min-h-[470px] animate-pulse bg-(--a-input)" />,
});

const AUTOSAVE_MS = 800;
// Campos com controle próprio nesta tela
const CUSTOM_FIELDS = new Set(["title", "slug", "body", "author", "category", "publishedAt"]);

type SaveState = "idle" | "pending" | "saving" | "error";
type ViewMode = "write" | "split" | "preview";

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "write", label: "Só o texto" },
  { key: "split", label: "Lado a lado" },
  { key: "preview", label: "Só a prévia" },
];

// O editor preenche detalhes internos ao abrir; só o texto e a estrutura contam como mudança
function bodyFingerprint(body: PostBody | undefined) {
  return JSON.stringify(
    (body ?? []).map((block) =>
      block._type === "block"
        ? {
            style: block.style ?? "normal",
            listItem: block.listItem,
            level: block.listItem ? block.level ?? 1 : undefined,
            markDefs: block.markDefs?.length ? block.markDefs : undefined,
            children: block.children?.map((child: Record<string, unknown>) => ({
              text: child.text,
              marks: (child.marks as unknown[] | undefined)?.length ? child.marks : undefined,
            })),
          }
        : block),
  );
}

export function PostEditor({
  spec,
  doc,
  siteUrl,
  authors,
  categories,
}: {
  spec: DocumentSpec;
  doc: EditableDocument;
  siteUrl: string;
  authors: { id: string; name: string; role?: string }[];
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [values, setValues] = useState(doc.values);
  const [status, setStatus] = useState<DocStatus>(doc.status);
  const [updatedAt, setUpdatedAt] = useState(doc.updatedAt);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [publishError, setPublishError] = useState<string>();
  const [tab, setTab] = useState(spec.groups[0]?.name);
  const [view, setView] = useState<ViewMode>("split");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [publishing, startPublish] = useTransition();
  const [, forceTick] = useState(0);

  const latest = useRef(values);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dirty = useRef(false);
  const leaving = useRef(false);
  const saveLoop = useRef<Promise<void> | null>(null);
  const editor = useRef<BodyEditorHandle>(null);
  const titleInput = useRef<HTMLTextAreaElement>(null);
  const previewBox = useRef<HTMLDivElement>(null);
  const bodyPrint = useRef(bodyFingerprint(doc.values.body as PostBody | undefined));

  // Uma gravação por vez, sempre com o valor mais recente: uma resposta atrasada
  // não pode sobrescrever o que foi escrito depois
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    saveLoop.current ??= (async () => {
      try {
        while (dirty.current) {
          dirty.current = false;
          setSaveState("saving");
          const result = await saveDraftAction(doc.type, doc.id, latest.current);
          setUpdatedAt(result.updatedAt);
          setStatus((current) => (current === "new" ? "new" : "draft"));
        }
        setSaveState("idle");
      } catch {
        dirty.current = true;
        setSaveState("error");
      } finally {
        saveLoop.current = null;
      }
    })();
    return saveLoop.current;
  }, [doc.id, doc.type]);

  const commit = useCallback((next: Record<string, unknown>) => {
    setValues(next);
    latest.current = next;
    dirty.current = true;
    setSaveState("pending");
    setPublishError(undefined);
    setStatus((current) => (current === "published" ? "draft" : current));
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, AUTOSAVE_MS);
  }, [flush]);

  const handleBody = useCallback((body: PostBody) => {
    const print = bodyFingerprint(body);
    if (print === bodyPrint.current) return;
    bodyPrint.current = print;

    // Acompanha na prévia o bloco que acabou de mudar
    const before = (latest.current.body ?? []) as PostBody;
    const changed = body.find((block, index) => JSON.stringify(block) !== JSON.stringify(before[index]));
    commit({ ...latest.current, body });
    if (changed) {
      requestAnimationFrame(() => {
        previewBox.current
          ?.querySelector(`[data-block="${CSS.escape(String(changed._key))}"]`)
          ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    }
  }, [commit]);

  const slug = (values.slug as { current?: string } | undefined)?.current ?? "";
  const title = (values.title as string | undefined) ?? "";
  // O endereço acompanha o título até alguém mexer nele ou o artigo ir ao ar
  const slugFollowsTitle = useRef(status === "new" && (!slug || slug === slugify(title)));

  const setTitle = (next: string) => {
    const clean = next.replace(/\n/g, " ");
    commit({
      ...latest.current,
      title: clean,
      ...(slugFollowsTitle.current ? { slug: { _type: "slug", current: slugify(clean) } } : {}),
    });
  };

  const setSlug = (next: string) => {
    slugFollowsTitle.current = false;
    commit({ ...latest.current, slug: { _type: "slug", current: next } });
  };

  const setAuthor = (id: string) => {
    const { author: _previous, ...rest } = latest.current;
    void _previous;
    commit(id ? { ...rest, author: { _type: "reference", _ref: id, _weak: true } } : rest);
  };

  const setCategory = (next: string) => {
    const { category: _previous, ...rest } = latest.current;
    void _previous;
    commit(next ? { ...rest, category: next } : rest);
  };

  // Ao sair do campo, adota a grafia de uma categoria igual que já exista
  const settleCategory = (typed: string) => {
    const name = typed.trim();
    const existing = categories.find((item) => item.slug === slugify(name));
    const settled = existing?.name ?? name;
    if (settled !== typed) setCategory(settled);
  };

  // Altura do título acompanha o texto
  useEffect(() => {
    const element = titleInput.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [title, tab, view]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (saveState !== "idle" && !leaving.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  useEffect(() => {
    const interval = setInterval(() => forceTick((tick) => tick + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  // ⌘S grava na hora, em vez de abrir o "salvar página" do navegador
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (dirty.current) void flush();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flush]);

  const body = values.body as PostBody | undefined;
  const words = countWords(body);
  const missing = [
    !title.trim() && "título",
    !isValidSlug(slug) && "endereço",
    !plainText(body).trim() && "texto",
  ].filter(Boolean) as string[];

  const publish = () =>
    startPublish(async () => {
      setPublishError(undefined);
      // Pega também o que foi digitado há instantes e ainda não chegou ao estado
      if (editor.current) handleBody(editor.current.getValue());
      if (dirty.current) await flush();
      else await saveLoop.current;
      if (dirty.current) return;
      const result = await publishPostAction(doc.id);
      if (result.error) {
        setPublishError(result.error);
        return;
      }
      setStatus("published");
      router.refresh();
    });

  const discard = async () => {
    const ok = await confirm({
      title: "Descartar alterações?",
      description: "As alterações não publicadas serão perdidas e o artigo volta à última versão publicada.",
      confirmLabel: "Descartar",
      tone: "danger",
    });
    if (!ok) return;
    clearTimeout(timer.current);
    dirty.current = false;
    startPublish(async () => {
      await discardDraftAction(doc.type, doc.id);
      // Recarrega em vez de atualizar: o documento pode voltar exatamente ao estado em que
      // a tela abriu, e nesse caso nada remontaria o editor com o texto publicado
      leaving.current = true;
      window.location.reload();
    });
  };

  const remove = async () => {
    const ok = await confirm({
      title: `Excluir ${title ? `“${title}”` : "este artigo"}?`,
      description: "O artigo sai do site e do Sanity. Essa ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    clearTimeout(timer.current);
    dirty.current = false;
    startPublish(() => deleteDocumentAction("post", doc.id));
  };

  const host = siteUrl.replace(/^https?:\/\//, "");
  const authorRef = (values.author as { _ref?: string } | undefined)?._ref;
  const author = authors.find((item) => item.id === authorRef);
  const detailFields = spec.fields.filter(
    (field) => field.group === tab && !CUSTOM_FIELDS.has(field.name),
  );
  const isContent = tab === "content";
  const isSeo = tab === "seo";
  const showEditor = isContent && view !== "preview";
  const showPreview = !isSeo && (!isContent || view !== "write");
  const showBar = status !== "published" || saveState !== "idle";

  return (
    <>
      <Link href={`${ADMIN_BASE}/blog`} className="text-sm text-(--a-muted) hover:text-(--a-ink)">
        ← Blog
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div className="pd-card inline-flex max-w-full overflow-x-auto p-1.5">
          <div className="pd-segmented !bg-transparent !p-0" role="tablist">
            {spec.groups.map((item) => (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={tab === item.name}
                onClick={() => setTab(item.name)}
                className="aria-selected:!bg-(--a-soft)"
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* No celular a prévia fica abaixo do texto */}
          {isContent && (
            <div className="pd-segmented max-lg:!hidden" role="radiogroup" aria-label="Modo de visualização">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  role="radio"
                  aria-checked={view === mode.key}
                  onClick={() => setView(mode.key)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
          <StatusBadge status={status} updatedAt={updatedAt} />
        </div>
      </div>

      <div
        className={`mt-5 grid grid-cols-[minmax(0,1fr)] items-start gap-5 ${
          isSeo || (isContent && view === "split") || !isContent ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""
        }`}
      >
        {/* O editor continua montado nas outras abas: ele guarda histórico e seleção */}
        <div className={`min-w-0 ${showEditor ? "" : "hidden"}`}>
          <section className="pd-card min-w-0">
            <div className="px-5 pb-4 pt-5 sm:px-7">
              <textarea
                ref={titleInput}
                rows={1}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Título do artigo"
                aria-label="Título do artigo"
                className="w-full resize-none overflow-hidden bg-transparent font-serif text-[32px] font-medium leading-[1.12] tracking-tight text-(--a-teal) outline-none placeholder:text-[#b5b6b0]"
              />
              <label className="mt-2 flex items-baseline gap-0.5 text-[13px] text-(--a-muted)">
                <span className="shrink-0">{host}{BLOG_PATH}/</span>
                <input
                  value={slug}
                  onChange={(event) => setSlug(slugifyTyping(event.target.value))}
                  onBlur={(event) => {
                    if (event.target.value !== slugify(event.target.value)) setSlug(slugify(event.target.value));
                  }}
                  placeholder="endereco-do-artigo"
                  aria-label="Endereço do artigo"
                  className="min-w-0 flex-1 rounded bg-transparent font-medium text-(--a-body) outline-none placeholder:font-normal placeholder:text-[#a3a6a2] focus:bg-(--a-soft)"
                />
              </label>
              {status !== "new" && (
                <p className="mt-1 text-xs text-(--a-muted)">
                  Trocar o endereço de um artigo publicado quebra os links já compartilhados.
                </p>
              )}
            </div>
            <div className="border-t border-(--a-line)">
              <BodyEditor ref={editor} initialValue={doc.values.body as PostBody | undefined} onChange={handleBody} />
            </div>
            <p className="flex justify-between border-t border-(--a-line) px-5 py-2.5 text-xs text-(--a-muted) sm:px-7">
              <span>{words} {words === 1 ? "palavra" : "palavras"}</span>
              <span>{readingMinutes(words)} min de leitura</span>
            </p>
          </section>
        </div>

        {!isContent && (
          <section className="pd-card min-w-0 p-6 sm:p-8" key={tab}>
            <FieldList fields={detailFields} value={values} onChange={(next) => commit(next)} />
            {tab === "details" && (
              <>
                <div className="mt-7">
                  <label htmlFor="post-category" className="mb-2 block text-sm font-medium">Categoria</label>
                  <input
                    id="post-category"
                    list="post-categories"
                    value={(values.category as string | undefined) ?? ""}
                    onChange={(event) => setCategory(event.target.value)}
                    onBlur={(event) => settleCategory(event.target.value)}
                    placeholder="Ex.: Regulatório"
                    className="pd-input"
                  />
                  <datalist id="post-categories">
                    {categories.map((item) => <option key={item.slug} value={item.name} />)}
                  </datalist>
                </div>
                <div className="mt-7">
                  <label htmlFor="post-author" className="mb-2 block text-sm font-medium">Autor</label>
                  <select
                    id="post-author"
                    value={author?.id ?? ""}
                    onChange={(event) => setAuthor(event.target.value)}
                    className="pd-input"
                  >
                    <option value="">Sem autor (assina a empresa)</option>
                    {authors.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}{item.role ? ` · ${item.role}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </section>
        )}

        {isSeo && (
          <SeoPreview
            values={{
              siteTitle: values.seoTitle || title,
              description: values.seoDescription || values.excerpt,
              ogImage: values.coverImage,
            }}
            siteUrl={`${siteUrl}${BLOG_PATH}/${slug}`}
          />
        )}

        {showPreview && (
          <aside className="min-w-0 lg:sticky lg:top-[88px]" aria-label="Prévia do artigo">
            <div className="pd-card overflow-hidden">
              <div className="flex items-center gap-3 border-b border-(--a-line) px-4 py-2.5">
                <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-(--a-ok)">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-(--a-ok) opacity-50 motion-reduce:hidden" />
                    <span className="relative inline-flex size-2 rounded-full bg-(--a-ok)" />
                  </span>
                  Prévia ao vivo
                </span>
                <span className="min-w-0 flex-1 truncate text-center text-xs text-(--a-muted)">
                  {host}{BLOG_PATH}/{slug}
                </span>
                <div className="pd-segmented shrink-0 !p-[3px]" role="radiogroup" aria-label="Tamanho da prévia">
                  {(["desktop", "mobile"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="radio"
                      aria-checked={device === item}
                      onClick={() => setDevice(item)}
                      className="!px-2.5 !py-1 !text-xs"
                    >
                      {item === "desktop" ? "Computador" : "Celular"}
                    </button>
                  ))}
                </div>
              </div>
              <div ref={previewBox} className="max-h-[calc(100dvh-160px)] overflow-y-auto bg-[#f3f1eb] [&_a]:pointer-events-none">
                <div
                  className="mx-auto px-5 py-8 transition-[max-width] duration-300 sm:px-8"
                  style={{ maxWidth: device === "mobile" ? 390 : undefined }}
                >
                  <PostArticle
                    title={title}
                    excerpt={values.excerpt as string | undefined}
                    category={values.category as string | undefined}
                    coverImage={values.coverImage as PostImage | undefined}
                    author={author}
                    publishedAt={values.publishedAt as string | undefined}
                    body={body}
                    placeholders
                  />
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      <div className="mt-8 flex items-center gap-5 text-sm">
        {values.publishedAt && status !== "new" && slug ? (
          <a href={`${BLOG_PATH}/${slug}`} target="_blank" className="text-(--a-teal-2) hover:underline">
            Ver no site ↗
          </a>
        ) : null}
        <button type="button" onClick={remove} className="text-(--a-danger) hover:underline">
          Excluir
        </button>
      </div>

      {/* Barra de publicação */}
      <div
        className={`fixed inset-x-0 bottom-5 z-40 mx-auto w-[min(680px,calc(100%-32px))] transition-all duration-300 ${
          showBar ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-2xl bg-(--a-teal) py-2.5 pl-5 pr-2.5 text-sm text-white shadow-[0_12px_32px_rgb(11_59_62/0.35)]">
          <span className="min-w-0 flex-1 truncate text-white/80" role="status">
            {publishError ??
              (saveState === "error"
                ? "Erro ao salvar. Verifique a conexão."
                : saveState === "pending" || saveState === "saving"
                  ? "Salvando rascunho…"
                  : missing.length
                    ? `Para publicar, falta: ${missing.join(", ")}`
                    : `Rascunho salvo ${timeAgo(updatedAt)} · ainda não está no site`)}
          </span>
          {saveState === "error" && (
            <button
              type="button"
              onClick={() => void flush()}
              className="rounded-xl px-3 py-2 text-white transition-colors hover:bg-white/10"
            >
              Tentar de novo
            </button>
          )}
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
            disabled={publishing || saveState === "error" || missing.length > 0}
            className="rounded-xl bg-white px-4 py-2 font-medium text-(--a-teal) transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {publishing ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>
    </>
  );
}
