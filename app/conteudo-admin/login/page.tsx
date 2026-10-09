import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLoginProviders, getSession } from "@/lib/admin/session";
import { ADMIN_BASE } from "@/lib/admin/paths";

export default async function LoginPage() {
  if (await getSession()) redirect(ADMIN_BASE);

  // O Sanity só devolve o login para origens cadastradas no CORS do projeto
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const providers = await getLoginProviders(`${protocol}://${host}${ADMIN_BASE}/login/callback`);

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="pd-card pd-fade-in w-full max-w-sm p-8">
        <span className="grid size-10 place-items-center rounded-xl bg-(--a-teal) text-lg font-semibold text-white">
          P
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Painel Pharmdata</h1>
        <p className="mt-1 text-sm text-(--a-muted)">
          Entre com a conta que tem acesso ao projeto no Sanity.
        </p>

        <div className="mt-8 space-y-3">
          {providers.length === 0 && (
            <p className="text-sm text-(--a-danger)">
              Não foi possível carregar as opções de login. Recarregue a página.
            </p>
          )}
          {providers.map((provider) => (
            <a
              key={provider.name}
              href={provider.url}
              className="flex w-full items-center justify-center gap-3 rounded-[10px] border border-(--a-line-2) bg-(--a-card) px-4 py-3 text-sm font-medium transition-colors hover:border-(--a-teal-2) hover:bg-(--a-input)"
            >
              {provider.name === "google" && <GoogleIcon />}
              Entrar com {provider.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
