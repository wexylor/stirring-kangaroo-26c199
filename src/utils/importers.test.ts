import assert from 'node:assert/strict';
import test from 'node:test';
import { parseImportedChatFile, parseVCardContacts } from './importers.ts';

test('parseVCardContacts parses vCard with folded lines, BDAY, ORG, TEL, EMAIL, NOTE', () => {
  const vcf = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Тимур Сериков',
    'ORG:KazTech',
    'TITLE:Тимлид',
    'TEL;TYPE=CELL:+7 701 555 1234',
    'EMAIL:timur@kaztech.kz',
    'BDAY:1994-05-14',
    'NOTE:Пьёт фильтр-кофе ',
    ' без сахара',
    'END:VCARD',
  ].join('\r\n');

  const contacts = parseVCardContacts(vcf);
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].name, 'Тимур Сериков');
  assert.equal(contacts[0].subtitle, 'Тимлид · KazTech');
  assert.equal(contacts[0].group, 'Работа');
  assert.ok(contacts[0].facts.some((f) => f.text.includes('14.05.1994')));
  assert.ok(contacts[0].facts.some((f) => f.text.includes('+7 701 555 1234')));
  assert.ok(contacts[0].facts.some((f) => f.text.includes('фильтр-кофе без сахара')));
});

test('parseImportedChatFile parses Telegram Desktop JSON export and plain txt transcript', () => {
  const tgJson = JSON.stringify({
    name: 'Алина',
    messages: [
      { type: 'service', text: 'Joined' },
      { type: 'message', from: 'Алина', date: '2026-10-12T12:00:00', text: 'привет' },
      {
        type: 'message',
        from: 'Алина',
        date: '2026-10-12T12:01:00',
        text: ['Я теперь пью только ', { type: 'bold', text: 'матчу на кокосовом' }],
      },
    ],
  });

  const resJson = parseImportedChatFile('result.json', tgJson, 'Алина');
  assert.equal(resJson.ok, true);
  assert.equal(resJson.format, 'telegram_json');
  assert.ok(resJson.extractedText.includes('матчу на кокосовом'));

  const resPlain = parseImportedChatFile('notes.txt', 'Любит горы и походы в субботу', 'Алина');
  assert.equal(resPlain.ok, true);
  assert.ok(resPlain.extractedText.includes('Любит горы'));
});
