import { DocumentEditor } from "@/components/admin/DocumentEditor";
import { getEditableDocument } from "@/lib/admin/data";
import { getDocumentSpec } from "@/lib/admin/formSpec";

export default async function SettingsEditor() {
  const doc = (await getEditableDocument("siteSettings", "siteSettings"))!;
  return (
    <DocumentEditor
      key={`${doc.status}-${doc.updatedAt}`}
      spec={getDocumentSpec("siteSettings")}
      doc={doc}
      kicker="Documento único"
      fallbackTitle="Configurações do Site"
      seoPreviewUrl={process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://pharmdata.com.br"}
    />
  );
}
