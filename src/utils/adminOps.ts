export const APP_VERSION = '2.4.0';

export type AnnouncementTone = 'info' | 'warning' | 'danger';

export interface GlobalAnnouncement {
  enabled: boolean;
  text: string;
  tone: AnnouncementTone;
  updatedAt?: string;
}

export interface SampleContactFactTemplate {
  columnTitle: string;
  icon: string;
  text: string;
}

export interface SampleContactTemplate {
  name: string;
  subtitle: string;
  group: string;
  demoNoteText: string;
  facts: SampleContactFactTemplate[];
}

export interface FeaturePollOption {
  id: string;
  label: string;
  votes: number;
}

export interface FeaturePoll {
  id: string;
  enabled: boolean;
  question: string;
  options: FeaturePollOption[];
  updatedAt?: string;
}

export type FeatureEventKey =
  | 'ai_analyze'
  | 'dossier_single'
  | 'dossier_all'
  | 'chat_clean'
  | 'calendar_ics'
  | 'local_analyze';

export type FeatureUsageCounters = Record<FeatureEventKey, number>;

export type AiEndpointName = 'analyze' | 'advisor' | 'dossier' | 'greeting';

export interface AiTelemetryRecord {
  id: string;
  timestamp: string;
  endpoint: AiEndpointName;
  latencyMs: number;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  cacheHit: boolean;
  ok: boolean;
  slotUsed?: string;
  errorCode?: string;
}

export interface EndpointAggregateStats {
  endpoint: AiEndpointName;
  requests: number;
  avgLatencyMs: number;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  cacheHits: number;
  errors: number;
}

export type TicketTag = 'urgent' | 'in_progress' | 'fixed';

export interface FeedbackTicket {
  id: string;
  type: 'bug' | 'idea';
  text: string;
  authorLabel: string;
  authorUid?: string;
  isGuest: boolean;
  lang: string;
  appVersion: string;
  status: 'open' | 'resolved';
  tags?: TicketTag[];
  createdAt: string;
  resolvedAt?: string;
  adminReply?: string;
}

export interface UserFeedbackTicketSummary {
  id: string;
  type: 'bug' | 'idea';
  text: string;
  status: 'open' | 'resolved';
  tags?: TicketTag[];
  createdAt: string;
  resolvedAt?: string;
  adminReply?: string;
}

export interface AiPromptStyleConfig {
  advisorVerbosity: 'concise' | 'detailed';
  factGranularity: 'atomic' | 'grouped';
}

export interface UiDefaultSection {
  title: string;
  icon: string;
}

export interface UiDefaultsConfig {
  defaultGroups: string[];
  defaultSections: UiDefaultSection[];
  quickAdvisorPrompts: string[];
}

export interface ErrorBreakdownStats {
  quota429: number;
  timeout503: number;
  authKey: number;
  networkOther: number;
  totalErrors: number;
}

export interface ActivityHeatmapStats {
  hours: number[];
  weekdays: number[];
}

export interface ServiceProbeEntry {
  ok: boolean;
  latencyMs: number;
  detail?: string;
}

export interface ServicesHealthSnapshot {
  checkedAt: string;
  rtdb: ServiceProbeEntry;
  googleAuth: ServiceProbeEntry;
  gemini: ServiceProbeEntry;
}

export interface AlertWebhookTriggers {
  onInvalidKey: boolean;
  onQuotaExceeded: boolean;
  onTrafficSpike: boolean;
  onNewUser: boolean;
  onNewTicket: boolean;
  dailyDigestEnabled: boolean;
}

export interface SafeWebhookStatus {
  configured: boolean;
  provider?: 'telegram' | 'discord' | 'webhook';
  maskedTarget?: string;
  triggers: AlertWebhookTriggers;
  dailyDigestHourUtc?: number;
  lastAutoDigestDateKey?: string;
  lastSentAt?: string;
  lastError?: string;
}

