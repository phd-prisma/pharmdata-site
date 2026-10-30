import "@/app/blog/blog.css";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/blog/PostEditor";
import { getEditableDocument, listCollection, listPosts } from "@/lib/admin/data";
import { getDocumentSpec } from "@/lib/admin/formSpec";
import { listCategories } from "@/lib/blog/content";
import { siteUrl } from "@/lib/seo/structuredData";

export default async function PostEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc, team, posts] = await Promise.all([
    getEditableDocument("post", id),
    listCollection("teamMember"),
    listPosts(),
  ]);
  if (!doc) notFound();

  return (
    <PostEditor
      key={`${doc.status}-${doc.updatedAt}`}
      spec={getDocumentSpec("post")}
      doc={doc}
      siteUrl={siteUrl}
      categories={listCategories(posts.map((post) => post.category))}
      // Autor precisa estar publicado: a referência a um rascunho não abriria no site
      authors={team
        .filter((member) => member.status !== "new" && member.title)
        .map((member) => ({ id: member.id, name: member.title, role: member.subtitle }))}
    />
  );
}
