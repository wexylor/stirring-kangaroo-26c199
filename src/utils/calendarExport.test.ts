import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIcsContent,
  extractExportableDateFromFact,
  isAnnualEventFact,
} from './calendarExport';

test('extractExportableDateFromFact finds ru/kk/en dates and marks annual events', () => {
  const ruBday = extractExportableDateFromFact('Важные даты', 'День рождения — 24 ноября');
  assert.deepEqual(ruBday, { day: 24, month: 11, isYearly: true });

  const kkBday = extractExportableDateFromFact('Маңызды күндер', 'Туған күн 25 қараша');
  assert.deepEqual(kkBday, { day: 25, month: 11, isYearly: true });

  const enAnniv = extractExportableDateFromFact('Dates', 'Wedding anniversary November 25');
  assert.deepEqual(enAnniv, { day: 25, month: 11, isYearly: true });

  const regularDate = extractExportableDateFromFact('Планы', 'Поездка в Киото 14 мая');
  assert.deepEqual(regularDate, { day: 14, month: 5, isYearly: false });

  assert.equal(isAnnualEventFact('Даты', 'Годовщина свадьбы 5 июля'), true);
  assert.equal(extractExportableDateFromFact('Нравится', 'Любит зелёный чай'), null);
});

test('buildIcsContent produces valid RFC 5445 VCALENDAR with RRULE and 1-day VALARM', () => {
  const ref = new Date(2026, 10, 20, 12, 0, 0); // Nov 20, 2026
  const ics = buildIcsContent(
    {
      personName: 'Алина',
      title: 'Алина — День рождения',
      day: 24,
      month: 11,
      isRecurringYearly: true,
      description: 'День рождения — 24 ноября, любит матчу',
    },
    ref
  );

  assert.match(ics, /^BEGIN:VCALENDAR/m);
  assert.match(ics, /^VERSION:2\.0/m);
  assert.match(ics, /^DTSTART;VALUE=DATE:20261124/m);
  assert.match(ics, /^DTEND;VALUE=DATE:20261125/m);
  assert.match(ics, /^RRULE:FREQ=YEARLY/m);
  assert.match(ics, /^TRIGGER:-P1D/m);
  assert.match(ics, /SUMMARY:Алина — День рождения/);
  assert.match(ics, /DESCRIPTION:День рождения — 24 ноября\\, любит матчу/);
  assert.match(ics, /END:VCALENDAR$/);
});
