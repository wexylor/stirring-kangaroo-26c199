import type { DossierData, Person } from '../types/notebook';
import type { AppLang } from '../utils/preferences';
import type { AnalysisResultPayload } from '../utils/semantics';
import { getEffectiveApiKey } from '../utils/storage';
import { parseChatTranscript } from '../utils/chatParser';

function cleanAndParseJson<T>(rawText: string): T {
  const cleaned = String(rawText)
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

async function callGeminiWithSchema<T>(payload: unknown, timeoutMs = 18000): Promise<T> {
  const activeKey = getEffectiveApiKey();
  if (!activeKey) {
    throw new Error('NO_API_KEY');
  }
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
    encodeURIComponent(activeKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('EMPTY_AI_RESPONSE');
    }
    return cleanAndParseJson<T>(text);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function formatGeminiFallbackReason(err: unknown, lang: AppLang = 'ru'): string {
  const msg = err instanceof Error ? err.message : String(err || '');
  if (lang === 'kk') {
    if (msg === 'NO_API_KEY') return 'Gemini API кілті көрсетілмеген — талдау жергілікті орындалды';
    if (msg === 'OFFLINE') return 'Желі жоқ — талдау жергілікті орындалды';
    if (msg === 'TIMEOUT') return 'Gemini уақытында жауап бермеді, талдау жергілікті орындалды';
    if (msg.startsWith('HTTP_')) return `Gemini қате қайтарды (${msg.replace('HTTP_', '')}), талдау жергілікті орындалды`;
    return 'Gemini жауабы алынбады, талдау жергілікті орындалды';
  }
  if (lang === 'en') {
    if (msg === 'NO_API_KEY') return 'No Gemini API key set — analyzed locally';
    if (msg === 'OFFLINE') return 'Offline — analyzed locally';
    if (msg === 'TIMEOUT') return 'Gemini timed out — analyzed locally';
    if (msg.startsWith('HTTP_')) return `Gemini returned error (${msg.replace('HTTP_', '')}) — analyzed locally`;
    return 'Could not reach Gemini — analyzed locally';
  }
  if (msg === 'NO_API_KEY') {
    return 'API-ключ Gemini не указан — разбор выполнен локально';
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

  const systemPrompt =
    `Ты — элитный когнитивный аналитик персонального блокнота о людях. Проанализируй заметку о человеке по имени "${person.name}". Заметка может быть на русском, казахском или английском языке.\n` +
    `Текущий подзаголовок профиля: "${person.subtitle || ''}"\n` +
    `Другие люди в блокноте: ${JSON.stringify(otherPeopleNames)}\n` +
    `Текущие колонки и ВСЕ уже известные факты:\n${JSON.stringify(existingCols, null, 2)}\n\n` +
    `Выполни 6 задач строго по правилам:\n` +
    `1. ЖЁСТКАЯ ЗАЩИТА ОТ ДУБЛИКАТОВ И СИНОНИМОВ: Никогда не возвращай факт, если аналогичная по смыслу информация УЖЕ присутствует в ЛЮБОЙ колонке existingCols — даже если она выражена синонимами или перефразирована (например: «любит / обожает / в восторге от / предпочитает / без ума от / увлекается», «не любит / ненавидит / терпеть не может / раздражает / бесит / на дух не переносит», «хочет / мечтает», «животное / питомец / кот», а также казахские и английские аналоги). Если в новом тексте нет ничего нового по сравнению с existingCols — верни пустой массив updates: [].\n` +
    `2. АТОМАРНАЯ ДИСТИЛЛЯЦИЯ: Очищай текст от разговорного мусора («оказывается», «мы болтали», «призналась, что», переписочных приветствий и флуда). Разбивай сложные предложения на короткие, лаконичные, самодостаточные факты без местоимений в начале (например: «Отказалась от кофе», «Пьёт японскую матчу на овсяном молоке», «Аллергия на арахис и мёд»). Не создавай бессмысленных обрывков без контекста.\n` +
    `3. КАТЕГОРИЗАЦИЯ И НОВЫЕ КОЛОНКИ: Распределяй факты по существующим колонкам (используй точное columnTitle и isNewColumn: false) или создавай новые лаконичные колонки (isNewColumn: true) с подходящим эмодзи icon. Оценивай смысл, а не только точные слова: выражения вроде «обожает», «тащится от», «без ума от», «ұнатады», «adores» относятся к «Нравится» или профильной категории, а «бесит», «раздражает», «на дух не переносит», «жек көреді», «can't stand» — к «Не нравится».\n` +
    `4. НЕЯВНЫЕ ВЫВОДЫ С ОБОСНОВАНИЕМ (tag: "ai_inference"): Делай умные логические выводы (если их ещё нет в existingCols!) и в поле reason кратко пиши основание.\n` +
    `5. ОБНОВЛЕНИЕ И ОБОГАЩЕНИЕ (tag: "updated"): Если новый факт отменяет старый (в том числе через синоним-антоним: было «обожает кофе» -> стало «терпеть не может кофе» / «отказалась от кофе») или уточняет краткий старый факт, ставь tag: "updated", в replacesOldFact укажи точный текст старого факта из existingCols, а в reason — причину обновления.\n` +
    `6. КРОСС-СВЯЗИ И ПРОФИЛЬ: Если упоминается человек из otherPeopleNames — добавь связь в «Семья и окружение». Если раскрыта профессия, а текущий подзаголовок пустой/шаблонный — верни её в suggestedSubtitle.`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nНовый текст для анализа:\n${textToAnalyze}` }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          summary: { type: 'STRING' },
          suggestedSubtitle: { type: 'STRING' },
          updates: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                columnTitle: { type: 'STRING' },
                isNewColumn: { type: 'BOOLEAN' },
                icon: { type: 'STRING' },
                facts: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      text: { type: 'STRING' },
                      tag: { type: 'STRING' },
                      reason: { type: 'STRING' },
                      replacesOldFact: { type: 'STRING' },
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
  };

  return callGeminiWithSchema<AnalysisResultPayload>(payload, 18000);
}

function getLanguageInstruction(lang: AppLang): string {
  if (lang === 'kk') return 'Отвечай строго на казахском языке (қазақ тілінде).';
  if (lang === 'en') return 'Respond strictly in English.';
  return 'Отвечай на русском языке.';
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

  const prompt =
    `Ты — умный личный ассистент по отношениям и общению. У тебя есть полное досье на человека:\n` +
    `${JSON.stringify(serialized, null, 2)}\n\n` +
    `Ответь конкретно, практично и с опорой на факты из досье на вопрос пользователя:\n«${question}»\n\n` +
    `Если в досье есть аллергии, табу или особые привычки — обязательно учти их. Ответ оформи кратко по пунктам (3-5 строк). ${getLanguageInstruction(lang)}`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          answer: { type: 'STRING' },
        },
        required: ['answer'],
      },
    },
  };

  const res = await callGeminiWithSchema<{ answer: string }>(payload, 14000);
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

  const prompt =
    mode === 'all'
      ? `Ты — аналитик социальных связей. Проанализируй базу всех людей из персонального блокнота:\n${JSON.stringify(serialized, null, 2)}\n\n` +
        `Сформируй структурированную сводку (${getLanguageInstruction(lang)}) по 6 полям:\n` +
        `- block1Title: "1. Обзор базы и статистика" (переведи заголовок на целевой язык), block1Text: краткая сводка по людям и количеству фактов\n` +
        `- block2Title: "2. Общие интересы между людьми" (переведи заголовок), block2Text: какие люди в блокноте имеют общие увлечения, вкусы или цели\n` +
        `- block3Title: "3. Идеи совместных встреч и активностей" (переведи заголовок), block3Text: куда и кого можно позвать вместе на основе пересечений\n` +
        `- block4Title: "4. Важные ограничения и табу по базе" (переведи заголовок), block4Text: ключевые табу, аллергии и особенности\n` +
        `- block5Title: "5. Краткие карточки людей" (переведи заголовок), block5Text: по 1-2 предложения о каждом человеке\n` +
        `- block6Title: "6. Рекомендации по развитию связей" (переведи заголовок), block6Text: кого давно пора позвать на встречу или поздравить`
      : `Ты — глубокий психолог-аналитик и ассистент по отношениям. Составь полное ИИ-досье на человека по имени "${activePerson ? activePerson.name : ''}":\n${JSON.stringify(serialized, null, 2)}\n\n` +
        `Сформируй глубокий разбор (${getLanguageInstruction(lang)}) строго по 6 блокам:\n` +
        `- block1Title: "1. Краткий психологический портрет" (переведи заголовок на целевой язык), block1Text: суть человека, его темперамент, ценности и стиль жизни в 2-3 ёмких предложениях\n` +
        `- block2Title: "2. Точки контакта" (переведи заголовок), block2Text: о чём лучше всего поговорить и чем искренне порадовать при встрече\n` +
        `- block3Title: "3. Табу, аллергии и триггеры" (переведи заголовок), block3Text: чего категорически стоит избегать\n` +
        `- block4Title: "4. Персонализированные идеи подарков и сюрпризов" (переведи заголовок), block4Text: конкретные идеи с объяснением, на основе каких фактов сделан вывод\n` +
        `- block5Title: "5. Что ещё стоит узнать" (переведи заголовок), block5Text: 3-4 деликатных вопроса для следующей встречи\n` +
        `- block6Title: "6. Готовые заходы и сценарии встречи" (переведи заголовок), block6Text: 2-3 готовых сообщения/приглашения`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          reportTitle: { type: 'STRING' },
          block1Title: { type: 'STRING' },
          block1Text: { type: 'STRING' },
          block2Title: { type: 'STRING' },
          block2Text: { type: 'STRING' },
          block3Title: { type: 'STRING' },
          block3Text: { type: 'STRING' },
          block4Title: { type: 'STRING' },
          block4Text: { type: 'STRING' },
          block5Title: { type: 'STRING' },
          block5Text: { type: 'STRING' },
          block6Title: { type: 'STRING' },
          block6Text: { type: 'STRING' },
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
  };

  return callGeminiWithSchema<DossierData>(payload, 18000);
}
