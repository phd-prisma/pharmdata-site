// Script do Umami carregado em app/layout.tsx (ausente quando o analytics está desligado)
interface Window {
  umami?: {
    track: (event: string, data?: Record<string, string | number>) => void;
  };
}
