"use client";

import { useId, useRef, useState } from "react";
import { fileUrl, imageUrl, newKey, uploadFile } from "@/lib/admin/client-utils";
import { useConfirm } from "./ConfirmDialog";
import type { FieldSpec, FieldsetSpec } from "@/lib/admin/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Obj = Record<string, any>;

export function FieldList({
  fields,
  fieldsets = [],
  value,
  onChange,
  depth = 0,
}: {
  fields: FieldSpec[];
  fieldsets?: FieldsetSpec[];
  value: Obj | undefined;
  onChange: (next: Obj) => void;
  depth?: number;
}) {
  const current = value ?? {};
  const setField = (name: string, fieldValue: unknown) => {
    const next = { ...current, [name]: fieldValue };
    if (fieldValue === undefined || fieldValue === "") delete next[name];
    onChange(next);
  };

  // Agrupa campos consecutivos do mesmo fieldset
  const blocks: { fieldset?: FieldsetSpec; fields: FieldSpec[] }[] = [];
  for (const field of fields) {
    const fieldset = fieldsets.find((item) => item.name === field.fieldset);
    const last = blocks.at(-1);
    if (fieldset && last?.fieldset === fieldset) last.fields.push(field);
    else blocks.push({ fieldset, fields: [field] });
  }

  return (
    <div className="space-y-7">
      {blocks.map((block, index) => {
        const rendered = block.fields.map((field) => (
          <Field
            key={field.name}
            spec={field}
            value={current[field.name]}
            onChange={(next) => setField(field.name, next)}
            depth={depth}
          />
        ));
        if (!block.fieldset) return rendered;
        return (
          <Fieldset key={block.fieldset.name + index} fieldset={block.fieldset}>
            {rendered}
          </Fieldset>
        );
      })}
    </div>
  );
}

function Fieldset({
  fieldset,
  children,
}: {
  fieldset: FieldsetSpec;
  children: React.ReactNode;
}) {
  const grid =
    fieldset.columns && fieldset.columns > 1 ? "grid gap-5 sm:grid-cols-2" : "space-y-7";
  const body = <div className={grid}>{children}</div>;

  if (fieldset.collapsed !== undefined) {
    return (
      <details
        open={!fieldset.collapsed}
        className="group rounded-xl border border-(--a-line) px-5 py-4"
      >
        <summary className="list-none text-sm font-medium text-(--a-body)">
          <span className="mr-2 inline-block transition-transform group-open:rotate-90">›</span>
          {fieldset.title}
        </summary>
        <div className="pt-5">{body}</div>
      </details>
    );
  }

  return (
    <fieldset className="space-y-4">
      {fieldset.title && (
        <legend className="text-xs font-medium uppercase tracking-wider text-(--a-muted)">
          {fieldset.title}
        </legend>
      )}
      {fieldset.description && (
        <p className="-mt-2 text-[13px] text-(--a-muted)">{fieldset.description}</p>
      )}
      {body}
    </fieldset>
  );
}

function Label({
  spec,
  htmlFor,
  counter,
  hideDescription,
}: {
  spec: FieldSpec;
  htmlFor?: string;
  counter?: number;
  hideDescription?: boolean;
}) {
  const over = spec.softLimit !== undefined && (counter ?? 0) > spec.softLimit;
  return (
    <div className="mb-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={htmlFor} className="text-sm font-medium text-(--a-ink)">
          {spec.title}
          {spec.required && <span className="ml-0.5 text-(--a-danger)">*</span>}
        </label>
        {spec.softLimit !== undefined && (
          <span
            className={`text-xs tabular-nums ${over ? "text-(--a-warn)" : "text-(--a-muted)"}`}
          >
            {counter ?? 0} / {spec.softLimit}
          </span>
        )}
      </div>
      {spec.description && !hideDescription && (
        <p className="mt-0.5 text-[13px] text-(--a-muted)">{spec.description}</p>
      )}
    </div>
  );
}

