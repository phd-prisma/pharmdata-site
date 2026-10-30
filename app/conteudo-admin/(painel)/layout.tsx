import { AdminShell } from "@/components/admin/AdminShell";
import { listCollection, listPosts } from "@/lib/admin/data";
import { requireSession } from "@/lib/admin/session";
import { ADMIN_BASE } from "@/lib/admin/paths";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const [team, partners, posts] = await Promise.all([
    listCollection("teamMember"),
    listCollection("partner"),
    listPosts(),
  ]);

  const searchItems = [
    ...team.map((item) => ({
      label: item.title || "Sem nome",
      hint: "Equipe",
      href: `${ADMIN_BASE}/equipe/${item.id}`,
    })),
    ...partners.map((item) => ({
      label: item.title || "Sem nome",
      hint: "Parceiros",
      href: `${ADMIN_BASE}/parceiros/${item.id}`,
    })),
    ...posts.map((item) => ({
      label: item.title || "Sem título",
      hint: "Blog",
      href: `${ADMIN_BASE}/blog/${item.id}`,
    })),
  ];

  return (
    <AdminShell searchItems={searchItems} user={{ name: session.name, image: session.image }}>
      {children}
    </AdminShell>
  );
}
