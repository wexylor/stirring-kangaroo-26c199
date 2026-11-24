import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSwipeSession,
  evaluateSwipeEnd,
  evaluateSwipeMove,
  isMobileViewportWidth,
} from './swipeDrawer';

test('isMobileViewportWidth treats widths below 1024px as mobile', () => {
  assert.equal(isMobileViewportWidth(390), true);
  assert.equal(isMobileViewportWidth(1023), true);
  assert.equal(isMobileViewportWidth(1024), false);
  assert.equal(isMobileViewportWidth(1440), false);
});

test('createSwipeSession blocks swipe on desktop, blocking overlay, or interactive inputs', () => {
  assert.equal(
    createSwipeSession({
      clientX: 40,
      clientY: 200,
      now: 100,
      isMobileViewport: false,
      isDrawerOpen: false,
      hasBlockingOverlay: false,
      ignoreTarget: false,
    }),
    null
  );

  assert.equal(
    createSwipeSession({
      clientX: 40,
      clientY: 200,
      now: 100,
      isMobileViewport: true,
      isDrawerOpen: false,
      hasBlockingOverlay: true,
      ignoreTarget: false,
    }),
    null
  );

  assert.equal(
    createSwipeSession({
      clientX: 40,
      clientY: 200,
      now: 100,
      isMobileViewport: true,
      isDrawerOpen: false,
      hasBlockingOverlay: false,
      ignoreTarget: true,
    }),
    null
  );
});

test('left-to-right horizontal swipe on mobile main screen triggers drawer open', () => {
  const session = createSwipeSession({
    clientX: 30,
    clientY: 260,
    now: 1000,
    isMobileViewport: true,
    isDrawerOpen: false,
    hasBlockingOverlay: false,
    ignoreTarget: false,
  });
  assert.ok(session);

  assert.equal(evaluateSwipeMove(session, { clientX: 52, clientY: 263 }), 'pending');
  assert.equal(evaluateSwipeMove(session, { clientX: 96, clientY: 268 }), 'open');
});

test('fast left-to-right flick above 34px opens drawer on touch end', () => {
  const session = createSwipeSession({
    clientX: 50,
    clientY: 300,
    now: 1000,
    isMobileViewport: true,
    isDrawerOpen: false,
    hasBlockingOverlay: false,
    ignoreTarget: false,
  });
  assert.ok(session);

  assert.equal(evaluateSwipeMove(session, { clientX: 70, clientY: 302 }), 'pending');
  assert.equal(evaluateSwipeEnd(session, { clientX: 90, clientY: 304, now: 1060 }), 'open');
});

test('vertical scroll cancels open-drawer swipe without triggering sidebar', () => {
  const session = createSwipeSession({
    clientX: 120,
    clientY: 300,
    now: 1000,
    isMobileViewport: true,
    isDrawerOpen: false,
    hasBlockingOverlay: false,
    ignoreTarget: false,
  });
  assert.ok(session);

  assert.equal(evaluateSwipeMove(session, { clientX: 128, clientY: 330 }), 'cancel');
  assert.equal(evaluateSwipeMove(session, { clientX: 210, clientY: 335 }), 'cancel');
  assert.equal(evaluateSwipeEnd(session, { clientX: 210, clientY: 335, now: 1120 }), 'none');
});

test('right-to-left horizontal swipe on main screen does NOT open drawer', () => {
  const session = createSwipeSession({
    clientX: 280,
    clientY: 260,
    now: 1000,
    isMobileViewport: true,
    isDrawerOpen: false,
    hasBlockingOverlay: false,
    ignoreTarget: false,
  });
  assert.ok(session);

  assert.equal(evaluateSwipeMove(session, { clientX: 210, clientY: 262 }), 'cancel');
  assert.equal(evaluateSwipeEnd(session, { clientX: 180, clientY: 262, now: 1100 }), 'none');
});

test('right-to-left horizontal swipe inside open drawer closes it, while vertical scroll cancels', () => {
  const closeSession = createSwipeSession({
    clientX: 230,
    clientY: 220,
    now: 1000,
    isMobileViewport: true,
    isDrawerOpen: true,
    hasBlockingOverlay: false,
    ignoreTarget: false,
  });
  assert.ok(closeSession);
  assert.equal(closeSession.mode, 'close');
  assert.equal(evaluateSwipeMove(closeSession, { clientX: 170, clientY: 224 }), 'close');

  const scrollSession = createSwipeSession({
    clientX: 150,
    clientY: 200,
    now: 1000,
    isMobileViewport: true,
    isDrawerOpen: true,
    hasBlockingOverlay: false,
    ignoreTarget: false,
  });
  assert.ok(scrollSession);
  assert.equal(evaluateSwipeMove(scrollSession, { clientX: 145, clientY: 230 }), 'cancel');
});
