"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  COLLECTIONS,
  createDocument,
  deleteDocument,
  discardDraft,
  patchEverywhere,
  publishDocument,
  reorderCollection,
  saveDraft,
  type CollectionType,
} from "@/lib/admin/data";
import { endSession, signInWithSessionId } from "@/lib/admin/session";
import { ADMIN_BASE } from "@/lib/admin/paths";

export async function completeLoginAction(sid: string) {
  const result = await signInWithSessionId(sid);
  if ("error" in result) return result;
  redirect(ADMIN_BASE);
}

export async function logoutAction() {
  await endSession();
  redirect(`${ADMIN_BASE}/login`);
}

export async function saveDraftAction(
  type: string,
  id: string,
  values: Record<string, unknown>,
) {
  return saveDraft(type, id, values);
}

export async function publishAction(type: string, id: string) {
  await publishDocument(type, id);
  revalidatePath(ADMIN_BASE, "layout");
  return { publishedAt: new Date().toISOString() };
}

export async function discardDraftAction(type: string, id: string) {
  await discardDraft(type, id);
  revalidatePath(ADMIN_BASE, "layout");
}

export async function createDocumentAction(type: CollectionType) {
  const id = await createDocument(type);
  redirect(`${ADMIN_BASE}/${COLLECTIONS[type].slug}/${id}`);
}

export async function deleteDocumentAction(type: CollectionType, id: string) {
  await deleteDocument(type, id);
  // Sem revalidar antes: a página do item apagado daria 404 antes do redirecionamento
  redirect(`${ADMIN_BASE}/${COLLECTIONS[type].slug}`);
}

export async function reorderAction(type: CollectionType, orderedIds: string[]) {
  await reorderCollection(type, orderedIds);
  revalidatePath(`${ADMIN_BASE}/${COLLECTIONS[type].slug}`);
}

export async function setCollectionImageAction(
  type: CollectionType,
  id: string,
  assetId: string,
) {
  const field = COLLECTIONS[type].imageField;
  await patchEverywhere(type, id, {
    [field]: { _type: "image", asset: { _type: "reference", _ref: assetId } },
  });
  revalidatePath(`${ADMIN_BASE}/${COLLECTIONS[type].slug}`);
}
