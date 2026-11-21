import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDaysUntilNextOccurrence,
  formatDaysRussian,
  getDaysSinceLastContact,
  getUpcomingReminders,
  parseRussianDatesFromText,
} from './dateReminders';
import type { Person } from '../types/notebook';

test('parseRussianDatesFromText parses Russian month names and numeric dates', () => {
  const named = parseRussianDatesFromText('День рождения 14 октября');
  assert.deepEqual(named, [{ day: 14, month: 10 }]);

  const numeric = parseRussianDatesFromText('Годовщина 05.12.2020 и еще 12/05');
  assert.deepEqual(numeric, [
    { day: 5, month: 12 },
    { day: 12, month: 5 },
  ]);

  const invalid = parseRussianDatesFromText('Встреча в 18:30 или 35.13');
  assert.deepEqual(invalid, []);

  const kkDates = parseRussianDatesFromText('Туған күн 25 қараша және 3 наурыз');
  assert.deepEqual(kkDates, [
    { day: 25, month: 11 },
    { day: 3, month: 3 },
  ]);

  const enDates = parseRussianDatesFromText('Birthday November 25 and 14 October');
  assert.deepEqual(enDates, [
    { day: 25, month: 11 },
    { day: 14, month: 10 },
  ]);
});

test('computeDaysUntilNextOccurrence handles same year and year rollover', () => {
  const ref = new Date(2026, 10, 19); // Nov 19, 2026
  assert.equal(computeDaysUntilNextOccurrence(19, 11, ref), 0);
  assert.equal(computeDaysUntilNextOccurrence(24, 11, ref), 5);
  assert.equal(computeDaysUntilNextOccurrence(2, 1, ref), 44);
});

test('getUpcomingReminders finds upcoming birthdays within window', () => {
  const ref = new Date(2026, 10, 19); // Nov 19, 2026
  const people: Person[] = [
    {
      id: 'p1',
      name: 'Алина',
      subtitle: '',
      colorId: 'violet',
      updatedAt: '2026-11-19T10:00:00Z',
      columns: [
        {
          id: 'c1',
          title: 'Важные даты',
          icon: '📅',
          isNew: false,
          facts: [
            { id: 'f1', text: 'День рождения — 24 ноября', isNew: false, tag: 'fact', reason: '', prevText: '' },
            { id: 'f2', text: 'День рождения мамы 15 мая', isNew: false, tag: 'fact', reason: '', prevText: '' },
          ],
        },
      ],
      rawNotes: [],
    },
  ];

  const reminders = getUpcomingReminders(people, 30, ref);
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0].personName, 'Алина');
  assert.equal(reminders[0].daysUntil, 5);
  assert.equal(reminders[0].isBirthday, true);
  assert.equal(reminders[0].formattedDate, '24 ноября');
});

test('getDaysSinceLastContact and formatDaysRussian calculate inactivity accurately', () => {
  const ref = new Date(2026, 10, 19);
  const person: Person = {
    id: 'p1',
    name: 'Максим',
    subtitle: '',
    colorId: 'sky',
    updatedAt: '2026-10-16T12:00:00Z',
    lastContactAt: '2026-10-16T12:00:00Z',
    columns: [],
    rawNotes: [],
  };

  assert.equal(getDaysSinceLastContact(person, ref), 34);
  assert.equal(formatDaysRussian(1), '1 день');
  assert.equal(formatDaysRussian(4), '4 дня');
  assert.equal(formatDaysRussian(14), '14 дней');
  assert.equal(formatDaysRussian(34), '34 дня');
});
