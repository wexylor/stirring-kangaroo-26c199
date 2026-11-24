import test from 'node:test';
import assert from 'node:assert/strict';
import { createScrollLockManager } from './scrollLock';

test('createScrollLockManager locks on first acquire and unlocks only when last token releases', () => {
  let lockCalls = 0;
  let unlockCalls = 0;
  const manager = createScrollLockManager({
    onLock: () => {
      lockCalls++;
    },
    onUnlock: () => {
      unlockCalls++;
    },
  });

  assert.equal(manager.isLocked(), false);

  manager.acquire('drawer');
  assert.equal(lockCalls, 1);
  assert.equal(unlockCalls, 0);
  assert.equal(manager.isLocked(), true);
  assert.equal(manager.count(), 1);

  // Acquiring modal while drawer is still open must NOT re-lock or prematurely unlock
  manager.acquire('modal');
  assert.equal(lockCalls, 1);
  assert.equal(unlockCalls, 0);
  assert.equal(manager.count(), 2);

  // Closing drawer while modal remains open must keep scroll locked
  manager.release('drawer');
  assert.equal(unlockCalls, 0);
  assert.equal(manager.isLocked(), true);
  assert.equal(manager.count(), 1);

  // Closing last modal unlocks cleanly
  manager.release('modal');
  assert.equal(unlockCalls, 1);
  assert.equal(manager.isLocked(), false);
  assert.equal(manager.count(), 0);
});

test('createScrollLockManager ignores duplicate acquire or unknown release', () => {
  let lockCalls = 0;
  let unlockCalls = 0;
  const manager = createScrollLockManager({
    onLock: () => {
      lockCalls++;
    },
    onUnlock: () => {
      unlockCalls++;
    },
  });

  manager.release('missing');
  assert.equal(unlockCalls, 0);

  manager.acquire('m1');
  manager.acquire('m1');
  assert.equal(lockCalls, 1);
  assert.equal(manager.count(), 1);

  manager.release('m1');
  manager.release('m1');
  assert.equal(unlockCalls, 1);
  assert.equal(manager.isLocked(), false);
});
