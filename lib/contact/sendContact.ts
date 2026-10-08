"use server";

import { Resend } from "resend";
import * as z from "zod";
import { getHomeContent } from "@/lib/sanity/getHomeContent";

const schema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome.").max(200),
  empresa: z.string().trim().max(200).optional(),
  email: z.email("Informe um e-mail válido.").max(200),
  telefone: z.string().trim().max(50).optional(),
  mensagem: z.string().trim().max(5000).optional(),
});

export type SendContactResult = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR =
  "Não foi possível enviar sua mensagem agora. Tente novamente ou escreva para nosso e-mail.";

export async function sendContact(
  formData: FormData,
): Promise<SendContactResult> {
  // Campo invisível: só robôs preenchem. Finge sucesso para não dar pista.
  if (formData.get("website")) return { ok: true };

  const parsed = schema.safeParse({
    nome: formData.get("nome") ?? "",
    empresa: formData.get("empresa") || undefined,
    email: formData.get("email") ?? "",
    telefone: formData.get("telefone") || undefined,
    mensagem: formData.get("mensagem") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("RESEND_API_KEY ou CONTACT_FROM_EMAIL não configurados.");
    return { ok: false, error: GENERIC_ERROR };
  }

  const to =
    process.env.CONTACT_TO_EMAIL ??
    (await getHomeContent()).settings.contactEmail;

  const { nome, empresa, email, telefone, mensagem } = parsed.data;
  const text = [
    `Nome: ${nome}`,
    `Empresa: ${empresa ?? "-"}`,
    `E-mail: ${email}`,
    `Telefone: ${telefone ?? "-"}`,
    "",
    "Mensagem:",
    mensagem ?? "-",
  ].join("\n");

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to,
    replyTo: email,
    subject: `Contato pelo site — ${nome}${empresa ? ` (${empresa})` : ""}`,
    text,
  });

  if (error) {
    console.error("Falha ao enviar contato pelo Resend:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  return { ok: true };
}
