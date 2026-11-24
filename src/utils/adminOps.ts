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

export type AiEndpointName = 'analyze' | 'advisor' | 'dossier';

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

export interface FeedbackTicket {
  id: string;
  type: 'bug' | 'idea';
  text: string;
  authorLabel: string;
  isGuest: boolean;
  lang: string;
  appVersion: string;
  status: 'open' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  adminReply?: string;
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
  const endpoints: AiEndpointName[] = ['analyze', 'advisor', 'dossier'];
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
