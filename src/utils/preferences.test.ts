import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTHOR_INSTAGRAM_HANDLE,
  AUTHOR_INSTAGRAM_URL,
  detectDeviceLanguage,
  detectDeviceTheme,
  normalizeLangCode,
} from './preferences';
import { TRANSLATIONS, translateGroupLabel } from './i18n';

test('normalizeLangCode parses device locale tags for Kazakh, Russian, and English', () => {
  assert.equal(normalizeLangCode('kk-KZ'), 'kk');
  assert.equal(normalizeLangCode('kk'), 'kk');
  assert.equal(normalizeLangCode('ru-RU'), 'ru');
  assert.equal(normalizeLangCode('en-US'), 'en');
  assert.equal(normalizeLangCode('fr-FR'), null);
});

test('detectDeviceLanguage respects saved override and falls back to device languages priority list', () => {
  assert.equal(detectDeviceLanguage('kk', ['en-US', 'ru-RU']), 'kk');
  assert.equal(detectDeviceLanguage(null, ['kk-KZ', 'ru-RU']), 'kk');
  assert.equal(detectDeviceLanguage(null, ['ru-RU', 'en-US']), 'ru');
  assert.equal(detectDeviceLanguage(null, ['en-GB', 'ru-RU']), 'en');
  assert.equal(detectDeviceLanguage(null, ['de-DE', 'kk-KZ']), 'kk');
  assert.equal(detectDeviceLanguage(null, ['fr-FR']), 'en');
});

test('detectDeviceTheme respects saved override and follows device prefers-color-scheme by default', () => {
  assert.equal(detectDeviceTheme('dark', true, false), 'dark');
  assert.equal(detectDeviceTheme('light', false, true), 'light');
  assert.equal(detectDeviceTheme(null, true, false), 'light');
  assert.equal(detectDeviceTheme(null, false, true), 'dark');
  assert.equal(detectDeviceTheme(undefined, false, false), 'dark');
});

test('author Instagram constants and translations for kk/ru/en are complete', () => {
  assert.equal(AUTHOR_INSTAGRAM_HANDLE, 'inst:wexylor');
  assert.equal(AUTHOR_INSTAGRAM_URL, 'https://www.instagram.com/wexylor/');

  for (const lang of ['kk', 'ru', 'en'] as const) {
    const tr = TRANSLATIONS[lang];
    assert.ok(tr.account.authorLabel.length > 0);
    assert.ok(tr.account.languageLabel.length > 0);
    assert.ok(tr.sidebar.brand.length > 0);
    assert.ok(tr.analyzer.quickQuestions.length === 4);
  }

  assert.equal(translateGroupLabel('Друзья', 'kk'), 'Достар');
  assert.equal(translateGroupLabel('Друзья', 'en'), 'Friends');
  assert.equal(translateGroupLabel('Все', 'kk'), 'Барлығы');
});