export interface AdminSystemEvent {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface DailyDigestSummary {
  dateKey: string;
  activeVisitors: number;
  aiRequests: number;
  aiErrors: number;
  cacheHits: number;
  tokensSavedEstimate: number;
  openTickets: number;
}

export const ALLOWED_FEATURE_EVENTS: readonly FeatureEventKey[] = [
  'ai_analyze',
  'dossier_single',
  'dossier_all',
  'chat_clean',
  'calendar_ics',
  'local_analyze',
];

export function createEmptyFeatureCounters(): FeatureUsageCounters {
  return {
    ai_analyze: 0,
    dossier_single: 0,
    dossier_all: 0,
    chat_clean: 0,
    calendar_ics: 0,
    local_analyze: 0,
  };
}

export function createDefaultSampleTemplate(): SampleContactTemplate {
  return {
    name: 'Алина',
    subtitle: 'Подруга и продакт-дизайнер',
    group: 'Друзья',
    demoNoteText:
      'Сегодня долго болтали с Алиной! Оказывается, она недавно полностью отказалась от кофе и теперь пьёт только японскую матчу на овсяном молоке. Выяснил, что у неё сильная аллергия на арахис и мёд. Дома у неё живёт рыжий кот по кличке Персик. Она всегда приходит на встречи за 10 минут заранее и строит планы на месяц вперёд. Ещё Алина призналась, что давно мечтает научиться играть на укулеле, но пока не решалась купить инструмент, а осенью хочет съездить в Японию и увидеть Киото.',
    facts: [
      { columnTitle: 'Нравится', icon: '❤️', text: 'Уютные кофейни с тихим джазом' },
      { columnTitle: 'Нравится', icon: '❤️', text: 'Скандинавский минимализм и тёплый свет' },
      { columnTitle: 'Нравится', icon: '❤️', text: 'Дождливые вечера дома с хорошей книгой' },
      { columnTitle: 'Не нравится', icon: '👎', text: 'Когда опаздывают на встречи без предупреждения' },
      { columnTitle: 'Не нравится', icon: '👎', text: 'Шумные торговые центры по выходным' },
      { columnTitle: 'Увлечения', icon: '🎯', text: 'Плёночная фотография (снимает на старый Olympus)' },
      { columnTitle: 'Увлечения', icon: '🎯', text: 'Утренние пробежки в парке по субботам' },
      { columnTitle: 'Еда и напитки', icon: '☕', text: 'Пьёт раф-кофе на кокосовом молоке без сахара' },
      { columnTitle: 'Еда и напитки', icon: '☕', text: 'Любит пасту с морепродуктами' },
      { columnTitle: 'Идеи подарков', icon: '🎁', text: 'Цветная фотоплёнка Kodak Portra 400 (35 мм)' },
      { columnTitle: 'Идеи подарков', icon: '🎁', text: 'Сертификат на гончарный мастер-класс' },
    ],
  };
}

export function sanitizeAnnouncement(raw: unknown): GlobalAnnouncement {
  if (!raw || typeof raw !== 'object') {
    return { enabled: false, text: '', tone: 'info' };
  }
  const obj = raw as { enabled?: unknown; text?: unknown; tone?: unknown; updatedAt?: unknown };
  const tone: AnnouncementTone =
    obj.tone === 'warning' || obj.tone === 'danger' ? obj.tone : 'info';
  return {
    enabled: Boolean(obj.enabled),
    text: String(obj.text || '').trim().slice(0, 240),
    tone,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
  };
}

export function sanitizeSampleTemplate(raw: unknown): SampleContactTemplate {
  const def = createDefaultSampleTemplate();
  if (!raw || typeof raw !== 'object') return def;
  const obj = raw as Partial<SampleContactTemplate>;
  const name = String(obj.name || '').trim().slice(0, 60) || def.name;
  const subtitle = String(obj.subtitle || '').trim().slice(0, 100);
  const group = String(obj.group || '').trim().slice(0, 40) || def.group;
  const demoNoteText = String(obj.demoNoteText || '').trim().slice(0, 1200) || def.demoNoteText;
  const rawFacts = Array.isArray(obj.facts) ? obj.facts : def.facts;
  const facts: SampleContactFactTemplate[] = rawFacts
    .filter((f): f is SampleContactFactTemplate => Boolean(f && typeof f === 'object'))
    .map((f) => ({
      columnTitle: String(f.columnTitle || 'Общее').trim().slice(0, 40) || 'Общее',
      icon: String(f.icon || '📌').trim().slice(0, 4) || '📌',
      text: String(f.text || '').trim().slice(0, 160),
    }))
    .filter((f) => f.text.length > 0)
    .slice(0, 30);

  return {
    name,
    subtitle,
    group,
    demoNoteText,
    facts: facts.length > 0 ? facts : def.facts,
  };
}

export function sanitizePoll(raw: unknown): FeaturePoll {
  if (!raw || typeof raw !== 'object') {
    return { id: 'default-poll', enabled: false, question: '', options: [] };
  }
  const obj = raw as {
    id?: unknown;
    enabled?: unknown;
    question?: unknown;
    options?: unknown;
    updatedAt?: unknown;
  };
  const question = String(obj.question || '').trim().slice(0, 180);
  const rawOptions = Array.isArray(obj.options) ? obj.options : [];
  const options: FeaturePollOption[] = rawOptions
    .filter((o): o is Record<string, unknown> => Boolean(o && typeof o === 'object'))
    .map((o, idx) => ({
      id: String(o.id || `opt_${idx + 1}`).trim().slice(0, 40),
      label: String(o.label || '').trim().slice(0, 80),
      votes:
        typeof o.votes === 'number' && Number.isFinite(o.votes) && o.votes >= 0
          ? Math.floor(o.votes)
          : 0,
    }))
    .filter((o) => o.label.length > 0)
    .slice(0, 6);

  return {
    id: String(obj.id || 'default-poll').trim().slice(0, 64) || 'default-poll',
    enabled: Boolean(obj.enabled) && Boolean(question) && options.length >= 2,
    question,
    options,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
  };
}

export function normalizeTextFingerprint(input: string): string {
  return String(input || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function simpleStableHash(text: string): string {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h1 ^= text.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return (h1 >>> 0).toString(36);
}

export function buildAdvisorCacheKey(params: {
  personName?: string;
  personUpdatedAt?: string;
  columns?: unknown;
  question: string;
  lang: string;
}): string {
  const payload = JSON.stringify({
    n: normalizeTextFingerprint(params.personName || ''),
    u: params.personUpdatedAt || '',
    c: params.columns || [],
    q: normalizeTextFingerprint(params.question),
    l: params.lang || 'ru',
  });
  return `adv_${simpleStableHash(payload)}_${payload.length}`;
}

export function buildDossierCacheKey(params: {
  mode: 'single' | 'all';
  activePersonName?: string;
  people: unknown[];
  lang: string;
}): string {
  const payload = JSON.stringify({
    m: params.mode,
    a: normalizeTextFingerprint(params.activePersonName || ''),
    p: params.people || [],
    l: params.lang || 'ru',
  });
  return `dos_${simpleStableHash(payload)}_${payload.length}`;
}

export function computeEndpointStats(
  records: AiTelemetryRecord[]
): EndpointAggregateStats[] {
  const endpoints: AiEndpointName[] = ['analyze', 'advisor', 'dossier', 'greeting'];
  return endpoints.map((ep) => {
    const subset = records.filter((r) => r.endpoint === ep);
    const nonCache = subset.filter((r) => !r.cacheHit);
    const latencySource = nonCache.length > 0 ? nonCache : subset;
    const totalLatency = latencySource.reduce((acc, r) => acc + r.latencyMs, 0);
    return {
      endpoint: ep,
      requests: subset.length,
      avgLatencyMs:
        latencySource.length > 0 ? Math.round(totalLatency / latencySource.length) : 0,
      promptTokens: subset.reduce((acc, r) => acc + r.promptTokens, 0),
      candidatesTokens: subset.reduce((acc, r) => acc + r.candidatesTokens, 0),
      totalTokens: subset.reduce((acc, r) => acc + r.totalTokens, 0),
      cacheHits: subset.filter((r) => r.cacheHit).length,
      errors: subset.filter((r) => !r.ok).length,
    };
  });
}

function isPrivateOrLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return true;
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === 'metadata.google.internal' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }

  // IPv6 private ranges (fc00::/7, fe80::/10)
  if (host.includes(':')) {
    if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
      return true;
    }
    return false;
  }

