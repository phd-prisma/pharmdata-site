import Link from "next/link";
import { ADMIN_BASE } from "@/lib/admin/paths";

export default function AdminNotFound() {
  return (
    <div className="pd-card mx-auto max-w-md p-10 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Este item não existe mais</h1>
      <p className="mt-2 text-sm text-(--a-muted)">
        Ele pode ter sido excluído ou descartado, aqui ou no Sanity Studio.
      </p>
      <Link
        href={ADMIN_BASE}
        className="mt-6 inline-block rounded-[10px] bg-(--a-teal) px-5 py-2.5 text-sm font-medium text-white"
      >
        Voltar ao painel
      </Link>
    </div>
  );
}
