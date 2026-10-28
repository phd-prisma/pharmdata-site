const integer = new Intl.NumberFormat("pt-BR");
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export const formatNumber = (value: number) =>
  value >= 10_000 ? compact.format(value) : integer.format(value);

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return minutes ? `${minutes}min ${rest.toString().padStart(2, "0")}s` : `${rest}s`;
}

export const formatPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;

// "2026-10-28" → "28 de out."
const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export const formatShortDate = (iso: string) => shortDate.format(new Date(`${iso}T00:00:00Z`));
export const formatLongDate = (iso: string) => longDate.format(new Date(`${iso}T00:00:00Z`));