  const ipv4Parts = host.split('.');
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => /^\d+$/.test(p))) {
    const octets = ipv4Parts.map(Number);
    if (octets.some((n) => n < 0 || n > 255)) return true;
    const [a, b] = octets;
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }

  return false;
}

export function detectWebhookProvider(
  urlObj: URL
): 'telegram' | 'discord' | 'webhook' {
  const host = urlObj.hostname.toLowerCase();
  if (host === 'api.telegram.org') return 'telegram';
  if (
    host === 'discord.com' ||
    host === 'discordapp.com' ||
    host === 'ptb.discord.com' ||
    host === 'canary.discord.com'
  ) {
    return 'discord';
  }
  return 'webhook';
}

export function validateSafeWebhookUrl(rawUrl: string): {
  valid: boolean;
  normalizedUrl?: string;
  provider?: 'telegram' | 'discord' | 'webhook';
  error?: string;
} {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) {
    return { valid: true, normalizedUrl: '' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'INVALID_URL' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'HTTPS_REQUIRED' };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: 'CREDENTIALS_IN_URL_NOT_ALLOWED' };
  }

  if (isPrivateOrLocalHostname(parsed.hostname)) {
    return { valid: false, error: 'PRIVATE_HOST_BLOCKED' };
  }

  return {
    valid: true,
    normalizedUrl: parsed.toString(),
    provider: detectWebhookProvider(parsed),
  };
}

