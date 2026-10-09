"use client";

import { useState } from "react";
import { imageUrl } from "@/lib/admin/client-utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function SeoPreview({ values, siteUrl }: { values: Record<string, any>; siteUrl: string }) {
  const [tab, setTab] = useState<"google" | "social">("google");
  const title = values.siteTitle || "Título do site";
  const description = values.description || "Descrição do site";
  const brand = values.brandName || "Pharmdata";
  const ogImage = imageUrl(values.ogImage?.asset?._ref, 1200, 630) ?? "/og";
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <aside className="lg:sticky lg:top-28">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-(--a-muted)">Prévia</span>
        <div className="pd-segmented !p-[3px] text-xs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "google"}
            onClick={() => setTab("google")}
            className="!px-3 !py-1 !text-xs"
          >
            Google
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "social"}
            onClick={() => setTab("social")}
            className="!px-3 !py-1 !text-xs"
          >
            Redes sociais
          </button>
        </div>
      </div>

      {tab === "google" ? (
        <div className="pd-card pd-fade-in p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-(--a-teal) text-sm font-semibold text-white">
              {brand.charAt(0)}
            </span>
            <div className="leading-tight">
              <p className="text-sm">{brand}</p>
              <p className="text-xs text-(--a-muted)">{siteUrl}</p>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-xl leading-snug text-[#1a4fb4]">{title}</p>
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-(--a-body)">
            {description}
          </p>
        </div>
      ) : (
        <div className="pd-card pd-fade-in overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ogImage} alt="" className="aspect-[1200/630] w-full bg-(--a-soft) object-cover" />
          <div className="border-t border-(--a-line) p-4">
            <p className="text-xs uppercase text-(--a-muted)">{host}</p>
            <p className="mt-1 line-clamp-2 font-medium leading-snug">{title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-(--a-muted)">{description}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
