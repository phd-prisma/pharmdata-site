import { DocumentEditor } from "@/components/admin/DocumentEditor";
import { getEditableDocument } from "@/lib/admin/data";
import { getDocumentSpec } from "@/lib/admin/formSpec";

export default async function HomePageEditor() {
  const doc = (await getEditableDocument("homePage", "homePage"))!;
  return (
    <DocumentEditor
      key={`${doc.status}-${doc.updatedAt}`}
      spec={getDocumentSpec("homePage")}
      doc={doc}
      kicker="Página"
      fallbackTitle="Página Inicial"
    />
  );
}
