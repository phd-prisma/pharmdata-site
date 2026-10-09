"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  createDocumentAction,
  reorderAction,
  setCollectionImageAction,
} from "@/app/conteudo-admin/actions";
import { imageUrl, uploadFile } from "@/lib/admin/client-utils";
import type { CollectionType } from "@/lib/admin/data";
import type { CollectionItem } from "@/lib/admin/types";
import { DropZone } from "./fields";
import { StatusBadge } from "./StatusBadge";
import { ADMIN_BASE } from "@/lib/admin/paths";

const TINTS = ["bg-(--a-tint-1)", "bg-(--a-tint-2)", "bg-(--a-tint-3)"];

const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function CollectionGrid({
  type,
  items: initialItems,
  title,
  countUnit,
  newLabel,
  imageLabel,
  imageShape,
}: {
  type: CollectionType;
  items: CollectionItem[];
  title: string;
  countUnit: [string, string];
  newLabel: string;
  imageLabel: string;
  imageShape: "portrait" | "landscape";
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [creating, startCreate] = useTransition();

  const [serverItems, setServerItems] = useState(initialItems);
  if (serverItems !== initialItems) {
    setServerItems(initialItems);
    setItems(initialItems);
  }

  const visible = useMemo(() => {
    const term = normalize(query.trim());
    return term
      ? items.filter((item) => normalize(`${item.title} ${item.subtitle ?? ""}`).includes(term))
      : items;
  }, [items, query]);

  const canReorder = !query.trim();
  const count = items.length;

  function moveOver(targetId: string) {
    if (!dragging || dragging === targetId) return;
    setItems((current) => {
      const from = current.findIndex((item) => item.id === dragging);
      const to = current.findIndex((item) => item.id === targetId);
      const next = [...current];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  }

  async function finishDrag() {
    setDragging(null);
    const ids = items.map((item) => item.id);
    if (ids.join() !== initialItems.map((item) => item.id).join()) {
      await reorderAction(type, ids);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-(--a-muted)">
            Coleção · {count} {count === 1 ? countUnit[0] : countUnit[1]}
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">{title}</h1>
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <label className="relative flex-1 sm:w-60 sm:flex-none">
            <span className="absolute left-4 top-1/2 size-4 -translate-y-1/2 rounded-full border-[1.5px] border-(--a-muted)" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar na coleção"
              aria-label="Buscar na coleção"
              className="pd-input !bg-(--a-card) !py-2.5 !pl-11 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={creating}
            onClick={() => startCreate(() => createDocumentAction(type))}
            className="shrink-0 rounded-[10px] bg-(--a-teal) px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {creating ? "Criando…" : `+ ${newLabel}`}
          </button>
        </div>
      </div>

      {canReorder && count > 1 && (
        <p className="mt-6 text-xs text-(--a-muted)">
          Arraste os cards para mudar a ordem no site.
        </p>
      )}

      <ul className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((item) => {
          const tint = TINTS[items.indexOf(item) % TINTS.length];
          return (
            <li
              key={item.id}
              draggable={canReorder}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                setDragging(item.id);
              }}
              onDragOver={(event) => {
                if (!dragging) return;
                event.preventDefault();
                moveOver(item.id);
              }}
              onDragEnd={finishDrag}
              className={`pd-card group overflow-hidden p-2 transition-all duration-200 ${
                dragging === item.id ? "scale-[0.98] opacity-50" : "hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)]"
              } ${canReorder ? "cursor-grab active:cursor-grabbing" : ""}`}
            >
              <CardImage
                type={type}
                item={item}
                label={`${imageLabel} de ${item.title.split(" ")[0] || "sem nome"}`}
                shape={imageShape}
                tint={tint}
                onUploaded={() => router.refresh()}
              />
              <Link
                href={`${ADMIN_BASE}/${type === "teamMember" ? "equipe" : "parceiros"}/${item.id}`}
                draggable={false}
                className="flex items-start justify-between gap-3 rounded-xl px-4 pb-3 pt-4 transition-colors hover:bg-(--a-input)"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.title || "Sem nome"}</p>
                  <p className="truncate text-sm text-(--a-muted)">{item.subtitle || " "}</p>
                </div>
                {item.status !== "published" && <StatusBadge status={item.status} compact />}
              </Link>
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p className="mt-16 text-center text-sm text-(--a-muted)">
          {query ? "Nada encontrado para essa busca." : "Nenhum item ainda."}
        </p>
      )}
    </>
  );
}

function CardImage({
  type,
  item,
  label,
  shape,
  tint,
  onUploaded,
}: {
  type: CollectionType;
  item: CollectionItem;
  label: string;
  shape: "portrait" | "landscape";
  tint: string;
  onUploaded: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [localRef, setLocalRef] = useState(item.imageRef);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      const asset = await uploadFile(file, "image");
      await setCollectionImageAction(type, item.id, asset._id);
      setLocalRef(asset._id);
      onUploaded();
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Exibe perto do tamanho original (as fotos atuais têm ~150 px) para não borrar
  const src =
    shape === "portrait" ? imageUrl(localRef, 224, 224) : imageUrl(localRef, 320);

  return (
    <DropZone
      accept="image/*"
      busy={busy}
      onFile={upload}
      className={`relative grid h-40 place-items-center overflow-hidden rounded-xl ${tint} ${
        src ? "" : "border border-dashed border-(--a-line-2)"
      }`}
    >
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            draggable={false}
            className={
              shape === "portrait"
                ? "size-28 rounded-2xl object-cover shadow-sm"
                : "max-h-20 max-w-36 object-contain"
            }
          />
          <span className="absolute inset-0 grid place-items-center bg-black/40 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            Trocar {label.split(" de ")[0].toLowerCase()}
          </span>
        </>
      ) : (
        <span className="flex flex-col items-center gap-1 px-4 text-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mb-2 text-(--a-muted)"
            aria-hidden
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <span className="text-sm font-medium text-(--a-body)">{label}</span>
          <span className="text-xs text-(--a-muted)">
            ou <span className="underline">escolha um arquivo</span>
          </span>
        </span>
      )}
      {error && (
        <span className="absolute inset-x-2 bottom-2 rounded-lg bg-white/90 px-2 py-1 text-xs text-(--a-danger)">
          {error}
        </span>
      )}
    </DropZone>
  );
}
