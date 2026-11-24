import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdvisorCacheKey,
  buildDossierCacheKey,
  computeEndpointStats,
  isTrafficSpike,
  maskWebhookUrl,
  sanitizeAnnouncement,
  sanitizePoll,
  sanitizeSampleTemplate,
  validateSafeWebhookUrl,
} from './adminOps.ts';

test('buildAdvisorCacheKey normalizes question casing/whitespace and invalidates on profile updates', () => {
  const k1 = buildAdvisorCacheKey({
    personName: 'Алина',
    personUpdatedAt: '2026-11-24T10:00:00Z',
    columns: [{ title: 'Нравится', facts: ['Матча'] }],
    question: '  Что   подарить? ',
    lang: 'ru',
  });
  const k2 = buildAdvisorCacheKey({
    personName: 'алина',
    personUpdatedAt: '2026-11-24T10:00:00Z',
    columns: [{ title: 'Нравится', facts: ['Матча'] }],
    question: 'что подарить?',
    lang: 'ru',
  });
  const k3 = buildAdvisorCacheKey({
    personName: 'Алина',
    personUpdatedAt: '2026-11-24T10:05:00Z',
    columns: [{ title: 'Нравится', facts: ['Матча', 'Джаз'] }],
    question: 'Что подарить?',
    lang: 'ru',
  });

  assert.equal(k1, k2);
  assert.notEqual(k1, k3);
});

test('buildDossierCacheKey differentiates single vs all modes and languages', () => {
  const d1 = buildDossierCacheKey({
    mode: 'single',
    activePersonName: 'Алина',
    people: [{ name: 'Алина' }],
    lang: 'ru',
  });
  const d2 = buildDossierCacheKey({
    mode: 'all',
    activePersonName: 'Алина',
    people: [{ name: 'Алина' }],
    lang: 'ru',
  });
  assert.notEqual(d1, d2);
});

test('computeEndpointStats computes latency average and token/cache aggregates per endpoint', () => {
  const stats = computeEndpointStats([
    {
      id: '1',
      timestamp: '2026-11-24T10:00:00Z',
      endpoint: 'advisor',
      latencyMs: 400,
      promptTokens: 120,
      candidatesTokens: 80,
      totalTokens: 200,
      cacheHit: false,
      ok: true,
    },
    {
      id: '2',
      timestamp: '2026-11-24T10:01:00Z',
      endpoint: 'advisor',
      latencyMs: 2,
      promptTokens: 0,
      candidatesTokens: 0,
      totalTokens: 0,
      cacheHit: true,
      ok: true,
    },
    {
      id: '3',
      timestamp: '2026-11-24T10:02:00Z',
      endpoint: 'analyze',
      latencyMs: 650,
      promptTokens: 300,
      candidatesTokens: 150,
      totalTokens: 450,
      cacheHit: false,
      ok: false,
    },
  ]);

  const advisor = stats.find((s) => s.endpoint === 'advisor')!;
  const analyze = stats.find((s) => s.endpoint === 'analyze')!;
  assert.equal(advisor.requests, 2);
  assert.equal(advisor.cacheHits, 1);
  assert.equal(advisor.avgLatencyMs, 400);
  assert.equal(advisor.totalTokens, 200);
  assert.equal(analyze.errors, 1);
  assert.equal(analyze.totalTokens, 450);
});

test('validateSafeWebhookUrl permits external https Discord/Telegram/Webhooks and blocks SSRF vectors', () => {
  const discord = validateSafeWebhookUrl('https://discord.com/api/webhooks/123456/secret-token');
  assert.equal(discord.valid, true);
  assert.equal(discord.provider, 'discord');

  const tg = validateSafeWebhookUrl('https://api.telegram.org/bot123456:ABC/sendMessage?chat_id=999');
  assert.equal(tg.valid, true);
  assert.equal(tg.provider, 'telegram');

  assert.equal(validateSafeWebhookUrl('http://discord.com/api/webhooks/1').valid, false);
  assert.equal(validateSafeWebhookUrl('https://127.0.0.1/hook').valid, false);
  assert.equal(validateSafeWebhookUrl('https://169.254.169.254/latest/meta-data').valid, false);
  assert.equal(validateSafeWebhookUrl('https://192.168.1.10/webhook').valid, false);
  assert.equal(validateSafeWebhookUrl('https://localhost:3000/hook').valid, false);
  assert.equal(validateSafeWebhookUrl('https://user:pass@example.com/hook').valid, false);

  const masked = maskWebhookUrl('https://discord.com/api/webhooks/123456/secret-abcd');
  assert.equal(masked.includes('secret'), false);
  assert.ok(masked.endsWith('abcd'));
});

test('sanitizers normalize announcement, sample template, poll, and traffic spike checks', () => {
  const ann = sanitizeAnnouncement({ enabled: true, text: '  Технические работы  ', tone: 'warning' });
  assert.equal(ann.enabled, true);
  assert.equal(ann.text, 'Технические работы');
  assert.equal(ann.tone, 'warning');

  const tpl = sanitizeSampleTemplate({ name: 'Тимур', subtitle: 'Дизайнер' });
  assert.equal(tpl.name, 'Тимур');
  assert.ok(tpl.facts.length > 0);

  const poll = sanitizePoll({
    id: 'p1',
    enabled: true,
    question: 'Что добавить?',
    options: [
      { id: 'o1', label: 'Телеграм-бот', votes: 3 },
      { id: 'o2', label: 'Тёмные виджеты', votes: 1 },
    ],
  });
  assert.equal(poll.enabled, true);
  assert.equal(poll.options.length, 2);

  const now = 1_000_000;
  const burst = Array.from({ length: 25 }, (_, i) => now - i * 1000);
  assert.equal(isTrafficSpike(burst, now), true);
  assert.equal(isTrafficSpike(burst.slice(0, 5), now), false);
});
