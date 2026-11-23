import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRAWER_TRANSITION,
  FAST_TRANSITION,
  WINDOW_TRANSITION,
  backdropVariants,
  collapseVariants,
  drawerLeftVariants,
  getAuthModeDirection,
  getDirectionalSlideVariants,
  getStepDirection,
  modalPanelVariants,
  toastVariants,
  windowEnterVariants,
  windowSwapVariants,
} from './motionPresets';

test('getStepDirection returns 1 for forward or same step and -1 for backward', () => {
  assert.equal(getStepDirection(1, 2), 1);
  assert.equal(getStepDirection(2, 3), 1);
  assert.equal(getStepDirection(2, 2), 1);
  assert.equal(getStepDirection(3, 2), -1);
  assert.equal(getStepDirection(2, 1), -1);
});

test('getAuthModeDirection resolves directional order across login, register, forgot', () => {
  assert.equal(getAuthModeDirection('login', 'register'), 1);
  assert.equal(getAuthModeDirection('login', 'forgot'), 1);
  assert.equal(getAuthModeDirection('register', 'login'), -1);
  assert.equal(getAuthModeDirection('forgot', 'login'), -1);
});

test('getDirectionalSlideVariants produces symmetric enter/exit offsets', () => {
  const variants = getDirectionalSlideVariants(20);
  const initialForward = (variants.initial as (d: number) => { opacity: number; x: number })(1);
  const exitForward = (variants.exit as (d: number) => { opacity: number; x: number })(1);
  const initialBackward = (variants.initial as (d: number) => { opacity: number; x: number })(-1);
  const exitBackward = (variants.exit as (d: number) => { opacity: number; x: number })(-1);

  assert.deepEqual(initialForward, { opacity: 0, x: 20 });
  assert.deepEqual(exitForward, { opacity: 0, x: -20 });
  assert.deepEqual(initialBackward, { opacity: 0, x: -20 });
  assert.deepEqual(exitBackward, { opacity: 0, x: 20 });
  assert.deepEqual(variants.animate, { opacity: 1, x: 0 });
});

test('window and modal presets define crisp, non-sluggish durations and exit states', () => {
  assert.ok(typeof WINDOW_TRANSITION.duration === 'number' && WINDOW_TRANSITION.duration <= 0.25);
  assert.ok(typeof FAST_TRANSITION.duration === 'number' && FAST_TRANSITION.duration <= 0.2);
  assert.ok(typeof DRAWER_TRANSITION.duration === 'number' && DRAWER_TRANSITION.duration <= 0.3);

  assert.ok(backdropVariants.initial && backdropVariants.animate && backdropVariants.exit);
  assert.ok(modalPanelVariants.initial && modalPanelVariants.animate && modalPanelVariants.exit);
  assert.ok(drawerLeftVariants.initial && drawerLeftVariants.animate && drawerLeftVariants.exit);
  assert.ok(windowSwapVariants.initial && windowSwapVariants.animate && windowSwapVariants.exit);
  assert.ok(windowEnterVariants.initial && windowEnterVariants.animate);
  assert.ok(collapseVariants.initial && collapseVariants.animate && collapseVariants.exit);
  assert.ok(toastVariants.initial && toastVariants.animate && toastVariants.exit);
});
