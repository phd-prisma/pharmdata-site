import { CollectionGrid } from "@/components/admin/CollectionGrid";
import { listCollection } from "@/lib/admin/data";

export default async function TeamPage() {
  const items = await listCollection("teamMember");
  return (
    <CollectionGrid
      type="teamMember"
      items={items}
      title="Membros da Equipe"
      countUnit={["pessoa", "pessoas"]}
      newLabel="Novo membro"
      imageLabel="Foto"
      imageShape="portrait"
    />
  );
}
