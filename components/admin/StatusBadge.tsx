"use client";

import { timeAgo } from "@/lib/admin/client-utils";
import type { DocStatus } from "@/lib/admin/types";

export function StatusBadge({
  status,
  updatedAt,
  compact = false,
}: {
  status: DocStatus;
  updatedAt?: string;
  compact?: boolean;
}) {
  const published = status === "published";
  const label = published
    ? compact
      ? "Publicado"
      : `Publicado${updatedAt ? ` · editado ${timeAgo(updatedAt)}` : ""}`
    : status === "draft"
      ? "Rascunho"
      : "Não publicado";

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
        published ? "bg-(--a-ok-bg) text-(--a-ok)" : "bg-(--a-warn-bg) text-(--a-warn)"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${published ? "bg-(--a-ok)" : "bg-(--a-warn)"}`}
      />
      {label}
    </span>
  );
}
