"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { completeLoginAction } from "@/app/conteudo-admin/actions";
import { ADMIN_BASE } from "@/lib/admin/paths";

// O Sanity devolve o código de sessão no hash (#sid=...), que só o navegador lê
export function LoginCallback() {
  const [error, setError] = useState<string>();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const sid = window.location.hash.match(/sid=([^&]+)/)?.[1];
    history.replaceState(null, "", window.location.pathname);
    const login = sid
      ? completeLoginAction(decodeURIComponent(sid))
      : Promise.resolve({ error: "Código de login ausente. Tente entrar de novo." });
    login.then((result) => {
      if (result?.error) setError(result.error);
    });
  }, []);

  if (!error) return <p className="text-sm text-(--a-muted)">Entrando…</p>;

  return (
    <>
      <p role="alert" className="text-sm text-(--a-danger)">
        {error}
      </p>
      <Link
        href={`${ADMIN_BASE}/login`}
        className="mt-6 inline-block rounded-[10px] bg-(--a-teal) px-5 py-2.5 text-sm font-medium text-white"
      >
        Voltar ao login
      </Link>
    </>
  );
}
