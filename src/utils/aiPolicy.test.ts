import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_UID,
  classifyGeminiError,
  getAiModelSpec,
  isAdminUid,
  parseGlobalAiConfig,
  resolveAiModelPreset,
  resolveAnalyzerMode,
  shouldUseCloudAi,
} from './aiPolicy';

test('isAdminUid matches configured administrator UID strictly', () => {
  assert.equal(isAdminUid(ADMIN_UID), true);
  assert.equal(isAdminUid(`  ${ADMIN_UID}  `), true);
  assert.equal(isAdminUid('other-user-uid'), false);
  assert.equal(isAdminUid(null), false);
  assert.equal(isAdminUid(''), false);
});

test('resolveAnalyzerMode defaults to auto unless explicitly local', () => {
  assert.equal(resolveAnalyzerMode('local'), 'local');
  assert.equal(resolveAnalyzerMode('auto'), 'auto');
  assert.equal(resolveAnalyzerMode(null), 'auto');
  assert.equal(resolveAnalyzerMode('unknown'), 'auto');
});

test('resolveAiModelPreset and getAiModelSpec map fast/balanced/accurate safely', () => {
  assert.equal(resolveAiModelPreset('fast'), 'fast');
  assert.equal(resolveAiModelPreset('balanced'), 'balanced');
  assert.equal(resolveAiModelPreset('accurate'), 'accurate');
  assert.equal(resolveAiModelPreset('invalid'), 'balanced');
  assert.equal(resolveAiModelPreset(undefined), 'balanced');

  assert.deepEqual(getAiModelSpec('fast'), {
    preset: 'fast',
    modelId: 'gemini-3.1-flash-lite',
    thinkingLevel: 'MINIMAL',
  });
  assert.deepEqual(getAiModelSpec('balanced'), {
    preset: 'balanced',
    modelId: 'gemini-4-hydrogen',
    thinkingLevel: 'LOW',
  });
  assert.deepEqual(getAiModelSpec('accurate'), {
    preset: 'accurate',
    modelId: 'gemini-4-hydrogen',
    thinkingLevel: 'HIGH',
  });
});

test('parseGlobalAiConfig safely handles missing or partial RTDB payloads', () => {
  assert.deepEqual(parseGlobalAiConfig(null), {
    sharedAiEnabled: true,
    guestAiEnabled: true,
    readOnlyMode: false,
    keyRouteMode: 'auto',
    aiModelPreset: 'balanced',
  });
  assert.deepEqual(parseGlobalAiConfig({}), {
    sharedAiEnabled: true,
    guestAiEnabled: true,
    readOnlyMode: false,
    keyRouteMode: 'auto',
    aiModelPreset: 'balanced',
    announcement: undefined,
    sampleTemplate: undefined,
    poll: undefined,
    updatedAt: undefined,
    updatedBy: undefined,
  });
  assert.deepEqual(
    parseGlobalAiConfig({
      sharedAiEnabled: false,
      guestAiEnabled: false,
      readOnlyMode: true,
      keyRouteMode: 'backup',
      aiModelPreset: 'accurate',
      updatedAt: '2026-11-23T08:00:00.000Z',
      updatedBy: ADMIN_UID,
    }),
    {
      sharedAiEnabled: false,
      guestAiEnabled: false,
      readOnlyMode: true,
      keyRouteMode: 'backup',
      aiModelPreset: 'accurate',
      announcement: undefined,
      sampleTemplate: undefined,
      poll: undefined,
      updatedAt: '2026-11-23T08:00:00.000Z',
      updatedBy: ADMIN_UID,
    }
  );
});

test('shouldUseCloudAi enforces local preference, offline, admin switch, guest restriction, and server key', () => {
  assert.deepEqual(
    shouldUseCloudAi({
      preferenceMode: 'local',
      isOnline: true,
      sharedAiEnabled: true,
      serverKeyConfigured: true,
    }),
    { useCloud: false, reason: 'LOCAL_ONLY_MODE' }
  );

  assert.deepEqual(
    shouldUseCloudAi({
      preferenceMode: 'auto',
      isOnline: false,
      sharedAiEnabled: true,
      serverKeyConfigured: true,
    }),
    { useCloud: false, reason: 'OFFLINE' }
  );

  assert.deepEqual(
    shouldUseCloudAi({
      preferenceMode: 'auto',
      isOnline: true,
      sharedAiEnabled: false,
      serverKeyConfigured: true,
    }),
    { useCloud: false, reason: 'AI_DISABLED_BY_ADMIN' }
  );

  assert.deepEqual(
    shouldUseCloudAi({
      preferenceMode: 'auto',
      isOnline: true,
      sharedAiEnabled: true,
      serverKeyConfigured: true,
      isGuest: true,
      guestAiEnabled: false,
    }),
    { useCloud: false, reason: 'GUEST_AI_DISABLED' }
  );

  assert.deepEqual(
    shouldUseCloudAi({
      preferenceMode: 'auto',
      isOnline: true,
      sharedAiEnabled: true,
      serverKeyConfigured: false,
    }),
    { useCloud: false, reason: 'NO_API_KEY' }
  );

  assert.deepEqual(
    shouldUseCloudAi({
      preferenceMode: 'auto',
      isOnline: true,
      sharedAiEnabled: true,
      serverKeyConfigured: true,
      isGuest: true,
      guestAiEnabled: true,
    }),
    { useCloud: true }
  );
});

test('classifyGeminiError detects retryable and permanent upstream errors accurately', () => {
  assert.deepEqual(
    classifyGeminiError('{"error":{"code":503,"status":"UNAVAILABLE"}}'),
    { httpStatus: 503, errorCode: 'UNAVAILABLE', retryable: true }
  );
  assert.deepEqual(
    classifyGeminiError('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}'),
    { httpStatus: 429, errorCode: 'RESOURCE_EXHAUSTED', retryable: true }
  );
  assert.deepEqual(
    classifyGeminiError('API_KEY_INVALID: API key not valid'),
    { httpStatus: 400, errorCode: 'API_KEY_INVALID', retryable: false }
  );
  assert.deepEqual(
    classifyGeminiError('PERMISSION_DENIED'),
    { httpStatus: 403, errorCode: 'PERMISSION_DENIED', retryable: false }
  );
  assert.deepEqual(
    classifyGeminiError('Some unexpected failure'),
    { httpStatus: 502, errorCode: 'UPSTREAM_ERROR', retryable: false }
  );
});
