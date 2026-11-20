import React from 'react';
import { Cake, CalendarClock, ArrowRight } from 'lucide-react';
import type { UpcomingDateReminder } from '../types/notebook';
import { formatDaysRussian } from '../utils/dateReminders';

interface UpcomingRemindersBarProps {
  reminders: UpcomingDateReminder[];
  onSelectPerson: (personId: string) => void;
}

export const UpcomingRemindersBar: React.FC<UpcomingRemindersBarProps> = ({
  reminders,
  onSelectPerson,
}) => {
  if (reminders.length === 0) return null;

  return (
    <section
      aria-label="Ближайшие важные даты"
      className="rounded-2xl border px-4 py-3 flex flex-col gap-2"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--warning-border)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--warning-text)' }}>
          <CalendarClock className="w-4 h-4" />
          <span>Напоминания о важных датах (ближайшие 30 дней)</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {reminders.slice(0, 4).map((r) => {
          const whenLabel =
            r.daysUntil === 0
              ? 'Сегодня'
              : r.daysUntil === 1
              ? 'Завтра'
              : `Через ${formatDaysRussian(r.daysUntil)}`;

          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectPerson(r.personId)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12.5px] font-medium text-left transition-all hover:brightness-110"
              style={{
                backgroundColor: 'var(--warning-bg)',
                borderColor: 'var(--warning-border)',
                color: 'var(--text-primary)',
              }}
            >
              <span>{r.isBirthday ? <Cake className="w-4 h-4 text-amber-400 inline" /> : '📅'}</span>
              <span>
                <strong>{whenLabel}</strong> ({r.formattedDate}){' '}
                {r.isBirthday
                  ? `— ДР: ${r.personName} · загляни в идеи подарков`
                  : `— ${r.personName}: ${r.factText}`}
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
            </button>
          );
        })}
      </div>
    </section>
  );
};
