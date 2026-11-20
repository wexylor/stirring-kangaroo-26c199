import React, { useState } from 'react';
import { Filter, X, Plus } from 'lucide-react';
import type { Column, Fact, Person } from '../types/notebook';

interface ColumnsGridProps {
  person: Person;
  searchQuery: string;
  onClearSearch: () => void;
  onRenameColumn: (colId: string, newTitle: string) => void;
  onDeleteColumn: (colId: string) => void;
  onEditFact: (colId: string, factId: string, newText: string) => void;
  onDeleteFact: (colId: string, factId: string) => void;
  onQuickAddFact: (colId: string, text: string) => void;
}

interface ColumnCardProps {
  col: Column;
  onRenameColumn: (colId: string, newTitle: string) => void;
  onDeleteColumn: (colId: string) => void;
  onEditFact: (colId: string, factId: string, newText: string) => void;
  onDeleteFact: (colId: string, factId: string) => void;
  onQuickAddFact: (colId: string, text: string) => void;
}

const ColumnCard: React.FC<ColumnCardProps> = ({
  col,
  onRenameColumn,
  onDeleteColumn,
  onEditFact,
  onDeleteFact,
  onQuickAddFact,
}) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(col.title);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [factDraft, setFactDraft] = useState('');
  const [quickInput, setQuickInput] = useState('');

  const commitTitle = () => {
    setEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== col.title) {
      onRenameColumn(col.id, trimmed);
    } else {
      setTitleDraft(col.title);
    }
  };

  const startFactEdit = (fact: Fact) => {
    setEditingFactId(fact.id);
    setFactDraft(fact.text);
  };

  const commitFact = (factId: string) => {
    setEditingFactId(null);
    onEditFact(col.id, factId, factDraft.trim());
  };

  return (
    <article
      className="rounded-2xl border p-4 shadow-sm flex flex-col gap-3 transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: col.isNew ? 'rgba(124, 58, 237, 0.65)' : 'var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-lg shrink-0">{col.icon || '📌'}</span>
          {editingTitle ? (
            <input
              type="text"
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') {
                  setTitleDraft(col.title);
                  setEditingTitle(false);
                }
              }}
              className="w-full px-2 py-0.5 rounded-md border text-[15px] font-bold outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--accent)',
              }}
            />
          ) : (
            <h3
              onClick={() => {
                setTitleDraft(col.title);
                setEditingTitle(true);
              }}
              title="Нажмите, чтобы переименовать колонку"
              className="text-[15px] font-bold truncate cursor-pointer hover:text-violet-400 transition-colors"
            >
              {col.title}
            </h3>
          )}
          <span className="text-xs shrink-0 tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {col.facts.length}
          </span>
          {col.isNew && (
            <span
              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border shrink-0"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-text)',
                borderColor: 'rgba(124, 58, 237, 0.3)',
              }}
            >
              Новое
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDeleteColumn(col.id)}
          aria-label={`Удалить колонку «${col.title}»`}
          title="Удалить колонку"
          className="w-6 h-6 rounded-md inline-flex items-center justify-center text-sm opacity-65 hover:opacity-100"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {col.facts.length === 0 ? (
          <li className="text-xs italic py-1 px-0.5" style={{ color: 'var(--text-muted)' }}>
            Пока нет записей в этой колонке
          </li>
        ) : (
          col.facts.map((fact) => {
            const isInf = fact.tag === 'ai_inference';
            const isUpd = fact.tag === 'updated';

            const itemStyle = isInf
              ? {
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  borderColor: 'var(--warning-border)',
                }
              : isUpd
              ? {
                  backgroundColor: 'var(--info-bg)',
                  borderColor: 'var(--info-border)',
                }
              : fact.isNew
              ? {
                  backgroundColor: 'var(--success-bg)',
                  borderColor: 'var(--success-border)',
                }
              : {
                  backgroundColor: 'var(--bg-fact)',
                  borderColor: 'transparent',
                };

            const dotColor = isInf
              ? '#f59e0b'
              : isUpd
              ? '#0ea5e9'
              : fact.isNew
              ? '#10b981'
              : 'var(--accent)';

            return (
              <li
                key={fact.id}
                className="flex items-start justify-between gap-2 px-2.5 py-2 rounded-xl border text-[13px] leading-snug"
                style={itemStyle}
              >
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                  <div className="flex-1 min-w-0">
                    {editingFactId === fact.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={factDraft}
                        onChange={(e) => setFactDraft(e.target.value)}
                        onBlur={() => commitFact(fact.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitFact(fact.id);
                          if (e.key === 'Escape') setEditingFactId(null);
                        }}
                        className="w-full px-2 py-0.5 rounded-md border text-[13px] outline-none"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--accent)',
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => startFactEdit(fact)}
                        title="Нажмите, чтобы отредактировать"
                        className="block break-words cursor-pointer"
                      >
                        {fact.text}
                      </span>
                    )}
                    {fact.prevText && (
                      <span className="block text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Было: {fact.prevText}
                      </span>
                    )}
                    {fact.reason && (
                      <span className="block text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        ↳ {fact.reason}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isInf && (
                    <span
                      className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap"
                      style={{
                        backgroundColor: 'var(--warning-bg)',
                        borderColor: 'var(--warning-border)',
                        color: 'var(--warning-text)',
                      }}
                    >
                      💡 вывод ИИ
                    </span>
                  )}
                  {isUpd && (
                    <span
                      className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap"
                      style={{
                        backgroundColor: 'var(--info-bg)',
                        borderColor: 'var(--info-border)',
                        color: 'var(--info-text)',
                      }}
                    >
                      🔄 обновлено
                    </span>
                  )}
                  {!isInf && !isUpd && fact.isNew && (
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border whitespace-nowrap"
                      style={{
                        backgroundColor: 'var(--success-bg)',
                        borderColor: 'var(--success-border)',
                        color: 'var(--success-text)',
                      }}
                    >
                      Новое
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteFact(col.id, fact.id)}
                    aria-label={`Удалить факт «${fact.text}»`}
                    title="Удалить факт"
                    className="w-5 h-5 rounded inline-flex items-center justify-center opacity-60 hover:opacity-100"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const val = quickInput.trim();
          if (!val) return;
          onQuickAddFact(col.id, val);
          setQuickInput('');
        }}
        className="flex items-center gap-1.5 mt-0.5"
      >
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder="+ Добавить факт вручную..."
          className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-1 focus:ring-violet-500/40"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-color)',
          }}
        />
        <button
          type="submit"
          aria-label={`Добавить факт в колонку «${col.title}»`}
          title="Добавить"
          className="w-8 h-8 rounded-lg border inline-flex items-center justify-center transition-colors hover:brightness-110"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </article>
  );
};

