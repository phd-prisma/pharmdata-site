"use client";

import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
  useEditor,
  useEditorSelector,
  type Editor,
  type RenderAnnotationFunction,
  type RenderBlockFunction,
  type RenderDecoratorFunction,
  type RenderListItemFunction,
  type RenderStyleFunction,
} from "@portabletext/editor";
import { EditorRefPlugin } from "@portabletext/editor/plugins";
import * as selectors from "@portabletext/editor/selectors";
import { MarkdownShortcutsPlugin } from "@portabletext/plugin-markdown-shortcuts";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import { memo, useEffect, useImperativeHandle, useRef, useState } from "react";
import { imageUrl, uploadFile } from "@/lib/admin/client-utils";
import { normalizeHref, type PostBody, type PostImage, safeHref } from "@/lib/blog/content";

// Precisa acompanhar o campo "body" em sanity/schemas/post.ts
const schemaDefinition = defineSchema({
  decorators: [{ name: "strong" }, { name: "em" }],
  styles: [{ name: "normal" }, { name: "h2" }, { name: "h3" }, { name: "blockquote" }],
  lists: [{ name: "bullet" }, { name: "number" }],
  annotations: [{ name: "link", fields: [{ name: "href", type: "string" }] }],
  inlineObjects: [],
  blockObjects: [
    {
      name: "image",
      fields: [
        { name: "asset", type: "object" },
        { name: "alt", type: "string" },
        { name: "caption", type: "string" },
      ],
    },
  ],
});

const HOTKEYS = { marks: { "mod+b": "strong", "mod+i": "em" } };

export interface BodyEditorHandle {
  // Valor atual, para salvar sem esperar a próxima renderização
  getValue: () => PostBody;
}

const renderStyle: RenderStyleFunction = ({ schemaType, children }) => {
  switch (schemaType.value) {
    case "h2":
      return <h2>{children}</h2>;
    case "h3":
      return <h3>{children}</h3>;
    case "blockquote":
      return <blockquote>{children}</blockquote>;
    default:
      return <p>{children}</p>;
  }
};

const renderDecorator: RenderDecoratorFunction = ({ value, children }) =>
  value === "strong" ? <strong>{children}</strong> : <em>{children}</em>;

const renderAnnotation: RenderAnnotationFunction = ({ value, children }) => (
  <a href={safeHref(value.href)} onClick={(event) => event.preventDefault()}>{children}</a>
);

const renderListItem: RenderListItemFunction = ({ children }) => <>{children}</>;

const renderPlaceholder = () => (
  <span className="post-editor-placeholder">
    Comece a escrever… use a barra acima ou atalhos como ## para título e - para lista.
  </span>
);

const renderBlock: RenderBlockFunction = (props) => {
  if (props.value._type === "image") return <ImageBlock {...props} />;
  return <>{props.children}</>;
};

