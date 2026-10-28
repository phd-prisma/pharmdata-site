import "server-only";

// Dados do Umami self-hosted para o painel. Usa um usuário somente leitura
// (UMAMI_API_USERNAME/PASSWORD): as credenciais nunca chegam ao navegador.

const DAY = 86_400_000;
// São Paulo não tem horário de verão desde 2019
const SP_OFFSET = 3 * 60 * 60 * 1000;
const TIMEZONE = "America/Sao_Paulo";

export const PERIODS = {
  "7d": { days: 7, label: "7 dias" },
  "30d": { days: 30, label: "30 dias" },
  "90d": { days: 90, label: "90 dias" },
} as const;

export type Period = keyof typeof PERIODS;

export function parsePeriod(value: unknown): Period {
  return typeof value === "string" && value in PERIODS ? (value as Period) : "30d";
}

interface Stats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

export interface Metric {
  label: string;
  value: number;
}

export interface DayPoint {
  date: string;
  visitors: number;
  pageviews: number;
}

export interface Analytics {
  period: Period;
  current: Stats;
  previous: Stats;
  activeNow: number;
  days: DayPoint[];
  pages: Metric[];
  referrers: Metric[];
  countries: Metric[];
  regions: Metric[];
  cities: Metric[];
  devices: Metric[];
  systems: Metric[];
  browsers: Metric[];
  screens: Metric[];
}

function config() {
  const url = process.env.UMAMI_API_URL?.trim();
  const username = process.env.UMAMI_API_USERNAME?.trim();
  const password = process.env.UMAMI_API_PASSWORD?.trim();
  // UMAMI_WEBSITE_ID permite ver os dados no dev sem carregar o script de rastreamento
  const websiteId =
    process.env.UMAMI_WEBSITE_ID?.trim() || process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  if (!url || !username || !password || !websiteId) return null;
  return { url: url.replace(/\/$/, ""), username, password, websiteId };
}

export const analyticsConfigured = () => config() !== null;

// O token do Umami fica em memória e é renovado quando expira
let cachedToken: string | undefined;

async function login(cfg: NonNullable<ReturnType<typeof config>>) {
  const response = await fetch(`${cfg.url}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: cfg.username, password: cfg.password }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Umami login falhou (${response.status})`);
  cachedToken = ((await response.json()) as { token: string }).token;
  return cachedToken;
}

async function umami<T>(
  cfg: NonNullable<ReturnType<typeof config>>,
  path: string,
  params: Record<string, string | number>,
): Promise<T> {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
  const url = `${cfg.url}/api/websites/${cfg.websiteId}${path}?${query}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = cachedToken && attempt === 0 ? cachedToken : await login(cfg);
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (response.status === 401) {
      cachedToken = undefined;
      continue;
    }
    if (!response.ok) throw new Error(`Umami ${path} respondeu ${response.status}`);
    return (await response.json()) as T;
  }
  throw new Error("Umami recusou as credenciais");
}

// "2026-10-28" no fuso de São Paulo
const spDate = (ms: number) => new Date(ms - SP_OFFSET).toISOString().slice(0, 10);

const DEVICES: Record<string, string> = {
  desktop: "Computador",
  laptop: "Notebook",
  mobile: "Celular",
  tablet: "Tablet",
};

const BROWSERS: Record<string, string> = {
  "chrome": "Chrome",
  "edge-chromium": "Edge",
  "edge": "Edge",
  "firefox": "Firefox",
  "safari": "Safari",
  "ios": "Safari (iOS)",
  "crios": "Chrome (iOS)",
  "opera": "Opera",
  "samsung": "Samsung Internet",
  "facebook": "Facebook",
  "instagram": "Instagram",
};

const BR_STATES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão",
  MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará",
  PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima",
  SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

const countryNames = new Intl.DisplayNames(["pt-BR"], { type: "region" });

function countryName(code: string) {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

// Fora do Brasil, o país vai junto para não confundir cidades homônimas
const withCountry = (name: string, country?: string) =>
  !country || country === "BR" ? name : `${name} · ${countryName(country)}`;

// "BR-CE" → "Ceará"
function regionName(code: string, country?: string) {
  const [prefix, state] = code.split("-");
  if (prefix === "BR" && state && BR_STATES[state]) return BR_STATES[state];
  return withCountry(state ?? code, country);
}

export async function getAnalytics(period: Period): Promise<Analytics | null> {
  const cfg = config();
  if (!cfg) return null;

  const now = Date.now();
  const days = PERIODS[period].days;
  // Começa à meia-noite (horário de Brasília) do primeiro dia do período
  const startOfToday = Math.floor((now - SP_OFFSET) / DAY) * DAY + SP_OFFSET;
  const startAt = startOfToday - (days - 1) * DAY;
  const range = { startAt, endAt: now };
  const metric = (type: string, limit = 8) =>
    umami<{ x: string; y: number; country?: string }[]>(cfg, "/metrics", { ...range, type, limit });

  const [
    stats, series, active, pages, referrers,
    countries, regions, cities, devices, systems, browsers, screens,
  ] = await Promise.all([
    umami<Stats & { comparison: Stats }>(cfg, "/stats", range),
    umami<{ pageviews: { x: string; y: number }[]; sessions: { x: string; y: number }[] }>(
      cfg,
      "/pageviews",
      { ...range, unit: "day", timezone: TIMEZONE },
    ),
    umami<{ visitors: number }>(cfg, "/active", {}),
    metric("path"),
    metric("referrer"),
    metric("country"),
    metric("region"),
    metric("city"),
    metric("device"),
    metric("os"),
    metric("browser"),
    metric("screen"),
  ]);

  // O Umami só devolve os dias que tiveram visita; o gráfico precisa de todos
  const byDay = (points: { x: string; y: number }[]) =>
    new Map(points.map((point) => [point.x.slice(0, 10), point.y]));
  const views = byDay(series.pageviews);
  const sessions = byDay(series.sessions);
  const dayPoints = Array.from({ length: days }, (_, index) => {
    const date = spDate(startAt + index * DAY);
    return { date, visitors: sessions.get(date) ?? 0, pageviews: views.get(date) ?? 0 };
  });

  const toMetrics = (
    rows: { x: string; y: number; country?: string }[],
    name: (x: string, country?: string) => string,
  ) => rows.map((row) => ({ label: name(row.x, row.country), value: row.y }));

  const { comparison, ...current } = stats;

  return {
    period,
    current,
    previous: comparison,
    activeNow: active.visitors ?? 0,
    days: dayPoints,
    pages: toMetrics(pages, (x) => x || "/"),
    referrers: toMetrics(referrers, (x) => x || "Acesso direto"),
    countries: toMetrics(countries, countryName),
    regions: toMetrics(regions, regionName),
    cities: toMetrics(cities, withCountry),
    devices: toMetrics(devices, (x) => DEVICES[x] ?? x),
    systems: toMetrics(systems, (x) => x),
    browsers: toMetrics(browsers, (x) => BROWSERS[x] ?? x),
    screens: toMetrics(screens, (x) => x.replace("x", " × ")),
  };
}

// Resumo leve para a visão geral: visitantes nos últimos 7 dias
export async function getAnalyticsSummary() {
  const cfg = config();
  if (!cfg) return null;
  const now = Date.now();
  const startOfToday = Math.floor((now - SP_OFFSET) / DAY) * DAY + SP_OFFSET;
  const stats = await umami<Stats & { comparison: Stats }>(cfg, "/stats", {
    startAt: startOfToday - 6 * DAY,
    endAt: now,
  });
  return { visitors: stats.visitors, previous: stats.comparison.visitors, pageviews: stats.pageviews };
}