export function Field({
  spec,
  value,
  onChange,
  depth,
  hintBelow,
}: {
  spec: FieldSpec;
  value: any;
  onChange: (next: any) => void;
  depth: number;
  // Descrição abaixo do campo, para alinhar campos lado a lado
  hintBelow?: boolean;
}) {
  const id = useId();

  switch (spec.kind) {
    case "string":
    case "url":
      return (
        <div>
          <Label spec={spec} htmlFor={id} counter={value?.length} hideDescription={hintBelow} />
          <input
            id={id}
            type={spec.kind === "url" ? "url" : "text"}
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            className={`pd-input ${spec.emphasis ? "text-[22px] font-semibold" : ""}`}
          />
          {hintBelow && spec.description && (
            <p className="mt-1.5 text-xs text-(--a-muted)">{spec.description}</p>
          )}
        </div>
      );
    case "text":
      return (
        <div>
          <Label spec={spec} htmlFor={id} counter={value?.length} />
          <textarea
            id={id}
            rows={spec.rows}
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            className={`pd-input resize-y ${spec.emphasis ? "text-[22px] font-semibold leading-snug" : ""}`}
          />
        </div>
      );
    case "number":
      return (
        <div>
          <Label spec={spec} htmlFor={id} />
          <input
            id={id}
            type="number"
            value={value ?? ""}
            onChange={(event) =>
              onChange(event.target.value === "" ? undefined : Number(event.target.value))}
            className="pd-input max-w-40"
          />
        </div>
      );
    case "select":
      return (
        <div>
          <Label spec={spec} />
          <div className="pd-segmented" role="radiogroup">
            {spec.options!.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={value === option.value}
                onClick={() => onChange(value === option.value ? undefined : option.value)}
              >
                {option.title}
              </button>
            ))}
          </div>
        </div>
      );
    case "image":
      return <ImageInput spec={spec} value={value} onChange={onChange} />;
    case "file":
      return <FileInput spec={spec} value={value} onChange={onChange} />;
    case "object":
      return <ObjectInput spec={spec} value={value} onChange={onChange} depth={depth} />;
    case "array":
      return <ArrayInput spec={spec} value={value} onChange={onChange} depth={depth} />;
  }
}

function ObjectInput({
  spec,
  value,
  onChange,
  depth,
}: {
  spec: FieldSpec;
  value: Obj | undefined;
  onChange: (next: Obj) => void;
  depth: number;
}) {
  const handleChange = (next: Obj) =>
    onChange(spec.typeName ? { ...next, _type: spec.typeName } : next);

  // Objeto de primeiro nível já tem a aba como título
  if (depth === 0) {
    return (
      <FieldList
        fields={spec.fields!}
        fieldsets={spec.fieldsets}
        value={value}
        onChange={handleChange}
        depth={depth + 1}
      />
    );
  }

  const compact = spec.fields!.length <= 2 && spec.fields!.every((field) => field.kind === "string");
  return (
    <div>
      <Label spec={spec} />
      <div
        className={`rounded-xl border border-(--a-line) p-4 ${compact ? "grid gap-4 sm:grid-cols-2" : ""}`}
      >
        {compact
          ? spec.fields!.map((field) => (
              <Field
                key={field.name}
                spec={field}
                value={value?.[field.name]}
                onChange={(next) => handleChange({ ...value, [field.name]: next })}
                depth={depth + 1}
                hintBelow
              />
            ))
          : (
              <FieldList
                fields={spec.fields!}
                fieldsets={spec.fieldsets}
                value={value}
                onChange={handleChange}
                depth={depth + 1}
              />
            )}
      </div>
    </div>
  );
}

function ArrayInput({
  spec,
  value,
  onChange,
  depth,
}: {
  spec: FieldSpec;
  value: Obj[] | undefined;
  onChange: (next: Obj[]) => void;
  depth: number;
}) {
  const items = value ?? [];
  const of = spec.of!;
  const [openKey, setOpenKey] = useState<string | null>(null);
  const confirm = useConfirm();

  const update = (index: number, next: Obj) =>
    onChange(items.map((item, i) => (i === index ? next : item)));
  const move = (index: number, delta: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };
  const add = () => {
    const key = newKey();
    onChange([...items, { _key: key, _type: of.typeName }]);
    setOpenKey(key);
  };

  const titleField = of.previewTitle ?? of.fields[0]?.name;
  const subtitleField = of.previewSubtitle;

  return (
    <div>
      <Label spec={spec} />
      <ul className="space-y-2">
        {items.map((item, index) => {
          const open = openKey === item._key;
          return (
            <li key={item._key} className="rounded-xl border border-(--a-line) bg-(--a-input)">
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpenKey(open ? null : item._key)}
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={open}
                >
                  <span className="block truncate text-sm font-medium">
                    {item[titleField] || <span className="text-(--a-muted)">Sem título</span>}
                  </span>
                  {subtitleField && item[subtitleField] && (
                    <span className="block truncate text-xs text-(--a-muted)">
                      {item[subtitleField]}
                    </span>
                  )}
                </button>
                <IconButton label="Subir" disabled={index === 0} onClick={() => move(index, -1)}>
                  ↑
                </IconButton>
                <IconButton
                  label="Descer"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </IconButton>
                <IconButton
                  label="Remover"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Remover item?",
                      description: `“${item[titleField] || "Sem título"}” sai da lista quando você publicar.`,
                      confirmLabel: "Remover",
                      tone: "danger",
                    });
                    if (ok) onChange(items.filter((_, i) => i !== index));
                  }}
                >
                  ✕
                </IconButton>
              </div>
              {open && (
                <div className="pd-fade-in border-t border-(--a-line) bg-(--a-card) p-5">
                  <FieldList
                    fields={of.fields}
                    value={item}
                    onChange={(next) => update(index, next)}
                    depth={depth + 1}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={add}
        className="mt-3 rounded-[10px] border border-dashed border-(--a-line-2) px-4 py-2 text-sm text-(--a-body) transition-colors hover:border-(--a-teal-2) hover:text-(--a-teal-2)"
      >
        + Adicionar {of.title.toLowerCase()}
      </button>
    </div>
  );
}

function IconButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-sm text-(--a-muted) transition-colors hover:bg-(--a-soft) hover:text-(--a-ink) disabled:opacity-30 disabled:hover:bg-transparent"
      {...props}
    >
      {children}
    </button>
  );
}

