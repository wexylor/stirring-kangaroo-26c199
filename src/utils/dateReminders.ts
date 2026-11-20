import type { Person, UpcomingDateReminder } from '../types/notebook';

const MONTHS_GENITIVE: Record<string, number> = {
  января: 1,
  январь: 1,
  янв: 1,
  февраля: 2,
  февраль: 2,
  фев: 2,
  марта: 3,
  март: 3,
  мар: 3,
  апреля: 4,
  апрель: 4,
  апр: 4,
  мая: 5,
  май: 5,
  июня: 6,
  июнь: 6,
  июн: 6,
  июля: 7,
  июль: 7,
  июл: 7,
  августа: 8,
  август: 8,
  авг: 8,
  сентября: 9,
  сентябрь: 9,
  сен: 9,
  сент: 9,
  октября: 10,
  октябрь: 10,
  окт: 10,
  ноября: 11,
  ноябрь: 11,
  ноя: 11,
  декабря: 12,
  декабрь: 12,
  дек: 12,
};

const MONTH_LABELS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

export interface ParsedDateMatch {
  day: number;
  month: number; // 1-12
}

function isValidDayMonth(day: number, month: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const maxDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= maxDays[month - 1];
}

export function parseRussianDatesFromText(text: string): ParsedDateMatch[] {
  const results: ParsedDateMatch[] = [];
  const seen = new Set<string>();
  const source = String(text || '').toLowerCase();

  // 1. Named Russian months: "14 октября", "5 мая", "24 ноя"
  const namedRx =
    /(?:^|[^\d])(\d{1,2})\s+(января|январь|янв|февраля|февраль|фев|марта|март|мар|апреля|апрель|апр|мая|май|июня|июнь|июн|июля|июль|июл|августа|август|авг|сентября|сентябрь|сен|сент|октября|октябрь|окт|ноября|ноябрь|ноя|декабря|декабрь|дек)(?![а-яё])/gi;
  let m: RegExpExecArray | null;
  while ((m = namedRx.exec(source)) !== null) {
    const day = Number(m[1]);
    const month = MONTHS_GENITIVE[m[2].toLowerCase()];
    if (month && isValidDayMonth(day, month)) {
      const key = `${day}.${month}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ day, month });
      }
    }
  }

  // 2. Numeric DD.MM or DD.MM.YYYY or DD/MM
  const numericRx = /(?:^|[^\d])(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?(?=$|[^\d])/g;
  while ((m = numericRx.exec(source)) !== null) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (isValidDayMonth(day, month)) {
      const key = `${day}.${month}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ day, month });
      }
    }
  }

  return results;
}

export function computeDaysUntilNextOccurrence(
  day: number,
  month: number,
  referenceDate: Date = new Date()
): number {
  const todayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const buildTarget = (year: number) => {
    // Handle Feb 29 on non-leap years as Feb 28
    if (month === 2 && day === 29) {
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      return new Date(year, 1, isLeap ? 29 : 28);
    }
    return new Date(year, month - 1, day);
  };

  let target = buildTarget(todayStart.getFullYear());
  if (target.getTime() < todayStart.getTime()) {
    target = buildTarget(todayStart.getFullYear() + 1);
  }

  return Math.round((target.getTime() - todayStart.getTime()) / 86400000);
}

export function isBirthdayFact(columnTitle: string, factText: string): boolean {
  const combined = `${columnTitle} ${factText}`.toLowerCase();
  return /(?:день\s+рожден|\bдр\b|именин|рожден|birthday|д\.р\.)/i.test(combined);
}

export function getUpcomingReminders(
  people: Person[],
  windowDays = 30,
  referenceDate: Date = new Date()
): UpcomingDateReminder[] {
  const reminders: UpcomingDateReminder[] = [];

  for (const person of people) {
    const seenForPerson = new Set<string>();

    for (const col of person.columns) {
      const lowCol = col.title.toLowerCase();
      const isDateColumn =
        lowCol.includes('дат') ||
        lowCol.includes('рожден') ||
        lowCol.includes('празд') ||
        lowCol.includes('годовщин');

      for (const fact of col.facts) {
        const hasEventKeyword =
          isDateColumn ||
          /(?:день\s+рожден|\bдр\b|годовщин|юбиле|праздник|свадьб|именин)/i.test(
            fact.text
          );
        if (!hasEventKeyword) continue;

        const matches = parseRussianDatesFromText(fact.text);
        for (const match of matches) {
          const daysUntil = computeDaysUntilNextOccurrence(
            match.day,
            match.month,
            referenceDate
          );
          if (daysUntil <= windowDays) {
            const dedupKey = `${match.day}.${match.month}:${fact.text.toLowerCase()}`;
            if (seenForPerson.has(dedupKey)) continue;
            seenForPerson.add(dedupKey);

            reminders.push({
              id: `${person.id}_${match.day}_${match.month}_${fact.id}`,
              personId: person.id,
              personName: person.name,
              personColorId: person.colorId,
              factText: fact.text,
              columnTitle: col.title,
              day: match.day,
              month: match.month,
              daysUntil,
              isBirthday: isBirthdayFact(col.title, fact.text),
              formattedDate: `${match.day} ${MONTH_LABELS[match.month - 1]}`,
            });
          }
        }
      }
    }
  }

  reminders.sort((a, b) => a.daysUntil - b.daysUntil);
  return reminders;
}

export function getDaysSinceLastContact(
  person: Person,
  referenceDate: Date = new Date()
): number {
  const iso = person.lastContactAt || person.updatedAt;
  if (!iso) return 0;
  const last = new Date(iso);
  if (Number.isNaN(last.getTime())) return 0;

  const todayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const lastStart = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diff = Math.floor((todayStart.getTime() - lastStart.getTime()) / 86400000);
  return Math.max(0, diff);
}

export function formatDaysRussian(days: number): string {
  const abs = Math.abs(Math.floor(days));
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${abs} дней`;
  if (mod10 === 1) return `${abs} день`;
  if (mod10 >= 2 && mod10 <= 4) return `${abs} дня`;
  return `${abs} дней`;
}
