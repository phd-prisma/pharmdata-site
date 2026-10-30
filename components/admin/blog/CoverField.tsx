"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DropZone } from "@/components/admin/fields";
import { imageUrl, uploadFile } from "@/lib/admin/client-utils";
import type { PostImage } from "@/lib/blog/content";

// Capa no topo do editor: é a primeira coisa do artigo e aparece nos cards do blog
export function CoverField({
  value,
  onChange,
}: {
  value: PostImage | undefined;
  onChange: (next: PostImage | undefined) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const src = imageUrl(value, 1120, 630);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      const asset = await uploadFile(file, "image");
      // Recorte e foco da imagem anterior não valem para a nova
      onChange({ _type: "image", asset: { _type: "reference", _ref: asset._id }, alt: value?.alt });
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-(--a-line)">
      {src
        ? (
            <>
              <DropZone
                accept="image/*"
                busy={busy}
                onFile={upload}
                className="group relative grid aspect-video place-items-center overflow-hidden rounded-t-[15px] bg-(--a-soft)"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-cover" />
                <span className="absolute inset-0 grid place-items-center bg-black/45 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  Trocar imagem de capa
                </span>
              </DropZone>
              <div className="flex flex-wrap items-center gap-2 p-2.5">
                <input
                  value={value?.alt ?? ""}
                  onChange={(event) => onChange({ ...value, alt: event.target.value })}
                  placeholder="Descreva a capa para leitores de tela"
                  aria-label="Texto alternativo da capa"
                  className="pd-input !w-auto min-w-40 flex-1 !px-3 !py-2 !text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => onChange(undefined)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] text-(--a-danger) hover:bg-(--a-soft)"
                >
                  <Trash2 size={15} /> Remover capa
                </button>
              </div>
            </>
          )
        : (
            <DropZone
              accept="image/*"
              busy={busy}
              onFile={upload}
              className="flex items-center justify-center gap-3 rounded-t-[15px] bg-(--a-input) px-5 py-5 text-sm text-(--a-body) hover:bg-(--a-soft)"
            >
              <ImagePlus size={20} className="shrink-0 text-(--a-teal-2)" />
              <span>
                <strong className="font-medium">Adicionar imagem de capa</strong>
                <span className="text-(--a-muted)"> · arraste ou escolha um arquivo, de preferência em 16:9</span>
              </span>
            </DropZone>
          )}
      {error && <p className="px-5 py-2.5 text-sm text-(--a-danger)">{error}</p>}
    </div>
  );
}
