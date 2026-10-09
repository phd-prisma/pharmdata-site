"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/conteudo-admin/actions";
import { CommandPalette, type SearchItem } from "./CommandPalette";
import { ConfirmProvider } from "./ConfirmDialog";
import { ADMIN_BASE } from "@/lib/admin/paths";

export const NAV = [
  { href: ADMIN_BASE, label: "Visão geral", exact: true },
  { href: `${ADMIN_BASE}/pagina-inicial`, label: "Página Inicial" },
  { href: `${ADMIN_BASE}/configuracoes`, label: "Configurações" },
  { href: `${ADMIN_BASE}/equipe`, label: "Equipe" },
  { href: `${ADMIN_BASE}/parceiros`, label: "Parceiros" },
];

export function AdminShell({
  children,
  searchItems,
  user,
}: {
  children: React.ReactNode;
  searchItems: SearchItem[];
  user: { name: string; image?: string };
}) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <ConfirmProvider>
      <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-4">
        <header className="pd-card sticky top-4 z-30 flex items-center gap-4 px-4 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
          <Link href={ADMIN_BASE} className="flex shrink-0 items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-(--a-teal) text-[15px] font-semibold text-white">
              P
            </span>
            <span className="hidden text-[15px] font-semibold sm:inline">Pharmdata</span>
          </Link>

          <nav className="pd-segmented mx-auto max-w-full overflow-x-auto" aria-label="Seções">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden shrink-0 items-center gap-3 rounded-[10px] border border-(--a-line-2) px-3 py-2 text-[13px] text-(--a-muted) transition-colors hover:border-(--a-teal-2) hover:text-(--a-ink) md:flex"
          >
            Buscar
            <kbd className="rounded-md bg-(--a-soft) px-1.5 py-0.5 font-sans text-[11px]">⌘K</kbd>
          </button>

          <UserMenu user={user} />
        </header>

        <main className="pd-fade-in mt-10" key={pathname}>
          {children}
        </main>

        {searchOpen && (
          <CommandPalette
            onClose={() => setSearchOpen(false)}
            items={[
              ...NAV.map((item) => ({ label: item.label, hint: "Seção", href: item.href })),
              ...searchItems,
            ]}
          />
        )}
      </div>
    </ConfirmProvider>
  );
}

function UserMenu({ user }: { user: { name: string; image?: string } }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        aria-label="Menu da conta"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid size-9 place-items-center overflow-hidden rounded-full bg-(--a-teal-2) text-sm font-semibold text-white transition-transform hover:scale-105"
      >
        {user.image
          ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
            )
          : user.name.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div className="pd-card pd-fade-in absolute right-0 top-12 w-56 overflow-hidden p-1.5 shadow-lg">
          <p className="truncate border-b border-(--a-line) px-3 pb-2.5 pt-1.5 text-sm font-medium">
            {user.name}
          </p>
          <a
            href="/"
            target="_blank"
            className="block rounded-lg px-3 py-2 text-sm hover:bg-(--a-soft)"
          >
            Ver site ↗
          </a>
          <a
            href="/studio"
            target="_blank"
            className="block rounded-lg px-3 py-2 text-sm hover:bg-(--a-soft)"
          >
            Abrir Sanity Studio ↗
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-(--a-danger) hover:bg-(--a-soft)"
            >
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
