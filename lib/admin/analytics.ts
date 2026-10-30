import "server-only";
import { BLOG_CTA_EVENT, BLOG_PATH, BLOG_READ_EVENT } from "@/lib/blog/content";

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
  channels: Metric[];
  // Visitas vindas de assistentes de IA (ChatGPT, Perplexity…), por assistente
  aiAssistants: Metric[];
  aiVisitors: number;
  entries: Metric[];
  exits: Metric[];
  events: Metric[];
  conversions: number;
  // Visitantes que vieram mais de uma vez no período
  returning: { returning: number; total: number; capped: boolean };
  // [dia da semana 0=domingo][hora 0–23], horário de Brasília
  weekly: number[][];
}

export interface VisitorSummary {
  id: string;
  device: string;
  system: string;
  browser: string;
  location: string;
  language: string;
  visits: number;
  views: number;
  firstAt: string;
  lastAt: string;
}

export interface VisitorActivity {
  at: string;
  visitId: string;
  kind: "page" | "event";
  label: string;
  referrer?: string;
}

function config() {
  const url = process.env.UMAMI_API_URL?.trim();
  const username = process.env.UMAMI_API_USERNAME?.trim();
  const password = process.env.UMAMI_API_PASSWORD?.trim();
  // UMAMI_WEBSITE_ID permite ver os dados no dev sem carregar o script de rastreamento
  const websiteId =
    process.env.UMAMI_WEBSITE_ID?.trim() || process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  // Só conta o domínio oficial (com e sem www), não o endereço provisório da AWS
  const hostname = process.env.UMAMI_HOSTNAME?.trim() || "pharmdata.com.br";
  if (!url || !username || !password || !websiteId) return null;
  return { url: url.replace(/\/$/, ""), username, password, websiteId, hostname };
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

const CHANNELS: Record<string, string> = {
  direct: "Acesso direto",
  organicSearch: "Busca orgânica",
  paidSearch: "Busca paga",
  organicSocial: "Redes sociais",
  paidSocial: "Redes sociais (anúncio)",
  email: "E-mail",
  sms: "SMS",
  referral: "Outros sites",
  video: "Vídeo",
  paidVideo: "Vídeo (anúncio)",
  organicShopping: "Shopping",
  paidShopping: "Shopping (anúncio)",
  affiliate: "Afiliados",
  paidAds: "Anúncios",
  paidUnknown: "Anúncios",
};

// Assistentes de IA: reconhecidos pelo site de origem ou pelo utm_source que alguns
// acrescentam aos links (o ChatGPT, por exemplo, às vezes não envia a origem)
const AI_ASSISTANTS = [
  { name: "ChatGPT", match: ["chatgpt.com", "chat.openai.com", "openai.com"] },
  { name: "Perplexity", match: ["perplexity.ai", "perplexity"] },
  { name: "Gemini", match: ["gemini.google.com", "bard.google.com", "gemini"] },
  { name: "Claude", match: ["claude.ai", "claude"] },
  { name: "Copilot", match: ["copilot.microsoft.com", "copilot.cloud.microsoft", "edgeservices.bing.com", "copilot"] },
  { name: "Meta AI", match: ["meta.ai"] },
  { name: "Grok", match: ["grok.com", "grok"] },
  { name: "DeepSeek", match: ["chat.deepseek.com", "deepseek"] },
];

// Domínio: igual ou subdomínio. Nome solto (utm_source=perplexity): igual
function matchesAssistant(value: string, match: string[]) {
  const v = value.toLowerCase();
  return match.some((m) => (m.includes(".") ? v === m || v.endsWith(`.${m}`) : v === m));
}

// Para cada assistente fica o maior valor entre origem e UTM: a mesma visita
// costuma trazer os dois, e somar contaria a pessoa duas vezes
function aiAssistantMetrics(referrers: { x: string; y: number }[], utmSources: { x: string; y: number }[]) {
  const total = (rows: { x: string; y: number }[], match: string[]) =>
    rows.filter((row) => row.x && matchesAssistant(row.x, match)).reduce((sum, row) => sum + row.y, 0);
  return AI_ASSISTANTS
    .map((assistant) => ({
      label: assistant.name,
      value: Math.max(total(referrers, assistant.match), total(utmSources, assistant.match)),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

// Eventos marcados no site (data-umami-event e umami.track)
export const CONVERSION_EVENT = "contato-enviado";
const EVENTS: Record<string, string> = {
  [CONVERSION_EVENT]: "Formulário de contato enviado",
  "cta-cabecalho": "Clique no botão do cabeçalho",
  "cta-hero-agendar": "Clique em “Agende uma conversa”",
  "cta-hero-como-funciona": "Clique em “Como funciona”",
  "nav-blog": "Clique em “Blog” no menu",
  [BLOG_READ_EVENT]: "Artigo lido até o fim",
  [BLOG_CTA_EVENT]: "Clique no botão ao final do artigo",
};

const countryNames = new Intl.DisplayNames(["pt-BR"], { type: "region" });
const languageNames = new Intl.DisplayNames(["pt-BR"], { type: "language" });

function languageName(code: string) {
  try {
    return languageNames.of(code) ?? code;
  } catch {
    return code;
  }
}

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
  const range = { startAt, endAt: now, hostname: `c.${cfg.hostname}` };
  const metric = (type: string, limit = 8) =>
    umami<{ x: string; y: number; country?: string }[]>(cfg, "/metrics", { ...range, type, limit });

  const [
    stats, series, active, pages, referrers,
    countries, regions, cities, devices, systems, browsers, screens,
    channels, entries, exits, events, sessionList, weekly, utmSources,
  ] = await Promise.all([
    umami<Stats & { comparison: Stats }>(cfg, "/stats", range),
    umami<{ pageviews: { x: string; y: number }[]; sessions: { x: string; y: number }[] }>(
      cfg,
      "/pageviews",
      { ...range, unit: "day", timezone: TIMEZONE },
    ),
    umami<{ visitors: number }>(cfg, "/active", {}),
    metric("path"),
    // Lista longa para achar os assistentes de IA; o cartão mostra só os 8 primeiros
    metric("referrer", 500),
    metric("country"),
    metric("region"),
    metric("city"),
    metric("device"),
    metric("os"),
    metric("browser"),
    metric("screen"),
    metric("channel"),
    metric("entry"),
    metric("exit"),
    metric("event", 20),
    umami<SessionPage>(cfg, "/sessions", { ...range, page: 1, pageSize: 1000 }),
    umami<number[][]>(cfg, "/sessions/weekly", { ...range, timezone: TIMEZONE }),
    metric("utmSource", 500),
  ]);
  const aiAssistants = aiAssistantMetrics(referrers, utmSources);
  const visitors = mergeSessions(sessionList.data);

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
    referrers: toMetrics(referrers.slice(0, 8), (x) => x || "Acesso direto"),
    countries: toMetrics(countries, countryName),
    regions: toMetrics(regions, regionName),
    cities: toMetrics(cities, withCountry),
    devices: toMetrics(devices, (x) => DEVICES[x] ?? x),
    systems: toMetrics(systems, (x) => x),
    browsers: toMetrics(browsers, (x) => BROWSERS[x] ?? x),
    screens: toMetrics(screens, (x) => x.replace("x", " × ")),
    channels: toMetrics(channels, (x) => CHANNELS[x] ?? x),
    aiAssistants,
    aiVisitors: aiAssistants.reduce((sum, item) => sum + item.value, 0),
    entries: toMetrics(entries, (x) => x || "/"),
    exits: toMetrics(exits, (x) => x || "/"),
    events: toMetrics(events, (x) => EVENTS[x] ?? x),
    conversions: events.find((row) => row.x === CONVERSION_EVENT)?.y ?? 0,
    returning: {
      returning: visitors.filter((visitor) => visitor.visits > 1).length,
      total: visitors.length,
      capped: sessionList.count > sessionList.data.length,
    },
    weekly,
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
    hostname: `c.${cfg.hostname}`,
  });
  return { visitors: stats.visitors, previous: stats.comparison.visitors, pageviews: stats.pageviews };
}

interface Session {
  id: string;
  hostname: string;
  browser: string;
  os: string;
  device: string;
  language: string;
  country: string;
  region: string;
  city: string;
  firstAt: string;
  lastAt: string;
  visits: number | string;
  views: number | string;
}

interface SessionPage {
  data: Session[];
  count: number;
  page: number;
  pageSize: number;
}

function toVisitor(session: Session): VisitorSummary {
  const place = [session.city, session.region ? regionName(session.region, session.country) : ""]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(", ");
  return {
    id: session.id,
    device: DEVICES[session.device] ?? session.device,
    system: session.os,
    browser: BROWSERS[session.browser] ?? session.browser,
    location: withCountry(place || countryName(session.country), session.country),
    language: session.language ? languageName(session.language) : "",
    visits: Number(session.visits),
    views: Number(session.views),
    firstAt: session.firstAt,
    lastAt: session.lastAt,
  };
}

// O Umami devolve uma linha por visitante e domínio (com e sem www); junta as duas
function mergeSessions(sessions: Session[]) {
  const byId = new Map<string, VisitorSummary>();
  for (const session of sessions) {
    const visitor = toVisitor(session);
    const seen = byId.get(visitor.id);
    if (!seen) {
      byId.set(visitor.id, visitor);
      continue;
    }
    seen.visits += visitor.visits;
    seen.views += visitor.views;
    if (visitor.firstAt < seen.firstAt) seen.firstAt = visitor.firstAt;
    if (visitor.lastAt > seen.lastAt) seen.lastAt = visitor.lastAt;
  }
  return [...byId.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export const VISITORS_PAGE_SIZE = 25;

export async function getVisitors(period: Period, page: number) {
  const cfg = config();
  if (!cfg) return null;
  const now = Date.now();
  const startOfToday = Math.floor((now - SP_OFFSET) / DAY) * DAY + SP_OFFSET;
  const result = await umami<SessionPage>(cfg, "/sessions", {
    startAt: startOfToday - (PERIODS[period].days - 1) * DAY,
    endAt: now,
    hostname: `c.${cfg.hostname}`,
    page,
    pageSize: VISITORS_PAGE_SIZE,
  });
  return {
    visitors: mergeSessions(result.data),
    page: result.page,
    hasMore: result.page * result.pageSize < result.count,
  };
}

export async function getVisitor(id: string) {
  const cfg = config();
  if (!cfg || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const session = await umami<Session & { hostname?: string }>(cfg, `/sessions/${id}`, {}).catch(() => null);
  if (!session?.id) return null;

  const activity = await umami<{
    createdAt: string;
    urlPath: string;
    referrerDomain: string | null;
    eventType: number;
    eventName: string | null;
    visitId: string;
    hostname: string;
  }[]>(cfg, `/sessions/${id}/activity`, {
    startAt: new Date(session.firstAt).getTime() - DAY,
    endAt: Date.now(),
  });

  return {
    visitor: toVisitor(session),
    activity: activity
      .filter((item) => item.hostname?.includes(cfg.hostname))
      .map<VisitorActivity>((item) => ({
        at: item.createdAt,
        visitId: item.visitId,
        kind: item.eventType === 2 ? "event" : "page",
        label: item.eventType === 2 ? EVENTS[item.eventName ?? ""] ?? item.eventName ?? "Evento" : item.urlPath || "/",
        referrer: item.referrerDomain ?? undefined,
      })),
  };
}

export interface BlogPostRow {
  path: string;
  title: string;
  id?: string;
  pageviews: number;
  visitors: number;
  // Ausentes nos artigos além do limite de consultas detalhadas
  reads?: number;
  averageTime?: number;
}

export interface BlogAnalytics {
  period: Period;
  current: Stats;
  previous: Stats;
  days: DayPoint[];
  posts: BlogPostRow[];
  reads: number;
  ctaClicks: number;
  channels: Metric[];
  aiAssistants: Metric[];
  referrers: Metric[];
  entries: Metric[];
  countries: Metric[];
  regions: Metric[];
  cities: Metric[];
  devices: Metric[];
  systems: Metric[];
  browsers: Metric[];
}

// Cada artigo no detalhe custa duas consultas ao Umami
const BLOG_DETAIL_LIMIT = 30;

// O Umami guarda o caminho como veio: "/blog/x#titulo" e "/blog/x/" são o mesmo artigo
const cleanPath = (path: string) => path.split("#")[0].replace(/(.)\/$/, "$1");

function periodRange(cfg: NonNullable<ReturnType<typeof config>>, days: number) {
  const now = Date.now();
  const startOfToday = Math.floor((now - SP_OFFSET) / DAY) * DAY + SP_OFFSET;
  return { startAt: startOfToday - (days - 1) * DAY, endAt: now, hostname: `c.${cfg.hostname}` };
}

// Visitas por caminho dentro do blog. Valores somados entre variações do mesmo caminho
async function blogPathMetrics(
  cfg: NonNullable<ReturnType<typeof config>>,
  range: ReturnType<typeof periodRange>,
) {
  const rows = await umami<{ name: string; pageviews: number | string; visitors: number | string }[]>(
    cfg,
    "/metrics/expanded",
    { ...range, path: `c.${BLOG_PATH}`, type: "path", limit: 500 },
  );
  const byPath = new Map<string, { pageviews: number; visitors: number }>();
  for (const row of rows) {
    const path = cleanPath(row.name);
    if (!path.startsWith(`${BLOG_PATH}/`)) continue;
    const seen = byPath.get(path) ?? { pageviews: 0, visitors: 0 };
    seen.pageviews += Number(row.pageviews);
    seen.visitors += Number(row.visitors);
    byPath.set(path, seen);
  }
  return byPath;
}

// Resumo leve para a lista de artigos do painel: visitantes em 30 dias, por caminho
export async function getPostViews() {
  const cfg = config();
  if (!cfg) return null;
  const byPath = await blogPathMetrics(cfg, periodRange(cfg, PERIODS["30d"].days));
  return Object.fromEntries(byPath);
}

export async function getBlogAnalytics(
  period: Period,
  published: { id: string; title: string; slug?: string }[],
): Promise<BlogAnalytics | null> {
  const cfg = config();
  if (!cfg) return null;

  const days = PERIODS[period].days;
  const baseRange = periodRange(cfg, days);
  const range = { ...baseRange, path: `c.${BLOG_PATH}` };
  const metric = (type: string, limit = 8) =>
    umami<{ x: string; y: number; country?: string }[]>(cfg, "/metrics", { ...range, type, limit });

  const [
    stats, series, byPath, referrers, utmSources, channels, entries,
    countries, regions, cities, devices, systems, browsers, events,
  ] = await Promise.all([
    umami<Stats & { comparison: Stats }>(cfg, "/stats", range),
    umami<{ pageviews: { x: string; y: number }[]; sessions: { x: string; y: number }[] }>(
      cfg,
      "/pageviews",
      { ...range, unit: "day", timezone: TIMEZONE },
    ),
    blogPathMetrics(cfg, baseRange),
    metric("referrer", 500),
    metric("utmSource", 500),
    metric("channel"),
    metric("entry"),
    metric("country"),
    metric("region"),
    metric("city"),
    metric("device"),
    metric("os"),
    metric("browser"),
    metric("event", 20),
  ]);

  // Artigos publicados entram mesmo sem visita; caminhos sem artigo (excluído ou
  // com endereço trocado) continuam na lista, para o histórico não sumir
  const known = new Map(
    published.filter((post) => post.slug).map((post) => [`${BLOG_PATH}/${post.slug}`, post]),
  );
  const rows = [...new Set([...byPath.keys(), ...known.keys()])]
    .map((path) => ({
      path,
      title: known.get(path)?.title || path,
      id: known.get(path)?.id,
      pageviews: byPath.get(path)?.pageviews ?? 0,
      visitors: byPath.get(path)?.visitors ?? 0,
    }))
    .sort((a, b) => b.pageviews - a.pageviews);

  // O total de tempo por caminho vem zerado em /metrics/expanded; só /stats traz o valor
  const posts: BlogPostRow[] = await Promise.all(
    rows.map(async (row, index) => {
      if (index >= BLOG_DETAIL_LIMIT || row.pageviews === 0) {
        return index >= BLOG_DETAIL_LIMIT ? row : { ...row, reads: 0, averageTime: 0 };
      }
      const filter = { ...baseRange, path: `eq.${row.path}` };
      const [detail, rowEvents] = await Promise.all([
        umami<Stats>(cfg, "/stats", filter),
        umami<{ x: string; y: number }[]>(cfg, "/metrics", { ...filter, type: "event", limit: 20 }),
      ]);
      return {
        ...row,
        reads: rowEvents.find((event) => event.x === BLOG_READ_EVENT)?.y ?? 0,
        averageTime: detail.visits ? detail.totaltime / detail.visits : 0,
      };
    }),
  );

  const byDay = (points: { x: string; y: number }[]) =>
    new Map(points.map((point) => [point.x.slice(0, 10), point.y]));
  const views = byDay(series.pageviews);
  const sessions = byDay(series.sessions);
  const toMetrics = (
    list: { x: string; y: number; country?: string }[],
    name: (x: string, country?: string) => string,
  ) => list.map((row) => ({ label: name(row.x, row.country), value: row.y }));
  const { comparison, ...current } = stats;

  return {
    period,
    current,
    previous: comparison,
    days: Array.from({ length: days }, (_, index) => {
      const date = spDate(baseRange.startAt + index * DAY);
      return { date, visitors: sessions.get(date) ?? 0, pageviews: views.get(date) ?? 0 };
    }),
    posts,
    reads: events.find((row) => row.x === BLOG_READ_EVENT)?.y ?? 0,
    ctaClicks: events.find((row) => row.x === BLOG_CTA_EVENT)?.y ?? 0,
    channels: toMetrics(channels, (x) => CHANNELS[x] ?? x),
    aiAssistants: aiAssistantMetrics(referrers, utmSources),
    referrers: toMetrics(referrers.slice(0, 8), (x) => x || "Acesso direto"),
    entries: toMetrics(entries, (x) => x || "/"),
    countries: toMetrics(countries, countryName),
    regions: toMetrics(regions, regionName),
    cities: toMetrics(cities, withCountry),
    devices: toMetrics(devices, (x) => DEVICES[x] ?? x),
    systems: toMetrics(systems, (x) => x),
    browsers: toMetrics(browsers, (x) => BROWSERS[x] ?? x),
  };
}