export function maskWebhookUrl(rawUrl: string): string {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    const tail = parsed.pathname.slice(-4);
    return `${parsed.origin}/•••${tail || '***'}`;
  } catch {
    return 'https://•••';
  }
}

export function isTrafficSpike(
  timestampsMs: number[],
  nowMs: number = Date.now(),
  windowMs = 60_000,
  threshold = 25
): boolean {
  let count = 0;
  for (const ts of timestampsMs) {
    if (nowMs - ts <= windowMs && ts <= nowMs) {
      count++;
    }
  }
  return count >= threshold;
}

export const DEFAULT_AI_PROMPT_STYLE: AiPromptStyleConfig = {
  advisorVerbosity: 'concise',
  factGranularity: 'atomic',
};

export function sanitizeAiPromptStyle(raw: unknown): AiPromptStyleConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_AI_PROMPT_STYLE };
  }
  const obj = raw as { advisorVerbosity?: unknown; factGranularity?: unknown };
  return {
    advisorVerbosity: obj.advisorVerbosity === 'detailed' ? 'detailed' : 'concise',
    factGranularity: obj.factGranularity === 'grouped' ? 'grouped' : 'atomic',
  };
}

export function createDefaultUiDefaults(): UiDefaultsConfig {
  return {
    defaultGroups: ['Семья', 'Друзья', 'Работа', 'Университет'],
    defaultSections: [
      { title: 'Нравится', icon: '❤️' },
      { title: 'Не нравится', icon: '👎' },
      { title: 'Увлечения', icon: '🎯' },
    ],
    quickAdvisorPrompts: [
      'Что подарить?',
      'Куда позвать на встречу?',
      'О чём поговорить при встрече?',
      'Какие есть табу и аллергии?',
    ],
  };
}

