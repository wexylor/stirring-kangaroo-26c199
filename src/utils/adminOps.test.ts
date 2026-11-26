import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyAdminTicketMutation,
  buildAdminExportCsv,
  computeErrorBreakdown,
  createEmptyActivityHeatmap,
  isClientVersionOutdated,
  normalizeTicketsCollection,
  recordActivitySlot,
  sanitizeAiPromptStyle,
  sanitizeConfigBackupBundle,
  sanitizeTicketTags,
  sanitizeUiDefaults,
  shouldFallbackToDirectRtdb,
} from './adminOps.ts';

test('computeErrorBreakdown categorizes quota, timeout, authKey, and network/other errors', () => {
  const breakdown = computeErrorBreakdown([
    {
      id: '1',
      timestamp: '2026-01-01T10:00:00Z',
      endpoint: 'analyze',
      latencyMs: 120,
      promptTokens: 10,
      candidatesTokens: 5,
      totalTokens: 15,
      cacheHit: false,
      ok: true,
    },
    {
      id: '2',
      timestamp: '2026-01-01T10:01:00Z',
      endpoint: 'analyze',
      latencyMs: 200,
      promptTokens: 0,
      candidatesTokens: 0,
      totalTokens: 0,
      cacheHit: false,
      ok: false,
      errorCode: 'RESOURCE_EXHAUSTED',
    },
    {
      id: '3',
      timestamp: '2026-01-01T10:02:00Z',
      endpoint: 'advisor',
      latencyMs: 10000,
      promptTokens: 0,
      candidatesTokens: 0,
      totalTokens: 0,
      cacheHit: false,
      ok: false,
      errorCode: 'UNAVAILABLE',
    },
    {
      id: '4',
      timestamp: '2026-01-01T10:03:00Z',
      endpoint: 'dossier',
      latencyMs: 80,
      promptTokens: 0,
      candidatesTokens: 0,
      totalTokens: 0,
      cacheHit: false,
      ok: false,
      errorCode: 'API_KEY_INVALID',
    },
    {
      id: '5',
      timestamp: '2026-01-01T10:04:00Z',
      endpoint: 'greeting',
      latencyMs: 50,
      promptTokens: 0,
      candidatesTokens: 0,
      totalTokens: 0,
      cacheHit: false,
      ok: false,
      errorCode: 'UPSTREAM_ERROR',
    },
  ]);

  assert.equal(breakdown.quota429, 1);
  assert.equal(breakdown.timeout503, 1);
  assert.equal(breakdown.authKey, 1);
  assert.equal(breakdown.networkOther, 1);
  assert.equal(breakdown.totalErrors, 4);
});

test('isClientVersionOutdated compares semantic versions cleanly', () => {
  assert.equal(isClientVersionOutdated('2.3.9', '2.4.0'), true);
  assert.equal(isClientVersionOutdated('2.4.0', '2.4.0'), false);
  assert.equal(isClientVersionOutdated('2.4.1', '2.4.0'), false);
  assert.equal(isClientVersionOutdated('3.0.0', '2.9.9'), false);
  assert.equal(isClientVersionOutdated('2.4.0', '0.0.0'), false);
});

test('sanitizeUiDefaults and sanitizeAiPromptStyle fall back safely', () => {
  const style = sanitizeAiPromptStyle({ advisorVerbosity: 'detailed', factGranularity: 'grouped' });
  assert.deepEqual(style, { advisorVerbosity: 'detailed', factGranularity: 'grouped' });
  assert.deepEqual(sanitizeAiPromptStyle(null), {
    advisorVerbosity: 'concise',
    factGranularity: 'atomic',
  });

  const ui = sanitizeUiDefaults({
    defaultGroups: ['VIP', 'Семья', 'VIP'],
    defaultSections: [{ title: 'Идеи', icon: '💡' }],
    quickAdvisorPrompts: ['Что подарить?'],
  });
  assert.deepEqual(ui.defaultGroups, ['VIP', 'Семья']);
  assert.deepEqual(ui.defaultSections, [{ title: 'Идеи', icon: '💡' }]);
  assert.deepEqual(ui.quickAdvisorPrompts, ['Что подарить?']);
});

