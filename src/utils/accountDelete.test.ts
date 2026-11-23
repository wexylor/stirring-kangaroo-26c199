import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAdvanceDeleteStep1,
  canAdvanceDeleteStep2,
  canSubmitDeleteStep3,
  getDeleteConfirmKeyword,
  getNextDeleteStep,
  getPrevDeleteStep,
  matchesDeleteConfirmKeyword,
} from './accountDelete';

test('getDeleteConfirmKeyword returns localized uppercase keywords', () => {
  assert.equal(getDeleteConfirmKeyword('ru'), 'УДАЛИТЬ');
  assert.equal(getDeleteConfirmKeyword('kk'), 'ЖОЮ');
  assert.equal(getDeleteConfirmKeyword('en'), 'DELETE');
});

test('matchesDeleteConfirmKeyword trims whitespace and is case-insensitive', () => {
  assert.equal(matchesDeleteConfirmKeyword('  удалить ', 'ru'), true);
  assert.equal(matchesDeleteConfirmKeyword('УДАЛИТЬ', 'ru'), true);
  assert.equal(matchesDeleteConfirmKeyword('жою', 'kk'), true);
  assert.equal(matchesDeleteConfirmKeyword('delete', 'en'), true);
  assert.equal(matchesDeleteConfirmKeyword('DELETE', 'ru'), true);
  assert.equal(matchesDeleteConfirmKeyword('удал', 'ru'), false);
  assert.equal(matchesDeleteConfirmKeyword('', 'ru'), false);
});

test('multi-step deletion guards block premature progression', () => {
  assert.equal(canAdvanceDeleteStep1(false), false);
  assert.equal(canAdvanceDeleteStep1(true), true);

  assert.equal(canAdvanceDeleteStep2('', 'ru'), false);
  assert.equal(canAdvanceDeleteStep2('удали', 'ru'), false);
  assert.equal(canAdvanceDeleteStep2('удалить', 'ru'), true);

  assert.equal(canSubmitDeleteStep3('', false), false);
  assert.equal(canSubmitDeleteStep3('secret123', true), false);
  assert.equal(canSubmitDeleteStep3('secret123', false), true);
});

test('step transitions move sequentially between stages 1, 2, and 3', () => {
  assert.equal(getNextDeleteStep(1), 2);
  assert.equal(getNextDeleteStep(2), 3);
  assert.equal(getNextDeleteStep(3), 3);

  assert.equal(getPrevDeleteStep(3), 2);
  assert.equal(getPrevDeleteStep(2), 1);
  assert.equal(getPrevDeleteStep(1), 1);
});
