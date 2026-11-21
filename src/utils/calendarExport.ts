import {
  computeDaysUntilNextOccurrence,
  isBirthdayFact,
  parseDatesFromText,
} from './dateReminders';

export interface IcsEventInput {
  personName: string;
  title: string;
  day: number;
  month: number; // 1-12
  isRecurringYearly?: boolean;
  description?: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function escapeIcsText(val: string): string {
  return String(val || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatDateYmd(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

export function getNextEventDate(
  day: number,
  month: number,
  referenceDate: Date = new Date()
): Date {
  const daysUntil = computeDaysUntilNextOccurrence(day, month, referenceDate);
  const start = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  start.setDate(start.getDate() + daysUntil);
  return start;
}

export function buildIcsContent(
  input: IcsEventInput,
  referenceDate: Date = new Date()
): string {
  const startDate = getNextEventDate(input.day, input.month, referenceDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  const now = referenceDate;
  const dtStamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(
    now.getUTCDate()
  )}T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(
    now.getUTCSeconds()
  )}Z`;

  const slug = `${input.personName}-${input.month}-${input.day}`
    .toLowerCase()
    .replace(/[^a-z0-9а-яёәғқңөұүһі-]+/gi, '-')
    .replace(/^-+|-+$/g, '');

  const uid = `${slug || 'event'}-${startDate.getFullYear()}@peoplenotebook.app`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PeopleNotebook//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;VALUE=DATE:${formatDateYmd(startDate)}`,
    `DTEND;VALUE=DATE:${formatDateYmd(endDate)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
  ];

  if (input.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(input.description)}`);
  }

  if (input.isRecurringYearly) {
    lines.push('RRULE:FREQ=YEARLY');
  }

  // Reminder 1 day prior
  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(input.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  );

  return lines.join('\r\n');
}

export function isAnnualEventFact(columnTitle: string, factText: string): boolean {
  if (isBirthdayFact(columnTitle, factText)) return true;
  const combined = `${columnTitle} ${factText}`.toLowerCase();
  return /(?:годовщин|свадьб|юбиле|именин|мерейтой|үйлену|anniversary)/i.test(
    combined
  );
}

export function extractExportableDateFromFact(
  columnTitle: string,
  factText: string
): { day: number; month: number; isYearly: boolean } | null {
  const matches = parseDatesFromText(factText);
  if (matches.length === 0) return null;
  const first = matches[0];
  return {
    day: first.day,
    month: first.month,
    isYearly: isAnnualEventFact(columnTitle, factText),
  };
}

export function downloadIcsEvent(input: IcsEventInput): void {
  const content = buildIcsContent(input);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = `${input.personName || 'event'}-${pad2(input.month)}-${pad2(
    input.day
  )}`
    .toLowerCase()
    .replace(/[^\wа-яёәғқңөұүһі-]+/gi, '-');
  a.download = `${safeName}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
