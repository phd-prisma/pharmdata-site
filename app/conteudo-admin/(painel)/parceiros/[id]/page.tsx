import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/admin/DocumentEditor";
import { getEditableDocument } from "@/lib/admin/data";
import { getDocumentSpec } from "@/lib/admin/formSpec";
import { ADMIN_BASE } from "@/lib/admin/paths";

export default async function PartnerEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getEditableDocument("partner", id);
  if (!doc) notFound();
  return (
    <DocumentEditor
      key={`${doc.status}-${doc.updatedAt}`}
      spec={getDocumentSpec("partner")}
      doc={doc}
      kicker="Parceiro / Cliente"
      fallbackTitle="Novo parceiro"
      back={{ href: `${ADMIN_BASE}/parceiros`, label: "Parceiros" }}
      deletable="partner"
    />
  );
}