function ImageBlock({ value, selected, children }: Parameters<RenderBlockFunction>[0]) {
  const image = value as unknown as PostImage;
  return (
    <figure
      className={`rounded-xl border p-2 transition-colors ${selected ? "border-(--a-teal-2) ring-2 ring-(--a-teal-2)/20" : "border-(--a-line)"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl(image, 960)} alt={image.alt ?? ""} contentEditable={false} className="max-h-80 rounded-lg object-contain" />
      <figcaption contentEditable={false} suppressContentEditableWarning className="!mt-2 px-1 !text-[13px]">
        {image.caption || <span className="text-(--a-muted)">Clique na imagem para escrever a legenda</span>}
      </figcaption>
      {/* O editor exige o conteúdo original do bloco na árvore */}
      <span className="hidden">{children}</span>
    </figure>
  );
}

// Fora da área de texto de propósito: campos dentro dela travam a digitação depois de editados
function ImageDetails() {
  const editor = useEditor();
  const focused = useEditorSelector(editor, selectors.getFocusBlockObject);
  if (focused?.node._type !== "image") return null;

  const image = focused.node as unknown as PostImage;
  const at = focused.path;
  const set = (props: Record<string, unknown>) => editor.send({ type: "block.set", at, props });

  return (
    <div key={focused.node._key} className="pd-fade-in flex flex-wrap items-center gap-2 border-b border-(--a-line) bg-(--a-input) p-2.5">
      <input
        defaultValue={image.alt ?? ""}
        onChange={(event) => set({ alt: event.target.value })}
        placeholder="Descrição para leitores de tela"
        aria-label="Texto alternativo"
        className="pd-input !w-auto min-w-40 flex-1 !px-3 !py-2 !text-[13px]"
      />
      <input
        defaultValue={image.caption ?? ""}
        onChange={(event) => set({ caption: event.target.value })}
        placeholder="Legenda (opcional)"
        aria-label="Legenda"
        className="pd-input !w-auto min-w-40 flex-1 !px-3 !py-2 !text-[13px]"
      />
      <button
        type="button"
        onClick={() => editor.send({ type: "delete.block", at })}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] text-(--a-danger) hover:bg-(--a-soft)"
      >
        <Trash2 size={15} /> Remover
      </button>
    </div>
  );
}

function ToolButton({
  label,
  active,
  disabled,
  onPress,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      // Sem isso o clique tira o foco do texto e a seleção se perde
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPress}
      className={`grid size-9 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-35 ${
        active ? "bg-(--a-teal) text-white" : "text-(--a-body) enabled:hover:bg-(--a-soft) enabled:hover:text-(--a-ink)"
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-(--a-line-2)" />;

function LinkTool() {
  const editor = useEditor();
  const active = useEditorSelector(editor, selectors.isActiveAnnotation("link"));
  const canAdd = useEditorSelector(editor, selectors.isSelectionExpanded);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [invalid, setInvalid] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const currentLink = () => {
    const snapshot = editor.getSnapshot();
    const annotation = selectors.getActiveAnnotations(snapshot).find((item) => item._type === "link");
    const block = selectors.getFocusTextBlock(snapshot);
    return { annotation, block };
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setUrl((currentLink().annotation?.href as string | undefined) ?? "");
    setInvalid(false);
    setOpen(true);
  };

  const apply = () => {
    const href = normalizeHref(url);
    if (!safeHref(href)) {
      setInvalid(true);
      return;
    }
    const { annotation, block } = currentLink();
    if (annotation && block) {
      editor.send({
        type: "annotation.set",
        at: [{ _key: block.node._key }, "markDefs", { _key: annotation._key }],
        props: { href },
      });
    } else {
      editor.send({ type: "annotation.add", annotation: { name: "link", value: { href } } });
    }
    setOpen(false);
    editor.send({ type: "focus" });
  };

  const remove = () => {
    editor.send({ type: "annotation.remove", annotation: { name: "link" } });
    setOpen(false);
    editor.send({ type: "focus" });
  };

  return (
    <div className="relative" ref={box}>
      <ToolButton
        label={active ? "Editar link" : canAdd ? "Adicionar link" : "Selecione um trecho para criar um link"}
        active={active || open}
        disabled={!active && !canAdd}
        onPress={toggle}
      >
        <Link2 size={17} />
      </ToolButton>
      {open && (
        <div className="pd-card pd-fade-in absolute left-0 top-11 z-20 w-[min(340px,80vw)] p-3 shadow-lg">
          <input
            autoFocus
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setInvalid(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                apply();
              }
              if (event.key === "Escape") setOpen(false);
            }}
            placeholder="https://…"
            aria-label="Endereço do link"
            aria-invalid={invalid}
            className="pd-input !px-3 !py-2 !text-sm"
          />
          {invalid && <p className="mt-1.5 text-xs text-(--a-danger)">Esse endereço não é válido.</p>}
          <div className="mt-2 flex justify-end gap-2 text-sm">
            {active && (
              <button type="button" onClick={remove} className="rounded-lg px-3 py-1.5 text-(--a-danger) hover:bg-(--a-soft)">
                Remover
              </button>
            )}
            <button type="button" onClick={apply} className="rounded-lg bg-(--a-teal) px-3 py-1.5 font-medium text-white hover:opacity-90">
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Toolbar({ uploading, onPickImage }: { uploading: boolean; onPickImage: () => void }) {
  const editor = useEditor();
  const style = useEditorSelector(editor, selectors.getActiveStyle);
  const listItem = useEditorSelector(editor, selectors.getActiveListItem);
  const strong = useEditorSelector(editor, selectors.isActiveDecorator("strong"));
  const em = useEditorSelector(editor, selectors.isActiveDecorator("em"));

  const run = (event: Parameters<Editor["send"]>[0]) => {
    editor.send(event);
    editor.send({ type: "focus" });
  };
  const setStyle = (name: string) => run({ type: "style.toggle", style: name });

  return (
    <div
      role="toolbar"
      aria-label="Formatação do texto"
      className="flex flex-wrap items-center gap-0.5 border-b border-(--a-line) bg-(--a-card) p-1.5"
    >
      <ToolButton label="Parágrafo" active={style === "normal" && !listItem} onPress={() => setStyle("normal")}>
        <Pilcrow size={17} />
      </ToolButton>
      <ToolButton label="Título" active={style === "h2"} onPress={() => setStyle("h2")}>
        <Heading2 size={17} />
      </ToolButton>
      <ToolButton label="Subtítulo" active={style === "h3"} onPress={() => setStyle("h3")}>
        <Heading3 size={17} />
      </ToolButton>
      <ToolButton label="Citação" active={style === "blockquote"} onPress={() => setStyle("blockquote")}>
        <Quote size={17} />
      </ToolButton>
      <Divider />
      <ToolButton label="Negrito (⌘B)" active={strong} onPress={() => run({ type: "decorator.toggle", decorator: "strong" })}>
        <Bold size={17} />
      </ToolButton>
      <ToolButton label="Itálico (⌘I)" active={em} onPress={() => run({ type: "decorator.toggle", decorator: "em" })}>
        <Italic size={17} />
      </ToolButton>
      <LinkTool />
      <Divider />
      <ToolButton label="Lista" active={listItem === "bullet"} onPress={() => run({ type: "list item.toggle", listItem: "bullet" })}>
        <List size={17} />
      </ToolButton>
      <ToolButton label="Lista numerada" active={listItem === "number"} onPress={() => run({ type: "list item.toggle", listItem: "number" })}>
        <ListOrdered size={17} />
      </ToolButton>
      <ToolButton label={uploading ? "Enviando imagem…" : "Inserir imagem"} disabled={uploading} onPress={onPickImage}>
        <ImagePlus size={17} />
      </ToolButton>
      <span className="ml-auto" />
      <ToolButton label="Desfazer (⌘Z)" onPress={() => run({ type: "history.undo" })}>
        <Undo2 size={17} />
      </ToolButton>
      <ToolButton label="Refazer (⇧⌘Z)" onPress={() => run({ type: "history.redo" })}>
        <Redo2 size={17} />
      </ToolButton>
    </div>
  );
}

function ChangeWatcher({ onChange }: { onChange: (value: PostBody) => void }) {
  const editor = useEditor();
  const value = useEditorSelector(editor, (snapshot) => snapshot.context.value);
  const last = useRef(value);
  useEffect(() => {
    if (value === last.current) return;
    last.current = value;
    onChange((value ?? []) as PostBody);
    // onChange é estável no PostEditor
  }, [value, onChange]);
  return null;
}

function EditorArea({ onChange }: { onChange: (value: PostBody) => void }) {
  const editor = useEditor();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  const insertImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(undefined);
    try {
      const asset = await uploadFile(file, "image");
      editor.send({
        type: "insert.block",
        block: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
        placement: "auto",
        select: "end",
      });
      // Sem um parágrafo depois, uma imagem no fim do texto não deixaria continuar escrevendo
      if (selectors.getFocusBlockObject(editor.getSnapshot())) {
        editor.send({
          type: "insert.block",
          block: { _type: "block", children: [{ _type: "span", text: "" }] },
          placement: "after",
          select: "start",
        });
      }
      editor.send({ type: "focus" });
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const imageFrom = (files: FileList | undefined) =>
    [...(files ?? [])].find((file) => file.type.startsWith("image/"));

  return (
    <div
      onPasteCapture={(event) => {
        const file = imageFrom(event.clipboardData.files);
        if (!file) return;
        event.preventDefault();
        event.stopPropagation();
        void insertImage(file);
      }}
      onDropCapture={(event) => {
        const file = imageFrom(event.dataTransfer.files);
        if (!file) return;
        event.preventDefault();
        event.stopPropagation();
        void insertImage(file);
      }}
    >
      <div className="sticky top-[88px] z-10">
        <Toolbar uploading={uploading} onPickImage={() => fileInput.current?.click()} />
        <ImageDetails />
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          void insertImage(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {error && <p className="px-5 pt-3 text-sm text-(--a-danger)">{error}</p>}
      <div className="post-body post-editor !mt-0">
        <PortableTextEditable
          aria-label="Texto do artigo"
          className="min-h-[420px] px-5 py-5 outline-none sm:px-7"
          renderStyle={renderStyle}
          renderDecorator={renderDecorator}
          renderAnnotation={renderAnnotation}
          renderListItem={renderListItem}
          renderBlock={renderBlock}
          renderPlaceholder={renderPlaceholder}
          hotkeys={HOTKEYS}
        />
      </div>
      <ChangeWatcher onChange={onChange} />
    </div>
  );
}

// memo: cada tecla atualiza a prévia na página, e essa renderização não pode chegar ao editor
export const BodyEditor = memo(function BodyEditor({
  initialValue,
  onChange,
  ref,
}: {
  initialValue: PostBody | undefined;
  onChange: (value: PostBody) => void;
  ref: React.Ref<BodyEditorHandle>;
}) {
  const [initialConfig] = useState(() => ({ schemaDefinition, initialValue: initialValue as never }));
  const editorRef = useRef<Editor>(null);
  useImperativeHandle(ref, () => ({
    getValue: () => (editorRef.current?.getSnapshot().context.value ?? []) as PostBody,
  }), []);

  return (
    <EditorProvider initialConfig={initialConfig}>
      <EditorRefPlugin ref={editorRef} />
      <MarkdownShortcutsPlugin
        boldDecorator={() => "strong"}
        italicDecorator={() => "em"}
        defaultStyle={() => "normal"}
        headingStyle={({ props }) => (props.level === 2 ? "h2" : props.level === 3 ? "h3" : undefined)}
        blockquoteStyle={() => "blockquote"}
        unorderedList={() => "bullet"}
        orderedList={() => "number"}
        linkObject={({ props }) => ({ _type: "link", href: props.href })}
      />
      <EditorArea onChange={onChange} />
    </EditorProvider>
  );
});
