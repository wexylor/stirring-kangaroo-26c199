import React from 'react';
import { Calendar, CalendarPlus } from 'lucide-react';
import type { UpcomingDateReminder } from '../types/notebook';
import { formatDaysForLang } from '../utils/dateReminders';
import { useI18n } from '../utils/LanguageContext';

interface UpcomingRemindersBarProps {
  reminders: UpcomingDateReminder[];
  onSelectPerson: (personId: string) => void;
  onExportCalendar?: (reminder: UpcomingDateReminder) => void;
}

export const UpcomingRemindersBar: React.FC<UpcomingRemindersBarProps> = ({
  reminders,
  onSelectPerson,
  onExportCalendar,
}) => {
  const { lang, t } = useI18n();
  if (reminders.length === 0) return null;

  return (
    <section
      aria-label={t.reminders.ariaLabel}
      className="px-3 py-2.5 border-b"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div
        className="flex items-center gap-1.5 text-[11px] font-medium mb-1.5"
        style={{ color: 'var(--text-muted)' }}
      >
        <Calendar className="w-3 h-3" />
        <span>{t.reminders.title}</span>
      </div>

      <div className="flex flex-col gap-0.5">
        {reminders.slice(0, 3).map((r) => {
          const whenLabel =
            r.daysUntil === 0
              ? t.reminders.today
              : r.daysUntil === 1
              ? t.reminders.tomorrow
              : t.reminders.inDays(formatDaysForLang(r.daysUntil, lang));
          const eventLabel = r.isBirthday ? t.reminders.birthday : r.factText;

          return (
            <div key={r.id} className="flex items-center gap-1 group">
              <button
                type="button"
                onClick={() => onSelectPerson(r.personId)}
                className="flex-1 min-w-0 text-left px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-[var(--bg-hover)] flex items-baseline justify-between gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="truncate">
                  <span className="font-medium">{r.personName}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {' · '}
                    {eventLabel}
                  </span>
                </span>
                <span
                  className="text-[11px] shrink-0 tabular-nums"
                  style={{
                    color: r.daysUntil <= 7 ? 'var(--warning-text)' : 'var(--text-muted)',
                  }}
                >
                  {whenLabel}
                </span>
              </button>

              {onExportCalendar && (
                <button
                  type="button"
                  onClick={() => onExportCalendar(r)}
                  aria-label={t.reminders.exportCalendarAria(r.personName, eventLabel)}
                  title={t.reminders.exportCalendarTitle}
                  className="w-6 h-6 rounded inline-flex items-center justify-center shrink-0 opacity-60 hover:opacity-100 hover:bg-[var(--bg-hover)] transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