export function sanitizeUiDefaults(raw: unknown): UiDefaultsConfig {
  const def = createDefaultUiDefaults();
  if (!raw || typeof raw !== 'object') return def;
  const obj = raw as {
    defaultGroups?: unknown;
    defaultSections?: unknown;
    quickAdvisorPrompts?: unknown;
  };

  const groups = Array.isArray(obj.defaultGroups)
    ? Array.from(
        new Set(
          obj.defaultGroups
            .map((g) => String(g || '').trim().slice(0, 32))
            .filter(Boolean)
        )
      ).slice(0, 10)
    : def.defaultGroups;

  const rawSections = Array.isArray(obj.defaultSections) ? obj.defaultSections : def.defaultSections;
  const sections: UiDefaultSection[] = rawSections
    .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === 'object'))
    .map((s) => ({
      title: String(s.title || '').trim().slice(0, 36),
      icon: String(s.icon || '📌').trim().slice(0, 4) || '📌',
    }))
    .filter((s) => s.title.length > 0)
    .slice(0, 12);

  const prompts = Array.isArray(obj.quickAdvisorPrompts)
    ? Array.from(
        new Set(
          obj.quickAdvisorPrompts
            .map((q) => String(q || '').trim().slice(0, 90))
            .filter(Boolean)
        )
      ).slice(0, 8)
    : def.quickAdvisorPrompts;

  return {
    defaultGroups: groups.length > 0 ? groups : def.defaultGroups,
    defaultSections: sections.length > 0 ? sections : def.defaultSections,
    quickAdvisorPrompts: prompts.length > 0 ? prompts : def.quickAdvisorPrompts,
  };
}

export function sanitizeTicketTags(raw: unknown): TicketTag[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<TicketTag>(['urgent', 'in_progress', 'fixed']);
  const out: TicketTag[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && allowed.has(item as TicketTag) && !out.includes(item as TicketTag)) {
      out.push(item as TicketTag);
    }
  }
  return out;
}

export function computeErrorBreakdown(records: AiTelemetryRecord[]): ErrorBreakdownStats {
  const stats: ErrorBreakdownStats = {
    quota429: 0,
    timeout503: 0,
    authKey: 0,
    networkOther: 0,
    totalErrors: 0,
  };
  for (const rec of records) {
    if (rec.ok) continue;
    stats.totalErrors++;
    const code = String(rec.errorCode || '').toUpperCase();
    if (code.includes('RESOURCE_EXHAUSTED') || code.includes('429')) {
      stats.quota429++;
    } else if (code.includes('UNAVAILABLE') || code.includes('TIMEOUT') || code.includes('503')) {
      stats.timeout503++;
    } else if (
      code.includes('API_KEY') ||
      code.includes('PERMISSION_DENIED') ||
      code.includes('NO_API_KEY')
    ) {
      stats.authKey++;
    } else {
      stats.networkOther++;
    }
  }
  return stats;
}

export function createEmptyActivityHeatmap(): ActivityHeatmapStats {
  return {
    hours: Array.from({ length: 24 }, () => 0),
    weekdays: Array.from({ length: 7 }, () => 0),
  };
}

export function recordActivitySlot(
  heatmap: ActivityHeatmapStats,
  date: Date = new Date()
): ActivityHeatmapStats {
  const hour = date.getUTCHours();
  // Monday=0 ... Sunday=6
  const jsDay = date.getUTCDay();
  const weekdayIdx = jsDay === 0 ? 6 : jsDay - 1;
  if (hour >= 0 && hour < 24 && Array.isArray(heatmap.hours) && heatmap.hours.length === 24) {
    heatmap.hours[hour] = (heatmap.hours[hour] || 0) + 1;
  }
  if (
    weekdayIdx >= 0 &&
    weekdayIdx < 7 &&
    Array.isArray(heatmap.weekdays) &&
    heatmap.weekdays.length === 7
  ) {
    heatmap.weekdays[weekdayIdx] = (heatmap.weekdays[weekdayIdx] || 0) + 1;
  }
  return heatmap;
}

export function sanitizeVersionString(raw: unknown, fallback: string = APP_VERSION): string {
  const cleaned = String(raw || '').trim().replace(/^v/i, '');
  const match = cleaned.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return fallback;
  return `${Number(match[1])}.${Number(match[2])}.${Number(match[3] || 0)}`;
}

