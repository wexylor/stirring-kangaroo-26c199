import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildKeyExecutionPlan,
  getSlotCooldownMs,
  isRouteConfigured,
  mapErrorToSlotHealth,
  resolveAiKeyRouteMode,
  resolveServerGeminiKeys,
  shouldFailoverToNextSlot,
} from './aiKeyRouter';

test('resolveServerGeminiKeys reads primary and backup environment aliases safely', () => {
  assert.deepEqual(
    resolveServerGeminiKeys({
      GEMINI_API_KEY: ' key-1 ',
      GEMINI_API_KEY_BACKUP: ' key-2 ',
    }),
    { primaryKey: 'key-1', backupKey: 'key-2' }
  );

  assert.deepEqual(
    resolveServerGeminiKeys({
      GEMINI_API_KEY: '',
      GEMINI_API_KEY_SECONDARY: 'sec-key',
    }),
    { primaryKey: '', backupKey: 'sec-key' }
  );
});

test('resolveAiKeyRouteMode defaults unknown values to auto', () => {
  assert.equal(resolveAiKeyRouteMode('primary'), 'primary');
  assert.equal(resolveAiKeyRouteMode('backup'), 'backup');
  assert.equal(resolveAiKeyRouteMode('auto'), 'auto');
  assert.equal(resolveAiKeyRouteMode('invalid'), 'auto');
  assert.equal(resolveAiKeyRouteMode(undefined), 'auto');
});

test('isRouteConfigured checks key availability per selected routing mode', () => {
  const onlyBackup = { primaryKey: '', backupKey: 'b' };
  assert.equal(isRouteConfigured(onlyBackup, 'auto'), true);
  assert.equal(isRouteConfigured(onlyBackup, 'backup'), true);
  assert.equal(isRouteConfigured(onlyBackup, 'primary'), false);

  const onlyPrimary = { primaryKey: 'p', backupKey: '' };
  assert.equal(isRouteConfigured(onlyPrimary, 'auto'), true);
  assert.equal(isRouteConfigured(onlyPrimary, 'primary'), true);
  assert.equal(isRouteConfigured(onlyPrimary, 'backup'), false);
});

test('buildKeyExecutionPlan prioritizes healthy slot during primary cooldown in auto mode', () => {
  const both = { primaryKey: 'p', backupKey: 'b' };
  const now = 100_000;

  assert.deepEqual(
    buildKeyExecutionPlan({ keys: both, routeMode: 'auto', nowMs: now }),
    ['primary', 'backup']
  );

  // When primary is in cooldown, auto mode promotes backup first while keeping primary as last resort
  assert.deepEqual(
    buildKeyExecutionPlan({
      keys: both,
      routeMode: 'auto',
      primaryCooldownUntilMs: now + 60_000,
      backupCooldownUntilMs: 0,
      nowMs: now,
    }),
    ['backup', 'primary']
  );

  // Manual backup mode only tries backup
  assert.deepEqual(
    buildKeyExecutionPlan({ keys: both, routeMode: 'backup', nowMs: now }),
    ['backup']
  );

  // Auto mode still works if only backup key is configured
  assert.deepEqual(
    buildKeyExecutionPlan({
      keys: { primaryKey: '', backupKey: 'b' },
      routeMode: 'auto',
      nowMs: now,
    }),
    ['backup']
  );
});

test('shouldFailoverToNextSlot and cooldown classify key/quota failures accurately', () => {
  assert.equal(shouldFailoverToNextSlot('RESOURCE_EXHAUSTED'), true);
  assert.equal(shouldFailoverToNextSlot('API_KEY_INVALID'), true);
  assert.equal(shouldFailoverToNextSlot('PERMISSION_DENIED'), true);
  assert.equal(shouldFailoverToNextSlot('UNAVAILABLE'), true);
  assert.equal(shouldFailoverToNextSlot('MODEL_NOT_FOUND'), false);

  assert.ok(getSlotCooldownMs('API_KEY_INVALID') > getSlotCooldownMs('RESOURCE_EXHAUSTED'));
  assert.ok(getSlotCooldownMs('RESOURCE_EXHAUSTED') > getSlotCooldownMs('UNAVAILABLE'));
  assert.equal(mapErrorToSlotHealth('API_KEY_INVALID'), 'invalid');
  assert.equal(mapErrorToSlotHealth('429 RESOURCE_EXHAUSTED'), 'cooldown');
});
