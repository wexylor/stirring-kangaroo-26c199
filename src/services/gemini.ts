import type { DossierData, Person } from '../types/notebook';
import type { AppLang } from '../utils/preferences';
import type { AnalysisResultPayload } from '../utils/semantics';
import type { AiModelPreset, ServerAiStatus } from '../utils/aiPolicy';
import type { AiKeyRouteMode, ServerKeyStatusSnapshot } from '../utils/aiKeyRouter';
import type {
  AdminSystemEvent,
  AiTelemetryRecord,
  AlertWebhookTriggers,
  AnnouncementTone,
  DailyDigestSummary,
  EndpointAggregateStats,
  FeatureEventKey,
  FeaturePoll,
  FeatureUsageCounters,
  FeedbackTicket,
  GlobalAnnouncement,
  SafeWebhookStatus,
  SampleContactTemplate,
} from '../utils/adminOps';
import { parseChatTranscript } from '../utils/chatParser';

export interface AdminOverviewSnapshot {
  appVersion: string;
  serverStartedAtMs: number;
  serverNowMs: number;
  geminiModel: string;
  rtdbStatus: {
    connected: boolean;
    latencyMs: number;
  };
  flags: {
    sharedAiEnabled: boolean;
    guestAiEnabled: boolean;
    readOnlyMode: boolean;
    keyRouteMode: AiKeyRouteMode;
    aiModelPreset: AiModelPreset;
  };
  keyStatus: ServerKeyStatusSnapshot;
  telemetry: {
    totalRequests: number;
    avgLatencyMs: number;
    totalTokens: number;
    advisorCacheHits: number;
    dossierCacheHits: number;
    dossierRebuildCount: number;
    tokensSavedEstimate: number;
    endpointStats: EndpointAggregateStats[];
    recentRequests: AiTelemetryRecord[];
    featureCounters: FeatureUsageCounters;
    dailyDigest: DailyDigestSummary;
  };
  announcement: GlobalAnnouncement;
  sampleTemplate: SampleContactTemplate;
  poll: FeaturePoll;
  tickets: FeedbackTicket[];
  webhook: SafeWebhookStatus;
  events: AdminSystemEvent[];
}