export function isClientVersionOutdated(currentVersion: string, minVersion: string): boolean {
  const parseParts = (v: string): [number, number, number] => {
    const clean = String(v || '').trim().replace(/^v/i, '');
    const m = clean.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
    if (!m) return [0, 0, 0];
    return [Number(m[1] || 0), Number(m[2] || 0), Number(m[3] || 0)];
  };
  const [c1, c2, c3] = parseParts(currentVersion);
  const [m1, m2, m3] = parseParts(minVersion);
  if (m1 === 0 && m2 === 0 && m3 === 0) return false;
  if (c1 !== m1) return c1 < m1;
  if (c2 !== m2) return c2 < m2;
  return c3 < m3;
}

function escapeCsvCell(raw: unknown): string {
  const str = String(raw ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildAdminExportCsv(params: {
  requests: AiTelemetryRecord[];
  tickets: FeedbackTicket[];
  events: AdminSystemEvent[];
}): string {
  const rows: string[] = [
    ['category', 'id', 'timestamp', 'type_or_endpoint', 'status', 'latency_ms', 'tokens', 'details']
      .map(escapeCsvCell)
      .join(','),
  ];

  for (const r of params.requests || []) {
    rows.push(
      [
        'ai_request',
        r.id,
        r.timestamp,
        r.endpoint,
        r.ok ? (r.cacheHit ? 'CACHE_HIT' : 'OK') : r.errorCode || 'ERROR',
        r.latencyMs,
        r.totalTokens,
        r.slotUsed || '',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const tk of params.tickets || []) {
    rows.push(
      [
        'ticket',
        tk.id,
        tk.createdAt,
        tk.type,
        tk.status,
        '',
        '',
        `${tk.authorLabel}: ${tk.text}${tk.adminReply ? ` | Reply: ${tk.adminReply}` : ''}`,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const ev of params.events || []) {
    rows.push(
      ['system_event', ev.id, ev.timestamp, ev.level, ev.level, '', '', ev.message]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return '\uFEFF' + rows.join('\r\n');
}

export function shouldFallbackToDirectRtdb(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  if (!msg) return false;
  if (msg === 'HTTP_404' || msg === 'HTTP_405' || msg === 'HTTP_501') {
    return true;
  }
  const lower = msg.toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed')
  );
}

export function normalizeTicketsCollection(raw: unknown): FeedbackTicket[] {
  if (!raw || typeof raw !== 'object') return [];
  const values = Array.isArray(raw) ? raw : Object.values(raw as Record<string, unknown>);
  return values
    .filter((item): item is FeedbackTicket => {
      if (!item || typeof item !== 'object') return false;
      const obj = item as Partial<FeedbackTicket>;
      return Boolean(obj.id && obj.text);
    })
    .map((tk): FeedbackTicket => {
      const ticketType: 'bug' | 'idea' = tk.type === 'idea' ? 'idea' : 'bug';
      const ticketStatus: 'open' | 'resolved' = tk.status === 'resolved' ? 'resolved' : 'open';
      return {
        ...tk,
        id: String(tk.id),
        type: ticketType,
        text: String(tk.text),
        authorLabel: String(tk.authorLabel || 'Пользователь'),
        isGuest: Boolean(tk.isGuest),
        lang: String(tk.lang || 'ru'),
        appVersion: String(tk.appVersion || APP_VERSION),
        status: ticketStatus,
        tags: sanitizeTicketTags(tk.tags),
        createdAt: typeof tk.createdAt === 'string' ? tk.createdAt : new Date().toISOString(),
      };
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 100);
}

export function applyAdminTicketMutation(
  tickets: FeedbackTicket[],
  payload: {
    id: string;
    action: 'update' | 'resolve' | 'reopen' | 'delete';
    reply?: string;
    tags?: TicketTag[];
    publishToBanner?: boolean;
  }
): { tickets: FeedbackTicket[]; announcement?: GlobalAnnouncement } {
  const id = String(payload.id || '').trim();
  if (payload.action === 'delete') {
    return { tickets: tickets.filter((tk) => tk.id !== id) };
  }
  const cleanReply = typeof payload.reply === 'string' ? payload.reply.trim().slice(0, 500) : undefined;
  const nowIso = new Date().toISOString();
  const nextTickets = tickets.map((tk): FeedbackTicket => {
    if (tk.id !== id) return tk;
    const nextStatus: 'open' | 'resolved' =
      payload.action === 'resolve' ? 'resolved' : payload.action === 'reopen' ? 'open' : tk.status;
    return {
      ...tk,
      status: nextStatus,
      tags: Array.isArray(payload.tags) ? sanitizeTicketTags(payload.tags) : tk.tags || [],
      ...(cleanReply !== undefined
        ? cleanReply
          ? { adminReply: cleanReply }
          : {}
        : {}),
      resolvedAt:
        payload.action === 'resolve'
          ? nowIso
          : payload.action === 'reopen'
          ? undefined
          : tk.resolvedAt,
    };
  });

  if (payload.publishToBanner && cleanReply) {
    return {
      tickets: nextTickets,
      announcement: {
        enabled: true,
        text: cleanReply.slice(0, 240),
        tone: 'info',
        updatedAt: nowIso,
      },
    };
  }
  return { tickets: nextTickets };
}

export function sanitizeConfigBackupBundle(raw: unknown): {
  aiSettings: Record<string, unknown>;
  tickets?: FeedbackTicket[];
} {
  if (!raw || typeof raw !== 'object') {
    throw new Error('INVALID_BACKUP_BUNDLE');
  }
  const obj = raw as {
    bundle?: unknown;
    aiSettings?: unknown;
    tickets?: unknown;
  };
  const source =
    obj.bundle && typeof obj.bundle === 'object'
      ? (obj.bundle as { aiSettings?: unknown; tickets?: unknown })
      : obj;

  if (!source.aiSettings || typeof source.aiSettings !== 'object') {
    throw new Error('INVALID_BACKUP_BUNDLE');
  }

  const ai = source.aiSettings as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  if (typeof ai.sharedAiEnabled === 'boolean') sanitized.sharedAiEnabled = ai.sharedAiEnabled;
  if (typeof ai.guestAiEnabled === 'boolean') sanitized.guestAiEnabled = ai.guestAiEnabled;
  if (typeof ai.readOnlyMode === 'boolean') sanitized.readOnlyMode = ai.readOnlyMode;
  if (typeof ai.keyRouteMode === 'string') sanitized.keyRouteMode = ai.keyRouteMode;
  if (typeof ai.aiModelPreset === 'string') sanitized.aiModelPreset = ai.aiModelPreset;
  if (ai.aiPromptStyle) sanitized.aiPromptStyle = sanitizeAiPromptStyle(ai.aiPromptStyle);
  if (ai.uiDefaults) sanitized.uiDefaults = sanitizeUiDefaults(ai.uiDefaults);
  if (typeof ai.minClientVersion === 'string') {
    sanitized.minClientVersion = sanitizeVersionString(ai.minClientVersion);
  }
  if (typeof ai.dailyDigestHourUtc === 'number' && Number.isFinite(ai.dailyDigestHourUtc)) {
    const h = Math.floor(ai.dailyDigestHourUtc);
    if (h >= 0 && h <= 23) sanitized.dailyDigestHourUtc = h;
  }
  if (Array.isArray(ai.extraAdminUids)) {
    sanitized.extraAdminUids = Array.from(
      new Set(ai.extraAdminUids.map((v) => String(v || '').trim()).filter((v) => v && !v.includes('@')))
    ).slice(0, 25);
  }
  if (Array.isArray(ai.extraAdminEmails)) {
    sanitized.extraAdminEmails = Array.from(
      new Set(
        ai.extraAdminEmails
          .map((v) => String(v || '').trim().toLowerCase())
          .filter((v) => v.includes('@'))
      )
    ).slice(0, 25);
  }
  if (ai.announcement) sanitized.announcement = sanitizeAnnouncement(ai.announcement);
  if (ai.sampleTemplate) sanitized.sampleTemplate = sanitizeSampleTemplate(ai.sampleTemplate);
  if (ai.poll) sanitized.poll = sanitizePoll(ai.poll);

  const tickets = source.tickets ? normalizeTicketsCollection(source.tickets) : undefined;
  return { aiSettings: sanitized, ...(tickets ? { tickets } : {}) };
}