function useUpload(kind: "image" | "file", onUploaded: (asset: { _id: string }) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      onUploaded(await uploadFile(file, kind));
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, upload };
}

export function DropZone({
  accept,
  busy,
  onFile,
  className = "",
  children,
}: {
  accept: string;
  busy: boolean;
  onFile: (file: File | undefined) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") input.current?.click();
      }}
      onDragOver={(event) => {
        // Só reage a arquivos, não a cards sendo reordenados
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        if (!event.dataTransfer.files.length) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        onFile(event.dataTransfer.files[0]);
      }}
      className={`transition-all ${over ? "scale-[1.01] ring-2 ring-(--a-teal-2)" : ""} ${
        busy ? "pointer-events-none opacity-60" : ""
      } ${className}`}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {busy ? <span className="text-sm text-(--a-muted)">Enviando…</span> : children}
    </div>
  );
}

function ImageInput({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: Obj | undefined;
  onChange: (next: Obj | undefined) => void;
}) {
  const ref = value?.asset?._ref as string | undefined;
  const { busy, error, upload } = useUpload("image", (asset) =>
    onChange({
      ...value,
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
      // Recorte e foco antigos não valem para a nova imagem
      crop: undefined,
      hotspot: undefined,
    }),
  );
  const subfields = spec.fields ?? [];

  return (
    <div>
      <Label spec={spec} />
      <div className="flex flex-col gap-5 sm:flex-row">
        <DropZone
          accept="image/*"
          busy={busy}
          onFile={upload}
          className="group relative grid size-32 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-(--a-line-2) bg-(--a-tint-1)"
        >
          {ref ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(ref, 256)} alt="" className="size-full object-contain" />
              <span className="absolute inset-0 grid place-items-center bg-black/45 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                Trocar imagem
              </span>
            </>
          ) : (
            <span className="px-4 text-center text-sm text-(--a-body)">
              Arraste uma imagem
              <br />
              <span className="text-xs text-(--a-muted) underline">ou escolha um arquivo</span>
            </span>
          )}
        </DropZone>
        <div className="min-w-0 flex-1 space-y-5">
          {subfields.map((field) => (
            <Field
              key={field.name}
              spec={field}
              value={value?.[field.name]}
              onChange={(next) => onChange({ ...value, [field.name]: next })}
              depth={2}
            />
          ))}
          {ref && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="text-sm text-(--a-danger) hover:underline"
            >
              Remover imagem
            </button>
          )}
          {error && <p className="text-sm text-(--a-danger)">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function FileInput({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: Obj | undefined;
  onChange: (next: Obj | undefined) => void;
}) {
  const ref = value?.asset?._ref as string | undefined;
  const { busy, error, upload } = useUpload("file", (asset) =>
    onChange({ _type: "file", asset: { _type: "reference", _ref: asset._id } }),
  );

  return (
    <div>
      <Label spec={spec} />
      {ref ? (
        <div className="flex items-center gap-4 rounded-xl border border-(--a-line) bg-(--a-input) px-4 py-3 text-sm">
          <a href={fileUrl(ref)} target="_blank" className="min-w-0 flex-1 truncate text-(--a-teal-2) hover:underline">
            Ver arquivo enviado ↗
          </a>
          <DropZone accept={spec.accept ?? "*/*"} busy={busy} onFile={upload}>
            <span className="text-(--a-body) hover:underline">Trocar</span>
          </DropZone>
          <button type="button" onClick={() => onChange(undefined)} className="text-(--a-danger) hover:underline">
            Remover
          </button>
        </div>
      ) : (
        <DropZone
          accept={spec.accept ?? "*/*"}
          busy={busy}
          onFile={upload}
          className="rounded-xl border border-dashed border-(--a-line-2) bg-(--a-input) px-4 py-5 text-center text-sm text-(--a-body)"
        >
          Arraste o arquivo ou <span className="underline">escolha</span>
        </DropZone>
      )}
      {error && <p className="mt-2 text-sm text-(--a-danger)">{error}</p>}
    </div>
  );
}
