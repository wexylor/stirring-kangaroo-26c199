import test from 'node:test';
import assert from 'node:assert/strict';
import { looksLikeChatTranscript, parseChatTranscript } from './chatParser';

test('looksLikeChatTranscript distinguishes dialogue exports from plain notes', () => {
  assert.equal(looksLikeChatTranscript('Любит матчу на овсяном молоке.'), false);

  const tgLog = [
    'Алина, [20.11.2026 14:10]',
    'Привет, как дела?',
    'Алина, [20.11.2026 14:12]',
    'Кстати, я перешла на матчу без сахара.',
  ].join('\n');
  assert.equal(looksLikeChatTranscript(tgLog), true);
});

test('parseChatTranscript strips Telegram greetings/filler and keeps dates, tastes, allergies, and plans', () => {
  const tgLog = [
    'Алина, [20.11.2026 14:10]',
    'Привет! Как дела?',
    'Я, [20.11.2026 14:11]',
    'Всё норм, спасибо!',
    'Алина, [20.11.2026 14:12]',
    'Голосовое сообщение',
    'Алина, [20.11.2026 14:13]',
    'Кстати я теперь обожаю японскую матчу, но на арахис у меня аллергия.',
    'Алина, [20.11.2026 14:14]',
    'Давай встретимся 25 ноября в тихой кофейне, обещаю принести фотоаппарат.',
    'Я, [20.11.2026 14:15]',
    'Ок, супер',
  ].join('\n');

  const res = parseChatTranscript(tgLog, 'Алина');
  assert.equal(res.isChat, true);
  assert.equal(res.extractedLines.length, 2);
  assert.match(res.cleanedText, /матчу/i);
  assert.match(res.cleanedText, /аллергия/i);
  assert.match(res.cleanedText, /25 ноября/i);
  assert.doesNotMatch(res.cleanedText, /как дела|всё норм|голосовое сообщение|ок, супер/i);
});

test('parseChatTranscript strips WhatsApp bracket and dash headers across kk and en', () => {
  const waLog = [
    '[20.11.26, 09:00] Alex: Hi, how are you?',
    '[20.11.26, 09:01] Me: Good, thx',
    '[20.11.26, 09:02] Alex: <Media omitted>',
    '[20.11.26, 09:03] Alex: I love espresso and my birthday is November 25',
    '20/11/2026, 09:05 - Айгерім: Сәлем, қалайсың?',
    '20/11/2026, 09:06 - Айгерім: Мен джаз музыкасын қатты ұнатамын',
  ].join('\n');

  const res = parseChatTranscript(waLog);
  assert.equal(res.isChat, true);
  assert.match(res.cleanedText, /espresso/i);
  assert.match(res.cleanedText, /November 25/i);
  assert.match(res.cleanedText, /джаз музыкасын/i);
  assert.doesNotMatch(res.cleanedText, /how are you|media omitted|қалайсың/i);
});
