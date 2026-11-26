import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KEEP_ALIVE_INTERVAL_MS,
  KEEP_ALIVE_MIN_GAP_MS,
  createInitialKeepAliveStatus,
  recordKeepAliveResult,
  shouldSendKeepAlivePing,
} from './keepAlive';

test('shouldSendKeepAlivePing respects online, visibility, min gap, and force flags', () => {
  assert.equal(
    shouldSendKeepAlivePing({
      nowMs: 1000,
      lastPingAtMs: null,
      isVisible: true,
      isOnline: false,
    }),
    false
  );
  assert.equal(
    shouldSendKeepAlivePing({
      nowMs: 1000,
      lastPingAtMs: null,
      isVisible: false,
      isOnline: true,
    }),
    false
  );
  assert.equal(
    shouldSendKeepAlivePing({
      nowMs: 1000,
      lastPingAtMs: null,
      isVisible: false,
      isOnline: true,
      force: true,
    }),
    true
  );
  assert.equal(
    shouldSendKeepAlivePing({
      nowMs: 10_000,
      lastPingAtMs: 5_000,
      isVisible: true,
      isOnline: true,
    }),
    false
  );
  assert.equal(
    shouldSendKeepAlivePing({
      nowMs: 5_000 + KEEP_ALIVE_MIN_GAP_MS,
      lastPingAtMs: 5_000,
      isVisible: true,
      isOnline: true,
    }),
    true
  );
  assert.equal(KEEP_ALIVE_INTERVAL_MS, 240_000);
});

test('recordKeepAliveResult updates ping counts, latency, uptime, and failure streak cleanly', () => {
  let state = createInitialKeepAliveStatus();
  assert.equal(state.lastStatus, 'idle');
  assert.equal(state.pingCount, 0);

  state = recordKeepAliveResult(state, {
    nowMs: 12000,
    ok: true,
    latencyMs: 84.6,
    serverUptimeSec: 421,
  });
  assert.equal(state.lastStatus, 'ok');
  assert.equal(state.pingCount, 1);
  assert.equal(state.lastLatencyMs, 85);
  assert.equal(state.serverUptimeSec, 421);
  assert.equal(state.consecutiveFailures, 0);

  state = recordKeepAliveResult(state, {
    nowMs: 25000,
    ok: false,
    latencyMs: 3000,
  });
  assert.equal(state.lastStatus, 'error');
  assert.equal(state.pingCount, 2);
  assert.equal(state.consecutiveFailures, 1);
  assert.equal(state.lastSuccessAtMs, 12000);
});
