import { CollectionGrid } from "@/components/admin/CollectionGrid";
import { listCollection } from "@/lib/admin/data";

const KIND_LABELS: Record<string, string> = { partner: "Parceiro", client: "Cliente" };

export default async function PartnersPage() {
  const items = await listCollection("partner");
  return (
    <CollectionGrid
      type="partner"
      items={items.map((item) => ({
        ...item,
        subtitle: item.subtitle ? KIND_LABELS[item.subtitle] : undefined,
      }))}
      title="Parceiros / Clientes"
      countUnit={["empresa", "empresas"]}
      newLabel="Novo parceiro"
      imageLabel="Logo"
      imageShape="landscape"
    />
  );
}
