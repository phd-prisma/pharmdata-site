"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { createDocumentAction } from "@/app/conteudo-admin/actions";
import { formatNumber } from "@/components/admin/analytics/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { imageUrl, timeAgo } from "@/lib/admin/client-utils";
import { ADMIN_BASE } from "@/lib/admin/paths";
import type { PostListItem } from "@/lib/admin/types";
import { BLOG_PATH, formatPostDate, listCategories, slugify } from "@/lib/blog/content";

const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "published", label: "Publicados" },
  { key: "pending", label: "Rascunhos" },
] as const;

export function PostList({
  posts,
  views,
}: {
  posts: PostListItem[];
  // null: analytics desligado ou fora do ar
  views: Record<string, { pageviews: number; visitors: number }> | null;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [category, setCategory] = useState("");
  const [creating, startCreate] = useTransition();
  const categories = useMemo(() => listCategories(posts.map((post) => post.category)), [posts]);

  const visible = useMemo(() => {
    const term = normalize(query.trim());
    return posts.filter((post) => {
      if (filter === "published" && post.status !== "published") return false;
      if (filter === "pending" && post.status === "published") return false;
      if (category && slugify(post.category ?? "") !== category) return false;
      return !term || normalize(`${post.title} ${post.excerpt ?? ""}`).includes(term);
    });
  }, [posts, query, filter, category]);

  const create = () => startCreate(() => createDocumentAction("post"));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-(--a-muted)">
            Coleção · {posts.length} {posts.length === 1 ? "artigo" : "artigos"}
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Blog</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`${ADMIN_BASE}/blog/metricas`}
            className="rounded-[10px] border border-(--a-line-2) px-4 py-2.5 text-sm text-(--a-body) transition-colors hover:border-(--a-teal-2) hover:text-(--a-ink)"
          >
            Métricas do blog
          </Link>
          <button
            type="button"
            disabled={creating}
            onClick={create}
            className="shrink-0 rounded-[10px] bg-(--a-teal) px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {creating ? "Criando…" : "+ Novo artigo"}
          </button>
        </div>
      </div>

      {posts.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="pd-segmented" role="radiogroup" aria-label="Filtrar artigos">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="radio"
                aria-checked={filter === item.key}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            {categories.length > 0 && (
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="Filtrar por categoria"
                className="pd-input !w-full !bg-(--a-card) !py-2.5 text-sm sm:!w-52"
              >
                <option value="">Todas as categorias</option>
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name}</option>
                ))}
              </select>
            )}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar artigo"
              aria-label="Buscar artigo"
              className="pd-input !w-full !bg-(--a-card) !py-2.5 text-sm sm:!w-64"
            />
          </div>
        </div>
      )}

      {posts.length === 0
        ? (
            <div className="pd-card mt-8 flex flex-col items-center gap-3 px-6 py-16 text-center">
              <h2 className="text-xl font-semibold tracking-tight">Escreva o primeiro artigo</h2>
              <p className="max-w-md text-sm text-(--a-muted)">
                Você escreve de um lado e vê o resultado do outro, exatamente como vai aparecer no site.
                O rascunho é salvo sozinho e só vai ao ar quando você publicar.
              </p>
              <button
                type="button"
                disabled={creating}
                onClick={create}
                className="mt-3 rounded-[10px] bg-(--a-teal) px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {creating ? "Criando…" : "Começar a escrever"}
              </button>
            </div>
          )
        : (
            <ul className="mt-4 space-y-2">
              {visible.map((post) => {
                const stats = post.slug && views ? views[`${BLOG_PATH}/${post.slug}`] : undefined;
                const cover = imageUrl(post.imageRef, 240, 150);
                return (
                  <li key={post.id}>
                    <Link
                      href={`${ADMIN_BASE}/blog/${post.id}`}
                      className="pd-card flex items-center gap-4 p-3 transition-all hover:border-(--a-line-2) hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)]"
                    >
                      <span className="grid h-[72px] w-[116px] shrink-0 place-items-center overflow-hidden rounded-xl bg-(--a-tint-1)">
                        {cover
                          ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cover} alt="" className="size-full object-cover" />
                            )
                          : <span className="font-serif text-2xl text-(--a-teal)/40">P</span>}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{post.title || "Sem título"}</span>
                        <span className="mt-0.5 block truncate text-sm text-(--a-muted)">
                          {post.excerpt || "Sem resumo"}
                        </span>
                        <span className="mt-1 block text-xs text-(--a-muted)">
                          {post.category && `${post.category} · `}
                          {post.status === "new" || !post.publishedAt
                            ? `Editado ${timeAgo(post.updatedAt)}`
                            : `Publicado em ${formatPostDate(post.publishedAt)}`}
                        </span>
                      </span>
                      {views && post.status !== "new" && (
                        <span className="hidden shrink-0 text-right sm:block">
                          <span className="block text-lg font-semibold tabular-nums leading-tight">
                            {formatNumber(stats?.visitors ?? 0)}
                          </span>
                          <span className="block text-xs text-(--a-muted)">visitantes · 30 dias</span>
                        </span>
                      )}
                      <span className="ml-1 shrink-0">
                        <StatusBadge status={post.status} compact />
                      </span>
                    </Link>
                  </li>
                );
              })}
              {visible.length === 0 && (
                <li className="py-12 text-center text-sm text-(--a-muted)">Nenhum artigo encontrado.</li>
              )}
            </ul>
          )}
    </>
  );
}
