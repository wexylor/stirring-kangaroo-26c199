import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Person } from '../types/notebook';
import { formatDateTime } from '../utils/storage';
import { useI18n } from '../utils/LanguageContext';
import { FAST_TRANSITION, collapseVariants } from '../utils/motionPresets';

interface RawNotesHistoryProps {
  person: Person;
  onCopyNote: (text: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export const RawNotesHistory: React.FC<RawNotesHistoryProps> = ({
  person,
  onCopyNote,
  onDeleteNote,
}) => {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <section
      className="pt-5 border-t"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-sm font-semibold text-left hover:opacity-80 transition-opacity"
      >
        <span>
          {t.rawNotes.title}{' '}
          <span className="text-xs font-normal tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {person.rawNotes.length}
          </span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="raw-notes-body"
            variants={collapseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={FAST_TRANSITION}
            className="overflow-hidden"
          >
            <div className="mt-3 divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {person.rawNotes.length === 0 ? (
                <p className="text-[13px] py-2" style={{ color: 'var(--text-muted)' }}>
                  {t.rawNotes.empty}
                </p>
              ) : (
                person.rawNotes.map((note) => (
                  <div
                    key={note.id}
                    className="py-3 text-[13px]"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div
                      className="flex items-center justify-between text-[11px] mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <span className="tabular-nums">{formatDateTime(note.createdAt, lang)}</span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => onCopyNote(note.text)}
                          className="hover:underline"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {t.common.copy}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          className="hover:underline"
                          style={{ color: 'var(--danger-text)' }}
                        >
                          {t.common.delete}
                        </button>
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {note.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
