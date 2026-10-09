import { NextResponse } from "next/server";
import { uploadAsset } from "@/lib/admin/data";
import { getSession } from "@/lib/admin/session";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = {
  image: /^image\/(png|jpeg|webp|gif|svg\+xml|avif)$/,
  file: /^application\/pdf$/,
};

export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind") === "file" ? "file" : "image";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  }
  if (!ALLOWED[kind].test(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo maior que 5 MB" }, { status: 413 });
  }

  const asset = await uploadAsset(kind, file);
  return NextResponse.json(asset);
}