test('sanitizeTicketTags and recordActivitySlot', () => {
  assert.deepEqual(sanitizeTicketTags(['urgent', 'invalid', 'fixed', 'urgent']), ['urgent', 'fixed']);
  const hm = createEmptyActivityHeatmap();
  recordActivitySlot(hm, new Date(Date.UTC(2026, 10, 25, 14, 30, 0))); // 2026-11-25 is Wednesday (index 2)
  assert.equal(hm.hours[14], 1);
  assert.equal(hm.weekdays[2], 1);
});

test('buildAdminExportCsv includes UTF-8 BOM and properly quotes cells', () => {
  const csv = buildAdminExportCsv({
    requests: [
      {
        id: 'req1',
        timestamp: '2026-11-25T10:00:00Z',
        endpoint: 'analyze',
        latencyMs: 320,
        promptTokens: 100,
        candidatesTokens: 50,
        totalTokens: 150,
        cacheHit: false,
        ok: true,
        slotUsed: 'primary',
      },
    ],
    tickets: [
      {
        id: 't1',
        type: 'bug',
        text: 'Bug with "quotes", here',
        authorLabel: 'Alex',
        isGuest: false,
        lang: 'ru',
        appVersion: '2.4.0',
        status: 'open',
        createdAt: '2026-11-25T10:05:00Z',
      },
    ],
    events: [],
  });
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"Alex: Bug with ""quotes"", here"'));
});

test('shouldFallbackToDirectRtdb detects 404/network missing backend but ignores auth denials', () => {
  assert.equal(shouldFallbackToDirectRtdb(new Error('HTTP_404')), true);
  assert.equal(shouldFallbackToDirectRtdb(new Error('HTTP_405')), true);
  assert.equal(shouldFallbackToDirectRtdb(new TypeError('Failed to fetch')), true);
  assert.equal(shouldFallbackToDirectRtdb(new Error('HTTP_401')), false);
  assert.equal(shouldFallbackToDirectRtdb(new Error('HTTP_403')), false);
  assert.equal(shouldFallbackToDirectRtdb(new Error('FORBIDDEN')), false);
});

test('normalizeTicketsCollection, applyAdminTicketMutation, and sanitizeConfigBackupBundle work cleanly', () => {
  const normalized = normalizeTicketsCollection({
    t1: {
      id: 't1',
      type: 'bug',
      text: 'Issue 1',
      authorLabel: 'User',
      createdAt: '2026-11-24T10:00:00Z',
      status: 'open',
    },
    t2: {
      id: 't2',
      type: 'idea',
      text: 'Idea 2',
      authorLabel: 'User 2',
      createdAt: '2026-11-25T10:00:00Z',
      status: 'open',
    },
  });
  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].id, 't2');

  const resolved = applyAdminTicketMutation(normalized, {
    id: 't1',
    action: 'resolve',
    reply: 'Fixed now!',
    tags: ['fixed'],
    publishToBanner: true,
  });
  const t1 = resolved.tickets.find((t) => t.id === 't1');
  assert.equal(t1?.status, 'resolved');
  assert.equal(t1?.adminReply, 'Fixed now!');
  assert.deepEqual(t1?.tags, ['fixed']);
  assert.equal(resolved.announcement?.enabled, true);
  assert.equal(resolved.announcement?.text, 'Fixed now!');

  const bundle = sanitizeConfigBackupBundle({
    aiSettings: {
      sharedAiEnabled: false,
      aiModelPreset: 'accurate',
      extraAdminEmails: ['Admin@Example.com'],
    },
    tickets: normalized,
  });
  assert.equal(bundle.aiSettings.sharedAiEnabled, false);
  assert.deepEqual(bundle.aiSettings.extraAdminEmails, ['admin@example.com']);
  assert.equal(bundle.tickets?.length, 2);
});

