import type { DossierData, Person } from '../types/notebook';
import type { AppLang } from '../utils/preferences';
import type { AnalysisResultPayload } from '../utils/semantics';
import type { ServerAiStatus } from '../utils/aiPolicy';
import { parseChatTranscript } from '../utils/chatParser';

async function callServerAi<T>(
  endpoint: string,
  body: unknown,
  timeoutMs = 20000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

export async function fetchServerAiStatus(): Promise<ServerAiStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch('/api/ai/status', { signal: controller.signal });
    if (!res.ok) {
      return { sharedAiEnabled: true, serverKeyConfigured: false };
    }
    const data = (await res.json()) as Partial<ServerAiStatus>;
    return {
      sharedAiEnabled:
        typeof data.sharedAiEnabled === 'boolean' ? data.sharedAiEnabled : true,
      serverKeyConfigured: Boolean(data.serverKeyConfigured),
    };
  } catch {
    return { sharedAiEnabled: true, serverKeyConfigured: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function toggleAdminSharedAi(
  idToken: string,
  sharedAiEnabled: boolean
): Promise<{ ok: boolean; sharedAiEnabled: boolean }> {
  const response = await fetch('/api/ai/admin/toggle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ sharedAiEnabled }),
  });
  const data = (await response.json().catch(() => null)) as {
    ok?: boolean;
    sharedAiEnabled?: boolean;
    errorCode?: string;
    error?: string;
  } | null;

  if (!response.ok || !data?.ok) {
    throw new Error(data?.errorCode || data?.error || `HTTP_${response.status}`);
  }
  return {
    ok: true,
    sharedAiEnabled: Boolean(data.sharedAiEnabled),
  };
}

export function formatGeminiFallbackReason(err: unknown, lang: AppLang = 'ru'): string {
  const msg = err instanceof Error ? err.message : String(err || '');
  if (lang === 'kk') {
    if (msg === 'LOCAL_ONLY_MODE') return 'Тек жергілікті режим таңдалған';
    if (msg === 'AI_DISABLED_BY_ADMIN')
      return 'Ортақ бұлтты AI әкімшімен уақытша өшірілген — талдау жергілікті орындалды';
    if (msg === 'NO_API_KEY')
      return 'Серверде Gemini кілті бапталмаған — талдау жергілікті орындалды';
    if (msg === 'API_KEY_INVALID' || msg === 'PERMISSION_DENIED')
      return 'Settings > Secrets ішіндегі Gemini кілтін тексеріңіз — талдау жергілікті орындалды';
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
    if (msg === 'NO_API_KEY')
      return 'Server Gemini key is not configured — analyzed locally';
    if (msg === 'API_KEY_INVALID' || msg === 'PERMISSION_DENIED')
      return 'Please check your Gemini key in Settings > Secrets — analyzed locally';
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
  if (msg === 'NO_API_KEY') {
    return 'Серверный ключ Gemini не настроен — разбор выполнен локально';
  }
  if (msg === 'API_KEY_INVALID' || msg === 'PERMISSION_DENIED') {
    return 'Проверьте ключ Gemini в Settings > Secrets — выполнен локальный разбор';
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
  allPeople: Person[]
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
    20000
  );
}

export async function askAdvisorWithGemini(
  person: Person,
  question: string,
  lang: AppLang = 'ru'
): Promise<string> {
  const serialized = {
    name: person.name,
    subtitle: person.subtitle,
    columns: person.columns.map((c) => ({
      category: c.title,
      facts: c.facts.map((f) => f.text + (f.reason ? ` (${f.reason})` : '')),
    })),
  };

  const res = await callServerAi<{ answer: string }>(
    '/api/ai/advisor',
    { person: serialized, question, lang },
    16000
  );
  return res.answer || 'Не удалось сформировать ответ.';
}

export async function buildDossierWithGemini(
  mode: 'single' | 'all',
  activePerson: Person | null,
  allPeople: Person[],
  lang: AppLang = 'ru'
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
    20000
  );
}
