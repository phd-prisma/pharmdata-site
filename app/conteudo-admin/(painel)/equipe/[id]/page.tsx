import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/admin/DocumentEditor";
import { getEditableDocument } from "@/lib/admin/data";
import { getDocumentSpec } from "@/lib/admin/formSpec";
import { ADMIN_BASE } from "@/lib/admin/paths";

export default async function TeamMemberEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getEditableDocument("teamMember", id);
  if (!doc) notFound();
  return (
    <DocumentEditor
      key={`${doc.status}-${doc.updatedAt}`}
      spec={getDocumentSpec("teamMember")}
      doc={doc}
      kicker="Membro da Equipe"
      fallbackTitle="Novo membro"
      back={{ href: `${ADMIN_BASE}/equipe`, label: "Equipe" }}
      deletable="teamMember"
    />
  );
}