export const ColumnsGrid: React.FC<ColumnsGridProps> = ({
  person,
  searchQuery,
  onClearSearch,
  onRenameColumn,
  onDeleteColumn,
  onEditFact,
  onDeleteFact,
  onQuickAddFact,
}) => {
  const query = searchQuery.trim().toLowerCase();

  const filteredColumns = person.columns
    .map((col) => {
      if (!query) return col;
      if (col.title.toLowerCase().includes(query)) return col;
      const matchingFacts = col.facts.filter((f) => f.text.toLowerCase().includes(query));
      if (matchingFacts.length > 0) {
        return { ...col, facts: matchingFacts };
      }
      return null;
    })
    .filter((c): c is Column => Boolean(c));

  return (
    <section className="flex flex-col gap-3">
      {/* Visible active filter banner above cards so users never think columns vanished on tab switch */}
      {query && (
        <div
          className="rounded-xl border px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[13px]"
          style={{
            backgroundColor: 'var(--warning-bg)',
            borderColor: 'var(--warning-border)',
            color: 'var(--warning-text)',
          }}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 shrink-0" />
            <span>
              Активен фильтр: <strong>«{searchQuery}»</strong> · показано колонок:{' '}
              <span className="tabular-nums font-semibold">
                {filteredColumns.length} из {person.columns.length}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClearSearch}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors hover:brightness-110"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--warning-border)',
              color: 'var(--text-primary)',
            }}
          >
            <X className="w-3.5 h-3.5" />
            <span>Сбросить фильтр</span>
          </button>
        </div>
      )}

      {filteredColumns.length === 0 ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {query
              ? `У человека «${person.name}» по запросу «${searchQuery}» совпадений не найдено.`
              : 'У этого человека пока нет колонок. Вставьте текст выше или создайте колонку вручную.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {filteredColumns.map((col) => (
            <ColumnCard
              key={col.id}
              col={col}
              onRenameColumn={onRenameColumn}
              onDeleteColumn={onDeleteColumn}
              onEditFact={onEditFact}
              onDeleteFact={onDeleteFact}
              onQuickAddFact={onQuickAddFact}
            />
          ))}
        </div>
      )}
    </section>
  );
};
