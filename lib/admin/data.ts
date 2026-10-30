import "server-only";
import { randomUUID } from "node:crypto";
import { createClient, type SanityDocument } from "@sanity/client";
import { isValidSlug, plainText } from "@/lib/blog/content";
import { requireSession } from "./session";
import type { CollectionItem, DocStatus, EditableDocument, PostListItem } from "./types";

// Cada pessoa edita com o próprio token do Sanity (guardado na sessão),
// então valem as permissões e o histórico de cada usuário
async function userClient() {
  const { token } = await requireSession();
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    apiVersion: "2025-02-19",
    token,
    useCdn: false,
    perspective: "raw",
  });
}

export const COLLECTIONS = {
  teamMember: { slug: "equipe", subtitleField: "role", imageField: "photo" },
  partner: { slug: "parceiros", subtitleField: "kind", imageField: "logo" },
  post: { slug: "blog", subtitleField: "excerpt", imageField: "coverImage" },
} as const;
export type CollectionType = keyof typeof COLLECTIONS;

export const SINGLETONS = new Set(["homePage", "siteSettings"]);
const EDITABLE_TYPES = new Set([...SINGLETONS, ...Object.keys(COLLECTIONS)]);

const SYSTEM_FIELDS = new Set(["_id", "_type", "_rev", "_createdAt", "_updatedAt"]);

const draftId = (id: string) => `drafts.${id}`;
const publishedId = (id: string) => id.replace(/^drafts\./, "");

function assertEditable(type: string) {
  if (!EDITABLE_TYPES.has(type)) throw new Error(`Tipo não editável: ${type}`);
}

function stripSystem(doc: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(doc).filter(([key]) => !SYSTEM_FIELDS.has(key)),
  );
}

export async function getEditableDocument(
  type: string,
  id: string,
): Promise<EditableDocument | null> {
  assertEditable(type);
  const [published, draft] = await (await userClient()).fetch<
    [SanityDocument | null, SanityDocument | null]
  >(`[*[_id == $id][0], *[_id == $draft][0]]`, { id, draft: draftId(id) });

  const current = draft ?? published;
  if (!current && !SINGLETONS.has(type)) return null;
  if (current && current._type !== type) return null;

  return {
    id,
    type,
    status: published ? (draft ? "draft" : "published") : "new",
    updatedAt: current?._updatedAt,
    values: current ? stripSystem(current) : {},
  };
}

export async function saveDraft(
  type: string,
  id: string,
  values: Record<string, unknown>,
) {
  assertEditable(type);
  const doc = await (await userClient()).createOrReplace({
    ...stripSystem(values),
    _id: draftId(id),
    _type: type,
  });
  return { updatedAt: doc._updatedAt };
}

export async function publishDocument(type: string, id: string) {
  assertEditable(type);
  const client = await userClient();
  const draft = await client.getDocument(draftId(id));
  if (!draft) return;
  await client
    .transaction()
    .createOrReplace({ ...stripSystem(draft), _id: id, _type: type })
    .delete(draftId(id))
    .commit();
}

// Publica um artigo depois de conferir o que o site precisa para exibi-lo.
// Devolve o problema em vez de lançar: erros de Server Action não chegam à tela em produção
export async function publishPost(id: string): Promise<{ error?: string }> {
  const client = await userClient();
  const draft = await client.getDocument(draftId(id));
  if (!draft) return {};

  const slug = (draft.slug as { current?: string } | undefined)?.current;
  if (!(draft.title as string | undefined)?.trim()) return { error: "Dê um título ao artigo." };
  if (!isValidSlug(slug)) return { error: "O endereço do artigo está vazio ou inválido." };
  if (!plainText(draft.body as never).trim()) return { error: "Escreva o texto do artigo." };

  const taken = await client.fetch<boolean>(
    `count(*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**")) && _id != $id]) > 0`,
    { slug, id },
  );
  if (taken) return { error: `Já existe um artigo publicado no endereço “${slug}”.` };

  await client
    .transaction()
    .createOrReplace({
      ...stripSystem(draft),
      publishedAt: draft.publishedAt ?? new Date().toISOString(),
      _id: id,
      _type: "post",
    })
    .delete(draftId(id))
    .commit();
  return {};
}

export async function discardDraft(type: string, id: string) {
  assertEditable(type);
  await (await userClient()).delete(draftId(id));
}

export async function createDocument(type: CollectionType) {
  assertEditable(type);
  const id = randomUUID();
  await (await userClient()).create({ _id: draftId(id), _type: type });
  return id;
}

export async function deleteDocument(type: CollectionType, id: string) {
  assertEditable(type);
  await (await userClient())
    .transaction()
    .delete(id)
    .delete(draftId(id))
    .commit();
}

