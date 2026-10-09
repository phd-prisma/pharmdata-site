"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm precisa estar dentro de ConfirmProvider");
  return confirm;
}

// Modal de confirmação no lugar do confirm() do navegador
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const resolver = useRef<(value: boolean) => void>(undefined);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback<Confirm>((next) => {
    setOptions(next);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (options && !dialog.current?.open) dialog.current?.showModal();
  }, [options]);

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = undefined;
    dialog.current?.close();
  };

  const danger = options?.tone === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialog}
        // Esc e clique fora contam como cancelar
        onCancel={(event) => {
          event.preventDefault();
          close(false);
        }}
        onClick={(event) => {
          if (event.target === dialog.current) close(false);
        }}
        onClose={() => setOptions(null)}
        className="pd-confirm m-auto w-[min(420px,calc(100%-32px))] rounded-2xl border border-(--a-line) bg-(--a-card) p-0 text-(--a-ink) shadow-2xl backdrop:bg-black/25 backdrop:backdrop-blur-[2px]"
      >
        {options && (
          <div className="p-6">
            <h2 className="text-lg font-semibold tracking-tight">{options.title}</h2>
            {options.description && (
              <p className="mt-2 text-sm leading-relaxed text-(--a-muted)">{options.description}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-[10px] px-4 py-2.5 text-sm text-(--a-body) transition-colors hover:bg-(--a-soft)"
              >
                {options.cancelLabel ?? "Cancelar"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={`rounded-[10px] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 ${
                  danger ? "bg-(--a-danger)" : "bg-(--a-teal)"
                }`}
              >
                {options.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
