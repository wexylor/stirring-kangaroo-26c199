import type { Person, UpcomingDateReminder } from '../types/notebook';
import type { AppLang } from './preferences';

const MONTHS_BY_NAME: Record<string, number> = {
  // Russian
  января: 1, январь: 1, янв: 1,
  февраля: 2, февраль: 2, фев: 2,
  марта: 3, март: 3, мар: 3,
  апреля: 4, апрель: 4, апр: 4,
  мая: 5, май: 5,
  июня: 6, июнь: 6, июн: 6,
  июля: 7, июль: 7, июл: 7,
  августа: 8, август: 8, авг: 8,
  сентября: 9, сентябрь: 9, сен: 9, сент: 9,
  октября: 10, октябрь: 10, окт: 10,
  ноября: 11, ноябрь: 11, ноя: 11,
  декабря: 12, декабрь: 12, дек: 12,
  // Kazakh
  қаңтар: 1, қаңтарда: 1, қаң: 1,
  ақпан: 2, ақпанда: 2, ақп: 2,
  наурыз: 3, наурызда: 3, нау: 3,
  сәуір: 4, сәуірде: 4, сәу: 4,
  мамыр: 5, мамырда: 5, мам: 5,
  маусым: 6, маусымда: 6, мау: 6,
  шілде: 7, шілдеде: 7, шіл: 7,
  тамыз: 8, тамызда: 8, там: 8,
  қыркүйек: 9, қыркүйекте: 9, қыр: 9,
  қазан: 10, қазанда: 10, қаз: 10,
  қараша: 11, қарашада: 11, қар: 11,
  желтоқсан: 12, желтоқсанда: 12, жел: 12,
  // English
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sept: 9, sep: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
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

const MONTH_PATTERN = Object.keys(MONTHS_BY_NAME)
  .sort((a, b) => b.length - a.length)
  .join('|');

export function parseDatesFromText(text: string): ParsedDateMatch[] {
  const rawMatches: Array<{ index: number; day: number; month: number }> = [];
  const source = String(text || '').toLowerCase();

  // 1. Named day + month: "14 октября", "25 қараша", "25 November"
  const dayFirstRx = new RegExp(
    `(?:^|[^\\d])(\\d{1,2})\\s+(${MONTH_PATTERN})(?![а-яёәғқңөұүһіa-z])`,
    'gi'
  );
  let m: RegExpExecArray | null;
  while ((m = dayFirstRx.exec(source)) !== null) {
    const day = Number(m[1]);
    const month = MONTHS_BY_NAME[m[2].toLowerCase()];
    if (month && isValidDayMonth(day, month)) {
      rawMatches.push({ index: m.index, day, month });
    }
  }

  // 2. Named English month + day: "November 25", "Nov 25th"
  const monthFirstRx = new RegExp(
    `(?:^|[^а-яёәғқңөұүһіa-z])(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?=$|[^\\d])`,
    'gi'
  );
  while ((m = monthFirstRx.exec(source)) !== null) {
    const month = MONTHS_BY_NAME[m[1].toLowerCase()];
    const day = Number(m[2]);
    if (month && isValidDayMonth(day, month)) {
      rawMatches.push({ index: m.index, day, month });
    }
  }

  // 3. Numeric DD.MM or DD.MM.YYYY or DD/MM
  const numericRx = /(?:^|[^\d])(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?(?=$|[^\d])/g;
  while ((m = numericRx.exec(source)) !== null) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (isValidDayMonth(day, month)) {
      rawMatches.push({ index: m.index, day, month });
    }
  }

  rawMatches.sort((a, b) => a.index - b.index);
  const results: ParsedDateMatch[] = [];
  const seen = new Set<string>();
  for (const item of rawMatches) {
    const key = `${item.day}.${item.month}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ day: item.day, month: item.month });
    }
  }

  return results;
}

export function parseRussianDatesFromText(text: string): ParsedDateMatch[] {
  return parseDatesFromText(text);
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
  return /(?:день\s+рожден|\bдр\b|именин|рожден|birthday|bday|д\.р\.|туған\s+күн)/i.test(
    combined
  );
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
        lowCol.includes('годовщин') ||
        lowCol.includes('туған') ||
        lowCol.includes('күндер') ||
        lowCol.includes('date') ||
        lowCol.includes('birthday') ||
        lowCol.includes('anniversary');

      for (const fact of col.facts) {
        const hasEventKeyword =
          isDateColumn ||
          /(?:день\s+рожден|\bдр\b|годовщин|юбиле|праздник|свадьб|именин|туған\s+күн|мерейтой|үйлену|birthday|anniversary|wedding)/i.test(
            fact.text
          );
        if (!hasEventKeyword) continue;

        const matches = parseDatesFromText(fact.text);
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

export function formatDaysForLang(days: number, lang: AppLang = 'ru'): string {
  const abs = Math.abs(Math.floor(days));
  if (lang === 'kk') return `${abs} күн`;
  if (lang === 'en') return abs === 1 ? '1 day' : `${abs} days`;
  return formatDaysRussian(days);
}
