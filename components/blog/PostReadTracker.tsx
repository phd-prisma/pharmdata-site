"use client";

import { useEffect, useRef } from "react";
import { BLOG_READ_EVENT } from "@/lib/blog/content";

// Tempo mínimo na página: quem só rola até o fim não conta como leitura
const MIN_READ_MS = 15_000;

// Registra uma leitura completa quando o fim do texto aparece na tela
export function PostReadTracker() {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinel.current;
    if (!element) return;
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      timer = setTimeout(
        () => window.umami?.track(BLOG_READ_EVENT),
        Math.max(0, startedAt + MIN_READ_MS - Date.now()),
      );
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return <div ref={sentinel} aria-hidden />;
}