// Grava no publicado e, se houver, no rascunho, para a mudança valer na hora
export async function patchEverywhere(
  type: CollectionType,
  id: string,
  set: Record<string, unknown>,
) {
  assertEditable(type);
  const client = await userClient();
  const ids = await client.fetch<string[]>(
    `*[_id in [$id, $draft] && _type == $type]._id`,
    { id, draft: draftId(id), type },
  );
  const transaction = client.transaction();
  for (const docId of ids) transaction.patch(docId, (patch) => patch.set(set));
  await transaction.commit();
}

export async function reorderCollection(type: CollectionType, orderedIds: string[]) {
  assertEditable(type);
  const client = await userClient();
  const existing = new Set(
    await client.fetch<string[]>(`*[_type == $type]._id`, { type }),
  );
  const transaction = client.transaction();
  orderedIds.forEach((id, index) => {
    for (const docId of [id, draftId(id)]) {
      if (existing.has(docId)) {
        transaction.patch(docId, (patch) => patch.set({ order: index + 1 }));
      }
    }
  });
  await transaction.commit();
}

export async function listCollection(type: CollectionType): Promise<CollectionItem[]> {
  const { subtitleField, imageField } = COLLECTIONS[type];
  const docs = await (await userClient()).fetch<
    {
      _id: string;
      name?: string;
      subtitle?: string;
      imageRef?: string;
      order?: number;
      _createdAt: string;
    }[]
  >(
    `*[_type == $type]{ _id, name, "subtitle": ${subtitleField}, "imageRef": ${imageField}.asset._ref, order, _createdAt }`,
    { type },
  );

  // Junta publicado e rascunho: o rascunho tem prioridade no que é exibido
  const publishedIds = new Set(
    docs.filter((doc) => !doc._id.startsWith("drafts.")).map((doc) => doc._id),
  );
  const byId = new Map<string, CollectionItem & { createdAt: string }>();
  for (const doc of docs) {
    const id = publishedId(doc._id);
    const isDraft = doc._id !== id;
    if (byId.has(id) && !isDraft) continue;
    byId.set(id, {
      id,
      title: doc.name ?? "",
      subtitle: doc.subtitle,
      imageRef: doc.imageRef,
      order: doc.order,
      createdAt: doc._createdAt,
      status: !isDraft ? "published" : publishedIds.has(id) ? "draft" : "new",
    });
  }

  return [...byId.values()]
    .sort(
      (a, b) =>
        (a.order ?? 999) - (b.order ?? 999) || a.createdAt.localeCompare(b.createdAt),
    )
    .map((item) => {
      const { createdAt, ...rest } = item;
      void createdAt;
      return rest;
    });
}

// Mais recentes primeiro; o rascunho tem prioridade no que é exibido
export async function listPosts(): Promise<PostListItem[]> {
  const docs = await (await userClient()).fetch<
    {
      _id: string;
      title?: string;
      slug?: string;
      excerpt?: string;
      category?: string;
      imageRef?: string;
      publishedAt?: string;
      _updatedAt: string;
    }[]
  >(
    `*[_type == "post"]{ _id, title, "slug": slug.current, excerpt, category, "imageRef": coverImage.asset._ref, publishedAt, _updatedAt }`,
  );

  const publishedIds = new Set(
    docs.filter((doc) => !doc._id.startsWith("drafts.")).map((doc) => doc._id),
  );
  const byId = new Map<string, PostListItem>();
  for (const doc of docs) {
    const id = publishedId(doc._id);
    const isDraft = doc._id !== id;
    if (byId.has(id) && !isDraft) continue;
    byId.set(id, {
      id,
      title: doc.title ?? "",
      slug: doc.slug,
      excerpt: doc.excerpt,
      category: doc.category,
      imageRef: doc.imageRef,
      publishedAt: doc.publishedAt,
      updatedAt: doc._updatedAt,
      status: !isDraft ? "published" : publishedIds.has(id) ? "draft" : "new",
    });
  }
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getOverview() {
  const counts = await (await userClient()).fetch<{ team: number; partners: number; posts: number }>(
    `{
      "team": count(*[_type == "teamMember" && !(_id in path("drafts.**"))]),
      "partners": count(*[_type == "partner" && !(_id in path("drafts.**"))]),
      "posts": count(*[_type == "post" && !(_id in path("drafts.**"))])
    }`,
  );
  return counts;
}

export async function uploadAsset(kind: "image" | "file", file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const asset = await (await userClient()).assets.upload(kind, buffer, {
    filename: file.name,
    contentType: file.type,
  });
  return { _id: asset._id, url: asset.url, originalFilename: asset.originalFilename };
}

export type { DocStatus };
