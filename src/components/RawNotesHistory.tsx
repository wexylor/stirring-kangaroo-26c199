import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Person } from '../types/notebook';
import { formatDateTime } from '../utils/storage';

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
  const [open, setOpen] = useState(false);

  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-sm font-semibold text-left hover:opacity-90"
      >
        <span>🕒 История исходных заметок ({person.rawNotes.length})</span>
        {open ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
      </button>

      {open && (
        <div
          className="px-5 pb-4 pt-3.5 border-t flex flex-col gap-2.5"
          style={{ borderColor: 'var(--border-color)' }}
        >
          {person.rawNotes.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Здесь сохраняются все тексты, которые вы вставляли для анализа.
            </p>
          ) : (
            person.rawNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-xl border text-[13px]"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div
                  className="flex items-center justify-between text-[11px] mb-1.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>Добавлено: {formatDateTime(note.createdAt)}</span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onCopyNote(note.text)}
                      className="hover:underline"
                    >
                      Копировать
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      className="hover:underline"
                      style={{ color: 'var(--danger-text)' }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div className="whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                  {note.text}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};
