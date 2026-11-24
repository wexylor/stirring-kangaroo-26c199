import React, { useState } from 'react';
import { ChevronDown, Phone, Users, MessageCircle, Calendar, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { MeetingType, Person } from '../types/notebook';
import { formatShortDate } from '../utils/storage';
import { formatDaysForLang, getDaysSinceLastContact } from '../utils/dateReminders';
import { useLiveMinute } from '../utils/liveClock';
import { useI18n } from '../utils/LanguageContext';
import { FAST_TRANSITION, collapseVariants } from '../utils/motionPresets';

interface MeetingsTimelineProps {
  person: Person;
  onOpenAddMeeting: () => void;
  onDeleteMeeting: (meetingId: string) => void;
}

const TYPE_ICONS: Record<MeetingType, React.ComponentType<{ className?: string }>> = {
  meeting: Users,
  call: Phone,
  message: MessageCircle,
  other: Calendar,
};

export const MeetingsTimeline: React.FC<MeetingsTimelineProps> = ({
  person,
  onOpenAddMeeting,
  onDeleteMeeting,
}) => {
  const { lang, t } = useI18n();
  useLiveMinute();
  const [open, setOpen] = useState(true);
  const meetings = person.meetings || [];
  const daysSince = getDaysSinceLastContact(person);

  const whenLast =
    daysSince === 0
      ? t.meetings.today
      : t.meetings.daysAgo(formatDaysForLang(daysSince, lang));

  return (
    <section
      className="pt-5 border-t"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-left hover:opacity-80 transition-opacity"
        >
          <span>{t.meetings.title}</span>
          <span className="text-xs font-normal tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {t.meetings.countAndLast(meetings.length, whenLast)}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-muted)' }}
          />
        </button>

        <button
          type="button"
          onClick={onOpenAddMeeting}
          className="px-2.5 py-1 rounded-md border text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          {t.meetings.addBtn}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="meetings-body"
            variants={collapseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={FAST_TRANSITION}
            className="overflow-hidden"
          >
            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {meetings.length === 0 ? (
                <p className="text-[13px] py-2" style={{ color: 'var(--text-muted)' }}>
                  {t.meetings.empty}
                </p>
              ) : (
                meetings.map((m) => {
                  const IconComp = TYPE_ICONS[m.type] || TYPE_ICONS.meeting;
                  const typeLabel = t.meetings.types[m.type] || t.meetings.types.meeting;
                  return (
                    <div
                      key={m.id}
                      className="group py-2.5 flex items-start justify-between gap-3 text-[13px]"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="shrink-0 mt-1" style={{ color: 'var(--text-muted)' }}>
                          <IconComp className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                            <span className="font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
                              {formatShortDate(m.date, lang)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{typeLabel}</span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)' }}>{m.summary}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteMeeting(m.id)}
                        aria-label={t.meetings.deleteAria}
                        title={t.common.delete}
                        className="p-1 rounded opacity-40 group-hover:opacity-100 focus:opacity-100 hover:bg-[var(--bg-hover)] shrink-0 transition-opacity"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
