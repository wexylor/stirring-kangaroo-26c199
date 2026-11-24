import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeLiveRemainingSeconds,
  computeLiveUptimeMs,
  formatDurationUptime,
} from './liveClock.ts';

test('computeLiveRemainingSeconds counts down accurately to zero without negatives', () => {
  const target = 1_000_000 + 45_200;
  assert.equal(computeLiveRemainingSeconds(target, 1_000_000), 46);
  assert.equal(computeLiveRemainingSeconds(target, 1_044_500), 1);
  assert.equal(computeLiveRemainingSeconds(target, 1_045_200), 0);
  assert.equal(computeLiveRemainingSeconds(target, 1_090_000), 0);
  assert.equal(computeLiveRemainingSeconds(null, 1_000_000), 0);
});

test('computeLiveUptimeMs returns elapsed milliseconds safely clamped at zero', () => {
  assert.equal(computeLiveUptimeMs(5000, 12500), 7500);
  assert.equal(computeLiveUptimeMs(15000, 12500), 0);
  assert.equal(computeLiveUptimeMs(undefined, 12500), 0);
});

test('formatDurationUptime formats HH:MM:SS and day prefixes cleanly across ru/kk/en', () => {
  assert.equal(formatDurationUptime(0, 'ru'), '00:00:00');
  assert.equal(formatDurationUptime(65_000, 'ru'), '00:01:05');
  assert.equal(formatDurationUptime(3_661_000, 'en'), '01:01:01');
  assert.equal(formatDurationUptime(90_061_000, 'ru'), '1д 01:01:01');
  assert.equal(formatDurationUptime(90_061_000, 'kk'), '1к 01:01:01');
  assert.equal(formatDurationUptime(90_061_000, 'en'), '1d 01:01:01');
});
