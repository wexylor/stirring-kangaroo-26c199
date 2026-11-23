import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { createServer as createHttpServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type, type GenerateContentParameters } from '@google/genai';
import { ADMIN_UID as DEFAULT_ADMIN_UID, classifyGeminiError } from './src/utils/aiPolicy.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveListenPort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const parsed = Number(process.argv[portArgIdx + 1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const envPort = Number(process.env.PORT);
  if (Number.isFinite(envPort) && envPort > 0) {
    if (process.env.NGINX_PORT && Number(process.env.NGINX_PORT) === envPort) {
      return Number(process.env.DEFAULT_APP_PORT) || 3000;
    }
    return envPort;
  }
  return Number(process.env.DEFAULT_APP_PORT) || 3000;
}

const PORT = resolveListenPort();
const ADMIN_UID = (process.env.ADMIN_UID || DEFAULT_ADMIN_UID).trim();
const GEMINI_MODEL = 'gemini-4-hydrogen';

const FIREBASE_RTDB_URL =
  'https://friends-37e97-default-rtdb.europe-west1.firebasedatabase.app';
const FIREBASE_WEB_API_KEY =
  process.env.FIREBASE_WEB_API_KEY || 'AIzaSyCZzb83vFUDEruoR4KMFBG-7CVnyBwkRDc';

interface SharedAiState {
  sharedAiEnabled: boolean;
  updatedAt: string;
  persistedToRtdb: boolean;
}

let memoryOverride: SharedAiState | null = null;
let rtdbCache: { value: boolean; fetchedAt: number } | null = null;

function getServerGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function fetchRtdbSharedAiEnabled(): Promise<boolean | null> {
  const now = Date.now();
  if (rtdbCache && now - rtdbCache.fetchedAt < 4000) {
    return rtdbCache.value;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/appConfig/aiSettings.json`, {
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { sharedAiEnabled?: unknown } | null;
    if (data && typeof data.sharedAiEnabled === 'boolean') {
      rtdbCache = { value: data.sharedAiEnabled, fetchedAt: now };
      return data.sharedAiEnabled;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getEffectiveSharedAiStatus(): Promise<{
  sharedAiEnabled: boolean;
  serverKeyConfigured: boolean;
}> {
  const serverKeyConfigured = Boolean((process.env.GEMINI_API_KEY || '').trim());
  const rtdbVal = await fetchRtdbSharedAiEnabled();
  if (typeof rtdbVal === 'boolean') {
    if (
      memoryOverride &&
      (!memoryOverride.persistedToRtdb ||
        Date.now() - Date.parse(memoryOverride.updatedAt) < 10000)
    ) {
      return {
        sharedAiEnabled: memoryOverride.sharedAiEnabled,
        serverKeyConfigured,
      };
    }
    return {
      sharedAiEnabled: rtdbVal,
      serverKeyConfigured,
    };
  }
  return {
    sharedAiEnabled: memoryOverride ? memoryOverride.sharedAiEnabled : true,
    serverKeyConfigured,
  };
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: GenerateContentParameters,
  maxAttempts = 2
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err || '');
      const info = classifyGeminiError(msg);
      if (!info.retryable || attempt >= maxAttempts) {
        throw err;
      }
      await waitMs(550 * attempt);
    }
  }
  throw lastError;
}

async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email?: string } | null> {
  if (!idToken) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
        FIREBASE_WEB_API_KEY
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: controller.signal,
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      users?: Array<{ localId?: string; email?: string }>;
    };
    const user = data?.users?.[0];
    if (!user?.localId) return null;
    return { uid: user.localId, email: user.email };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function cleanAndParseJson<T>(rawText: string): T {
  const cleaned = String(rawText || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

function getLanguageInstruction(lang: string): string {
  if (lang === 'kk') return 'Отвечай строго на казахском языке (қазақ тілінде).';
  if (lang === 'en') return 'Respond strictly in English.';
  return 'Отвечай на русском языке.';
}

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/api/ai/status', async (_req: Request, res: Response) => {
    const status = await getEffectiveSharedAiStatus();
    res.json({
      ok: true,
      sharedAiEnabled: status.sharedAiEnabled,
      serverKeyConfigured: status.serverKeyConfigured,
    });
  });

  app.post('/api/ai/admin/toggle', async (req: Request, res: Response) => {
    const authHeader = String(req.headers.authorization || '');
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      res.status(401).json({ errorCode: 'UNAUTHORIZED', error: 'Missing auth token' });
      return;
    }

    const verified = await verifyFirebaseIdToken(token);
    if (!verified || verified.uid !== ADMIN_UID) {
      res.status(403).json({ errorCode: 'FORBIDDEN', error: 'Admin access required' });
      return;
    }

    const body = req.body as { sharedAiEnabled?: unknown } | undefined;
    if (!body || typeof body.sharedAiEnabled !== 'boolean') {
      res.status(400).json({ errorCode: 'BAD_REQUEST', error: 'sharedAiEnabled boolean required' });
      return;
    }

    const nowIso = new Date().toISOString();
    let rtdbSynced = false;
    try {
      const rtdbRes = await fetch(
        `${FIREBASE_RTDB_URL}/appConfig/aiSettings.json?auth=${encodeURIComponent(token)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sharedAiEnabled: body.sharedAiEnabled,
            updatedAt: nowIso,
            updatedBy: verified.uid,
          }),
        }
      );
      rtdbSynced = rtdbRes.ok;
    } catch {
      rtdbSynced = false;
    }

    memoryOverride = {
      sharedAiEnabled: body.sharedAiEnabled,
      updatedAt: nowIso,
      persistedToRtdb: rtdbSynced,
    };
    rtdbCache = {
      value: body.sharedAiEnabled,
      fetchedAt: Date.now(),
    };

    res.json({
      ok: true,
      sharedAiEnabled: body.sharedAiEnabled,
      rtdbSynced,
      updatedAt: nowIso,
    });
  });

  app.post('/api/ai/analyze', async (req: Request, res: Response) => {
    const status = await getEffectiveSharedAiStatus();
    if (!status.sharedAiEnabled) {
      res.status(503).json({
        errorCode: 'AI_DISABLED_BY_ADMIN',
        error: 'Cloud AI is currently disabled by the administrator.',
      });
      return;
    }

    const ai = getServerGeminiClient();
    if (!ai) {
      res.status(503).json({
        errorCode: 'NO_API_KEY',
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    const body = req.body as {
      personName?: string;
      personSubtitle?: string;
      existingCols?: Array<{ columnTitle: string; existingFacts: string[] }>;
      otherPeopleNames?: string[];
      rawText?: string;
    };

    const rawText = String(body?.rawText || '').trim();
    if (!rawText) {
      res.status(400).json({ errorCode: 'BAD_REQUEST', error: 'rawText is required' });
      return;
    }

    const personName = String(body?.personName || '').trim() || 'Контакт';
    const personSubtitle = String(body?.personSubtitle || '').trim();
    const existingCols = Array.isArray(body?.existingCols) ? body.existingCols : [];
    const otherPeopleNames = Array.isArray(body?.otherPeopleNames)
      ? body.otherPeopleNames
      : [];

    const systemPrompt =
      `Ты — элитный когнитивный аналитик персонального блокнота о людях. Проанализируй заметку о человеке по имени "${personName}". Заметка может быть на русском, казахском или английском языке.\n` +
      `Текущий подзаголовок профиля: "${personSubtitle}"\n` +
      `Другие люди в блокноте: ${JSON.stringify(otherPeopleNames)}\n` +
      `Текущие колонки и ВСЕ уже известные факты:\n${JSON.stringify(existingCols, null, 2)}\n\n` +
      `Выполни 6 задач строго по правилам:\n` +
      `1. ЖЁСТКАЯ ЗАЩИТА ОТ ДУБЛИКАТОВ И СИНОНИМОВ: Никогда не возвращай факт, если аналогичная по смыслу информация УЖЕ присутствует в ЛЮБОЙ колонке existingCols — даже если она выражена синонимами или перефразирована (например: «любит / обожает / в восторге от / предпочитает / без ума от / увлекается», «не любит / ненавидит / терпеть не может / раздражает / бесит / на дух не переносит», «хочет / мечтает», «животное / питомец / кот», а также казахские и английские аналоги). Если в новом тексте нет ничего нового по сравнению с existingCols — верни пустой массив updates: [].\n` +
      `2. АТОМАРНАЯ ДИСТИЛЛЯЦИЯ: Очищай текст от разговорного мусора («оказывается», «мы болтали», «призналась, что», переписочных приветствий и флуда). Разбивай сложные предложения на короткие, лаконичные, самодостаточные факты без местоимений в начале (например: «Отказалась от кофе», «Пьёт японскую матчу на овсяном молоке», «Аллергия на арахис и мёд»). Не создавай бессмысленных обрывков без контекста.\n` +
      `3. КАТЕГОРИЗАЦИЯ И НОВЫЕ КОЛОНКИ: Распределяй факты по существующим колонкам (используй точное columnTitle и isNewColumn: false) или создавай новые лаконичные колонки (isNewColumn: true) с подходящим эмодзи icon. Оценивай смысл, а не только точные слова: выражения вроде «обожает», «тащится от», «без ума от», «ұнатады», «adores» относятся к «Нравится» или профильной категории, а «бесит», «раздражает», «на дух не переносит», «жек көреді», «can't stand» — к «Не нравится».\n` +
      `4. НЕЯВНЫЕ ВЫВОДЫ С ОБОСНОВАНИЕМ (tag: "ai_inference"): Делай умные логические выводы (если их ещё нет в existingCols!) и в поле reason кратко пиши основание.\n` +
      `5. ОБНОВЛЕНИЕ И ОБОГАЩЕНИЕ (tag: "updated"): Если новый факт отменяет старый (в том числе через синоним-антоним: было «обожает кофе» -> стало «терпеть не может кофе» / «отказалась от кофе») или уточняет краткий старый факт, ставь tag: "updated", в replacesOldFact укажи точный текст старого факта из existingCols, а в reason — причину обновления.\n` +
      `6. КРОСС-СВЯЗИ И ПРОФИЛЬ: Если упоминается человек из otherPeopleNames — добавь связь в «Семья и окружение». Если раскрыта профессия, а текущий подзаголовок пустой/шаблонный — верни её в suggestedSubtitle.`;

    try {
      const response = await generateContentWithRetry(ai, {
        model: GEMINI_MODEL,
        contents: `${systemPrompt}\n\nНовый текст для анализа:\n${rawText}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              suggestedSubtitle: { type: Type.STRING },
              updates: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    columnTitle: { type: Type.STRING },
                    isNewColumn: { type: Type.BOOLEAN },
                    icon: { type: Type.STRING },
                    facts: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          text: { type: Type.STRING },
                          tag: { type: Type.STRING },
                          reason: { type: Type.STRING },
                          replacesOldFact: { type: Type.STRING },
                        },
                        required: ['text', 'tag'],
                      },
                    },
                  },
                  required: ['columnTitle', 'isNewColumn', 'icon', 'facts'],
                },
              },
            },
            required: ['summary', 'updates'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        res.status(502).json({ errorCode: 'EMPTY_AI_RESPONSE', error: 'Empty model response' });
        return;
      }
      res.json(cleanAndParseJson(text));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upstream Gemini error';
      const classified = classifyGeminiError(message);
      res.status(classified.httpStatus).json({ errorCode: classified.errorCode, error: message });
    }
  });

  app.post('/api/ai/advisor', async (req: Request, res: Response) => {
    const status = await getEffectiveSharedAiStatus();
    if (!status.sharedAiEnabled) {
      res.status(503).json({
        errorCode: 'AI_DISABLED_BY_ADMIN',
        error: 'Cloud AI is currently disabled by the administrator.',
      });
      return;
    }

    const ai = getServerGeminiClient();
    if (!ai) {
      res.status(503).json({
        errorCode: 'NO_API_KEY',
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    const body = req.body as {
      person?: unknown;
      question?: string;
      lang?: string;
    };
    const question = String(body?.question || '').trim();
    if (!question || !body?.person) {
      res.status(400).json({ errorCode: 'BAD_REQUEST', error: 'person and question required' });
      return;
    }

    const lang = String(body?.lang || 'ru');
    const prompt =
      `Ты — умный личный ассистент по отношениям и общению. У тебя есть полное досье на человека:\n` +
      `${JSON.stringify(body.person, null, 2)}\n\n` +
      `Ответь конкретно, практично и с опорой на факты из досье на вопрос пользователя:\n«${question}»\n\n` +
      `Если в досье есть аллергии, табу или особые привычки — обязательно учти их. Ответ оформи кратко по пунктам (3-5 строк). ${getLanguageInstruction(
        lang
      )}`;

    try {
      const response = await generateContentWithRetry(ai, {
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: { type: Type.STRING },
            },
            required: ['answer'],
          },
        },
      });
      const text = response.text;
      if (!text) {
        res.status(502).json({ errorCode: 'EMPTY_AI_RESPONSE', error: 'Empty model response' });
        return;
      }
      res.json(cleanAndParseJson(text));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upstream Gemini error';
      const classified = classifyGeminiError(message);
      res.status(classified.httpStatus).json({ errorCode: classified.errorCode, error: message });
    }
  });

  app.post('/api/ai/dossier', async (req: Request, res: Response) => {
    const status = await getEffectiveSharedAiStatus();
    if (!status.sharedAiEnabled) {
      res.status(503).json({
        errorCode: 'AI_DISABLED_BY_ADMIN',
        error: 'Cloud AI is currently disabled by the administrator.',
      });
      return;
    }

    const ai = getServerGeminiClient();
    if (!ai) {
      res.status(503).json({
        errorCode: 'NO_API_KEY',
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    const body = req.body as {
      mode?: 'single' | 'all';
      activePersonName?: string;
      people?: unknown[];
      lang?: string;
    };

    const mode = body?.mode === 'all' ? 'all' : 'single';
    const lang = String(body?.lang || 'ru');
    const serialized = Array.isArray(body?.people) ? body.people : [];
    const activeName = String(body?.activePersonName || '');

    const prompt =
      mode === 'all'
        ? `Ты — аналитик социальных связей. Проанализируй базу всех людей из персонального блокнота:\n${JSON.stringify(
            serialized,
            null,
            2
          )}\n\n` +
          `Сформируй структурированную сводку (${getLanguageInstruction(lang)}) по 6 полям:\n` +
          `- block1Title: "1. Обзор базы и статистика" (переведи заголовок на целевой язык), block1Text: краткая сводка по людям и количеству фактов\n` +
          `- block2Title: "2. Общие интересы между людьми" (переведи заголовок), block2Text: какие люди в блокноте имеют общие увлечения, вкусы или цели\n` +
          `- block3Title: "3. Идеи совместных встреч и активностей" (переведи заголовок), block3Text: куда и кого можно позвать вместе на основе пересечений\n` +
          `- block4Title: "4. Важные ограничения и табу по базе" (переведи заголовок), block4Text: ключевые табу, аллергии и особенности\n` +
          `- block5Title: "5. Краткие карточки людей" (переведи заголовок), block5Text: по 1-2 предложения о каждом человеке\n` +
          `- block6Title: "6. Рекомендации по развитию связей" (переведи заголовок), block6Text: кого давно пора позвать на встречу или поздравить`
        : `Ты — глубокий психолог-аналитик и ассистент по отношениям. Составь полное ИИ-досье на человека по имени "${activeName}":\n${JSON.stringify(
            serialized,
            null,
            2
          )}\n\n` +
          `Сформируй глубокий разбор (${getLanguageInstruction(lang)}) строго по 6 блокам:\n` +
          `- block1Title: "1. Краткий психологический портрет" (переведи заголовок на целевой язык), block1Text: суть человека, его темперамент, ценности и стиль жизни в 2-3 ёмких предложениях\n` +
          `- block2Title: "2. Точки контакта" (переведи заголовок), block2Text: о чём лучше всего поговорить и чем искренне порадовать при встрече\n` +
          `- block3Title: "3. Табу, аллергии и триггеры" (переведи заголовок), block3Text: чего категорически стоит избегать\n` +
          `- block4Title: "4. Персонализированные идеи подарков и сюрпризов" (переведи заголовок), block4Text: конкретные идеи с объяснением, на основе каких фактов сделан вывод\n` +
          `- block5Title: "5. Что ещё стоит узнать" (переведи заголовок), block5Text: 3-4 деликатных вопроса для следующей встречи\n` +
          `- block6Title: "6. Готовые заходы и сценарии встречи" (переведи заголовок), block6Text: 2-3 готовых сообщения/приглашения`;

    try {
      const response = await generateContentWithRetry(ai, {
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reportTitle: { type: Type.STRING },
              block1Title: { type: Type.STRING },
              block1Text: { type: Type.STRING },
              block2Title: { type: Type.STRING },
              block2Text: { type: Type.STRING },
              block3Title: { type: Type.STRING },
              block3Text: { type: Type.STRING },
              block4Title: { type: Type.STRING },
              block4Text: { type: Type.STRING },
              block5Title: { type: Type.STRING },
              block5Text: { type: Type.STRING },
              block6Title: { type: Type.STRING },
              block6Text: { type: Type.STRING },
            },
            required: [
              'reportTitle',
              'block1Title',
              'block1Text',
              'block2Title',
              'block2Text',
              'block3Title',
              'block3Text',
              'block4Title',
              'block4Text',
              'block5Title',
              'block5Text',
              'block6Title',
              'block6Text',
            ],
          },
        },
      });
      const text = response.text;
      if (!text) {
        res.status(502).json({ errorCode: 'EMPTY_AI_RESPONSE', error: 'Empty model response' });
        return;
      }
      res.json(cleanAndParseJson(text));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upstream Gemini error';
      const classified = classifyGeminiError(message);
      res.status(classified.httpStatus).json({ errorCode: classified.errorCode, error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
