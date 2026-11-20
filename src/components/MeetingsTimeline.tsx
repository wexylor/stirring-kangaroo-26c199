import React, { useState } from 'react';
import { CalendarPlus, ChevronDown, ChevronUp, Phone, Users, MessageCircle, Calendar, Trash2 } from 'lucide-react';
import type { MeetingType, Person } from '../types/notebook';
import { formatShortDate } from '../utils/storage';
import { formatDaysRussian, getDaysSinceLastContact } from '../utils/dateReminders';

interface MeetingsTimelineProps {
  person: Person;
  onOpenAddMeeting: () => void;
  onDeleteMeeting: (meetingId: string) => void;
}

const TYPE_META: Record<MeetingType, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  meeting: { label: 'Встреча', Icon: Users },
  call: { label: 'Звонок', Icon: Phone },
  message: { label: 'Переписка', Icon: MessageCircle },
  other: { label: 'Событие', Icon: Calendar },
};

export const MeetingsTimeline: React.FC<MeetingsTimelineProps> = ({
  person,
  onOpenAddMeeting,
  onDeleteMeeting,
}) => {
  const [open, setOpen] = useState(true);
  const meetings = person.meetings || [];
  const daysSince = getDaysSinceLastContact(person);

  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-left"
        >
          <span>📅 Таймлайн общения и встреч ({meetings.length})</span>
          <span className="text-xs font-normal tabular-nums" style={{ color: 'var(--text-muted)' }}>
            · Последний контакт: {daysSince === 0 ? 'сегодня' : `${formatDaysRussian(daysSince)} назад`}
          </span>
          {open ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
        </button>

        <button
          type="button"
          onClick={onOpenAddMeeting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors hover:brightness-110"
          style={{
            backgroundColor: 'var(--accent-soft)',
            borderColor: 'rgba(124, 58, 237, 0.35)',
            color: 'var(--accent-text)',
          }}
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>Записать встречу / звонок</span>
        </button>
      </div>

      {open && (
        <div
          className="px-5 pb-4 pt-3 border-t flex flex-col gap-2.5"
          style={{ borderColor: 'var(--border-color)' }}
        >
          {meetings.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Пока нет записанных встреч или звонков. Фиксируйте здесь живое общение — блокнот будет сам считать, сколько дней прошло с последнего контакта.
            </p>
          ) : (
            meetings.map((m) => {
              const meta = TYPE_META[m.type] || TYPE_META.meeting;
              const IconComp = meta.Icon;
              return (
                <div
                  key={m.id}
                  className="p-3 rounded-xl border flex items-start justify-between gap-3 text-[13px]"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                        <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          {formatShortDate(m.date)}
                        </strong>
                        <span aria-hidden="true">·</span>
                        <span>{meta.label}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)' }}>{m.summary}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteMeeting(m.id)}
                    aria-label="Удалить запись о встрече"
                    title="Удалить запись"
                    className="p-1 rounded-md opacity-60 hover:opacity-100 shrink-0"
                    style={{ color: 'var(--danger-text)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
};
