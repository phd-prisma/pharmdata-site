import "server-only";
import { createHash } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ADMIN_BASE } from "@/lib/admin/paths";

const COOKIE_NAME = "pd_admin";
const SESSION_DAYS = 7;
const API_VERSION = "v2021-06-07";

const projectId = () => process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const projectApi = () => `https://${projectId()}.api.sanity.io/${API_VERSION}`;

export interface AdminSession {
  token: string;
  userId: string;
  name: string;
  email?: string;
  image?: string;
}

// O cookie guarda o token do Sanity do usuário, então é criptografado (não só assinado)
function encryptionKey() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET ausente ou curto (mínimo 32 caracteres)");
  }
  return createHash("sha256").update(secret).digest();
}

export async function getLoginProviders(callbackUrl: string) {
  const response = await fetch(`${projectApi()}/auth/providers`, { cache: "no-store" });
  if (!response.ok) return [];
  const { providers } = (await response.json()) as {
    providers: { name: string; title: string; url: string }[];
  };
  // O acesso é pela conta Google liberada no projeto
  const google = providers.filter((provider) => provider.name === "google");
  return (google.length ? google : providers).map((provider) => {
    const url = new URL(provider.url);
    url.searchParams.set("origin", callbackUrl);
    url.searchParams.set("projectId", projectId());
    url.searchParams.set("withSid", "true");
    return { name: provider.name, title: provider.title, url: url.toString() };
  });
}

async function sanityRequest<T>(url: string, token: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return response.ok ? ((await response.json()) as T) : null;
}

// Troca o código de sessão devolvido pelo Sanity pelo token do usuário
// e confere se ele é membro do projeto
export async function signInWithSessionId(sid: string) {
  const exchange = await fetch(
    `${projectApi()}/auth/fetch?sid=${encodeURIComponent(sid)}`,
    { cache: "no-store" },
  );
  if (!exchange.ok) return { error: "Não foi possível concluir o login. Tente de novo." };
  const { token } = (await exchange.json()) as { token?: string };
  if (!token) return { error: "Não foi possível concluir o login. Tente de novo." };

  const [user, project] = await Promise.all([
    sanityRequest<{ id: string; name: string; email?: string; profileImage?: string }>(
      `${projectApi()}/users/me`,
      token,
    ),
    sanityRequest<{ id: string }>(
      `https://api.sanity.io/${API_VERSION}/projects/${projectId()}`,
      token,
    ),
  ]);

  if (!user || !project) {
    await revokeToken(token);
    return { error: "Sua conta não tem acesso a este projeto no Sanity." };
  }

  await createSession({
    token,
    userId: user.id,
    name: user.name,
    email: user.email,
    image: user.profileImage,
  });
  return { ok: true as const };
}

async function createSession(session: AdminSession) {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const jwe = await new EncryptJWT({ ...session })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .encrypt(encryptionKey());

  (await cookies()).set(COOKIE_NAME, jwe, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: ADMIN_BASE,
    expires,
  });
}

async function revokeToken(token: string) {
  await fetch(`${projectApi()}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

export async function endSession() {
  const session = await getSession();
  if (session) await revokeToken(session.token);
  (await cookies()).delete({ name: COOKIE_NAME, path: ADMIN_BASE });
}

export const getSession = cache(async (): Promise<AdminSession | null> => {
  const jwe = (await cookies()).get(COOKIE_NAME)?.value;
  if (!jwe) return null;
  try {
    const { payload } = await jwtDecrypt(jwe, encryptionKey());
    return typeof payload.token === "string" ? (payload as unknown as AdminSession) : null;
  } catch {
    return null;
  }
});

// Usar em toda página, ação e rota do painel: sem sessão, volta ao login
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect(`${ADMIN_BASE}/login`);
  return session;
}