async function callServerAi<T>(
  endpoint: string,
  body: unknown,
  timeoutMs = 20000,
  idToken?: string | null
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as
      | (T & { errorCode?: string; error?: string })
      | null;

    if (!response.ok) {
      const code = data?.errorCode || `HTTP_${response.status}`;
      throw new Error(code);
    }

    if (!data) {
      throw new Error('EMPTY_AI_RESPONSE');
    }

    return data;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callAdminJson<T>(
  endpoint: string,
  idToken: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<T> {
  const response = await fetch(endpoint, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${idToken}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = (await response.json().catch(() => null)) as
    | (T & { ok?: boolean; errorCode?: string; error?: string })
    | null;

  if (!response.ok || !data?.ok) {
    throw new Error(data?.errorCode || data?.error || `HTTP_${response.status}`);
  }
  return data;
}

export async function fetchServerAiStatus(): Promise<ServerAiStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch('/api/ai/status', { signal: controller.signal });
    if (!res.ok) {
      return {
        sharedAiEnabled: true,
        guestAiEnabled: true,
        readOnlyMode: false,
        serverKeyConfigured: false,
        keyRouteMode: 'auto',
        aiModelPreset: 'balanced',
      };
    }
    const data = (await res.json()) as Partial<ServerAiStatus>;
    return {
      sharedAiEnabled:
        typeof data.sharedAiEnabled === 'boolean' ? data.sharedAiEnabled : true,
      guestAiEnabled:
        typeof data.guestAiEnabled === 'boolean' ? data.guestAiEnabled : true,
      readOnlyMode: Boolean(data.readOnlyMode),
      serverKeyConfigured: Boolean(data.serverKeyConfigured),
      keyRouteMode: data.keyRouteMode || 'auto',
      aiModelPreset: data.aiModelPreset || 'balanced',
      serverStartedAtMs: data.serverStartedAtMs,
      geminiModel: data.geminiModel,
      announcement: data.announcement,
      sampleTemplate: data.sampleTemplate,
      poll: data.poll,
    };
  } catch {
    return {
      sharedAiEnabled: true,
      guestAiEnabled: true,
      readOnlyMode: false,
      serverKeyConfigured: false,
      keyRouteMode: 'auto',
      aiModelPreset: 'balanced',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAdminOverview(idToken: string): Promise<AdminOverviewSnapshot> {
  return callAdminJson<AdminOverviewSnapshot>('/api/admin/overview', idToken, 'GET');
}

export async function updateAdminFlags(
  idToken: string,
  flags: {
    sharedAiEnabled?: boolean;
    guestAiEnabled?: boolean;
    readOnlyMode?: boolean;
    aiModelPreset?: AiModelPreset;
  }
): Promise<{
  geminiModel: string;
  flags: {
    sharedAiEnabled: boolean;
    guestAiEnabled: boolean;
    readOnlyMode: boolean;
    aiModelPreset: AiModelPreset;
  };
  rtdbSynced: boolean;
}> {
  return callAdminJson('/api/admin/flags', idToken, 'POST', flags);
}

export async function updateAdminAnnouncement(
  idToken: string,
  payload: { enabled: boolean; text: string; tone: AnnouncementTone }
): Promise<{ announcement: GlobalAnnouncement; rtdbSynced: boolean }> {
  return callAdminJson('/api/admin/announcement', idToken, 'POST', payload);
}

export async function updateAdminSampleTemplate(
  idToken: string,
  payload: SampleContactTemplate | { reset: true }
): Promise<{ sampleTemplate: SampleContactTemplate; rtdbSynced: boolean }> {
  return callAdminJson('/api/admin/sample-template', idToken, 'POST', payload);
}

export async function updateAdminPoll(
  idToken: string,
  payload: {
    enabled: boolean;
    question: string;
    options: Array<{ id: string; label: string; votes?: number }>;
    resetVotes?: boolean;
  }
): Promise<{ poll: FeaturePoll; rtdbSynced: boolean }> {
  return callAdminJson('/api/admin/poll', idToken, 'POST', payload);
}

export async function updateAdminTicket(
  idToken: string,
  payload: {
    id: string;
    action: 'resolve' | 'reopen' | 'delete';
    reply?: string;
    publishToBanner?: boolean;
  }
): Promise<{ tickets: FeedbackTicket[]; announcement?: GlobalAnnouncement }> {
  return callAdminJson('/api/admin/tickets/update', idToken, 'POST', payload);
}

export async function updateAdminWebhook(
  idToken: string,
  payload: {
    webhookUrl?: string;
    clearUrl?: boolean;
    triggers?: Partial<AlertWebhookTriggers>;
  }
): Promise<{ webhook: SafeWebhookStatus }> {
  return callAdminJson('/api/admin/webhook', idToken, 'POST', payload);
}

export async function testAdminWebhook(
  idToken: string,
  kind: 'test' | 'digest' = 'test'
): Promise<{ webhook: SafeWebhookStatus }> {
  return callAdminJson('/api/admin/webhook/test', idToken, 'POST', { kind });
}

export async function toggleAdminSharedAi(
  idToken: string,
  sharedAiEnabled: boolean
): Promise<{ ok: boolean; sharedAiEnabled: boolean }> {
  return callAdminJson('/api/ai/admin/toggle', idToken, 'POST', { sharedAiEnabled });
}

export async function fetchAdminServerKeyStatus(
  idToken: string
): Promise<ServerKeyStatusSnapshot> {
  return callAdminJson<ServerKeyStatusSnapshot>('/api/ai/admin/keys', idToken, 'GET');
}

export async function setAdminKeyRouteMode(
  idToken: string,
  routeMode: AiKeyRouteMode
): Promise<{
  serverKeyConfigured: boolean;
  rtdbSynced: boolean;
  status: ServerKeyStatusSnapshot;
}> {
  return callAdminJson('/api/ai/admin/key-route', idToken, 'POST', { routeMode });
}

export async function checkAdminServerKeys(idToken: string): Promise<{
  serverKeyConfigured: boolean;
  status: ServerKeyStatusSnapshot;
}> {
  return callAdminJson('/api/ai/admin/check-keys', idToken, 'POST');
}

export async function submitUserFeedback(
  payload: {
    type: 'bug' | 'idea';
    text: string;
    lang: AppLang;
    authorLabel: string;
    appVersion: string;
  },
  idToken?: string | null
): Promise<{ ticketId: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; ticketId?: string; error?: string } | null;
  if (!res.ok || !data?.ok || !data.ticketId) {
    throw new Error(data?.error || `HTTP_${res.status}`);
  }
  return { ticketId: data.ticketId };
}

export async function submitPollVote(payload: {
  pollId: string;
  optionId: string;
  voterKey: string;
}): Promise<{ alreadyVoted: boolean; poll: FeaturePoll }> {
  const res = await fetch('/api/poll/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => null)) as {
    ok?: boolean;
    alreadyVoted?: boolean;
    poll?: FeaturePoll;
    error?: string;
  } | null;
  if (!res.ok || !data?.ok || !data.poll) {
    throw new Error(data?.error || `HTTP_${res.status}`);
  }
  return { alreadyVoted: Boolean(data.alreadyVoted), poll: data.poll };
}

export function trackFeatureUsage(feature: FeatureEventKey): void {
  fetch('/api/telemetry/feature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature }),
    keepalive: true,
  }).catch(() => {});
}

export function notifyNewUserRegistration(idToken: string): void {
  fetch('/api/telemetry/new-user', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
    keepalive: true,
  }).catch(() => {});
}

export function formatGeminiFallbackReason(err: unknown, lang: AppLang = 'ru'): string {
  const msg = err instanceof Error ? err.message : String(err || '');
  if (lang === 'kk') {
    if (msg === 'LOCAL_ONLY_MODE') return 'Тек жергілікті режим таңдалған';
    if (msg === 'AI_DISABLED_BY_ADMIN')
      return 'Ортақ бұлтты AI әкімшімен уақытша өшірілген — талдау жергілікті орындалды';
    if (msg === 'GUEST_AI_DISABLED')
      return 'Қонақтар үшін бұлтты AI шектелген — талдау жергілікті орындалды';
    if (msg === 'NO_API_KEY')
      return 'Серверде Gemini кілті бапталмаған — талдау жергілікті орындалды';
    if (msg === 'API_KEY_INVALID' || msg === 'PERMISSION_DENIED')
      return 'Сервердегі Gemini кілтін тексеріңіз — талдау жергілікті орындалды';
    if (msg === 'UNAVAILABLE' || msg === 'RESOURCE_EXHAUSTED')
      return 'Gemini сервері уақытша жүктелген, талдау жергілікті орындалды';
    if (msg === 'OFFLINE') return 'Желі жоқ — талдау жергілікті орындалды';
    if (msg === 'TIMEOUT')
      return 'Gemini уақытында жауап бермеді, талдау жергілікті орындалды';
    if (msg.startsWith('HTTP_'))
      return `Gemini қате қайтарды (${msg.replace('HTTP_', '')}), талдау жергілікті орындалды`;
    return 'Gemini жауабы алынбады, талдау жергілікті орындалды';
  }
  if (lang === 'en') {
    if (msg === 'LOCAL_ONLY_MODE') return 'Local-only mode is active';
    if (msg === 'AI_DISABLED_BY_ADMIN')
      return 'Shared cloud AI is currently disabled by the admin — analyzed locally';
    if (msg === 'GUEST_AI_DISABLED')
      return 'Cloud AI is disabled for guest sessions — sign in or use local analyzer';
    if (msg === 'NO_API_KEY')
      return 'Server Gemini key is not configured — analyzed locally';
    if (msg === 'API_KEY_INVALID' || msg === 'PERMISSION_DENIED')
      return 'Server Gemini key error — analyzed locally';
    if (msg === 'UNAVAILABLE' || msg === 'RESOURCE_EXHAUSTED')
      return 'Gemini is temporarily busy — analyzed locally';
    if (msg === 'OFFLINE') return 'Offline — analyzed locally';
    if (msg === 'TIMEOUT') return 'Gemini timed out — analyzed locally';
    if (msg.startsWith('HTTP_'))
      return `Gemini returned error (${msg.replace('HTTP_', '')}) — analyzed locally`;
    return 'Could not reach Gemini — analyzed locally';
  }
  if (msg === 'LOCAL_ONLY_MODE') {
    return 'Выбран режим «Только локально»';
  }
  if (msg === 'AI_DISABLED_BY_ADMIN') {
    return 'Общий облачный ИИ временно отключён администратором — выполнен локальный разбор';
  }
  if (msg === 'GUEST_AI_DISABLED') {
    return 'Облачный ИИ ограничен для гостевого режима — войдите в аккаунт или используйте локальный разбор';
  }
  if (msg === 'NO_API_KEY') {
    return 'Серверный ключ Gemini не настроен — разбор выполнен локально';
  }
  if (msg === 'API_KEY_INVALID' || msg === 'PERMISSION_DENIED') {
    return 'Ошибка серверного ключа Gemini — выполнен локальный разбор';
  }
  if (msg === 'UNAVAILABLE' || msg === 'RESOURCE_EXHAUSTED') {
    return 'Сервер Gemini временно перегружен, выполнен локальный разбор';
  }
  if (msg === 'OFFLINE') {
    return 'Нет сети — разбор выполнен локально';
  }
  if (msg === 'TIMEOUT') {
    return 'Gemini не ответил вовремя, разбор выполнен локально';
  }
  if (msg.startsWith('HTTP_')) {
    return `Gemini вернул ошибку (${msg.replace('HTTP_', '')}), разбор выполнен локально`;
  }
  return 'Не удалось получить ответ от Gemini, разбор выполнен локально';
}

export async function analyzeTextWithGemini(
  person: Person,
  rawText: string,
  allPeople: Person[],
  idToken?: string | null
): Promise<AnalysisResultPayload> {
  const existingCols = person.columns.map((c) => ({
    columnTitle: c.title,
    existingFacts: c.facts.map((f) => f.text),
  }));

  const otherPeopleNames = allPeople
    .filter((p) => p.id !== person.id)
    .map((p) => p.name);

  const chatParsed = parseChatTranscript(rawText, person.name);
  const textToAnalyze =
    chatParsed.isChat && chatParsed.cleanedText ? chatParsed.cleanedText : rawText;

  return callServerAi<AnalysisResultPayload>(
    '/api/ai/analyze',
    {
      personName: person.name,
      personSubtitle: person.subtitle || '',
      existingCols,
      otherPeopleNames,
      rawText: textToAnalyze,
    },
    20000,
    idToken
  );
}

export async function askAdvisorWithGemini(
  person: Person,
  question: string,
  lang: AppLang = 'ru',
  idToken?: string | null
): Promise<string> {
  const serialized = {
    name: person.name,
    subtitle: person.subtitle,
    updatedAt: person.updatedAt,
    columns: person.columns.map((c) => ({
      category: c.title,
      facts: c.facts.map((f) => f.text + (f.reason ? ` (${f.reason})` : '')),
    })),
  };

  const res = await callServerAi<{ answer: string }>(
    '/api/ai/advisor',
    { person: serialized, question, lang },
    16000,
    idToken
  );
  return res.answer || 'Не удалось сформировать ответ.';
}

export async function buildDossierWithGemini(
  mode: 'single' | 'all',
  activePerson: Person | null,
  allPeople: Person[],
  lang: AppLang = 'ru',
  idToken?: string | null
): Promise<DossierData> {
  const targets = mode === 'all' ? allPeople : activePerson ? [activePerson] : [];

  const serialized = targets.map((p) => ({
    name: p.name,
    subtitle: p.subtitle,
    columns: p.columns.map((c) => ({
      category: c.title,
      facts: c.facts.map(
        (f) =>
          f.text +
          (f.tag === 'ai_inference'
            ? ' [вывод ИИ]'
            : f.tag === 'updated'
            ? ' [обновлено]'
            : '')
      ),
    })),
    recentNotes: p.rawNotes.slice(0, 5).map((n) => n.text),
  }));

  return callServerAi<DossierData>(
    '/api/ai/dossier',
    {
      mode,
      activePersonName: activePerson?.name || '',
      people: serialized,
      lang,
    },
    20000,
    idToken
  );
}
