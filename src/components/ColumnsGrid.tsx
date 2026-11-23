import React, { useState } from 'react';
import { CalendarPlus, History, Plus, X } from 'lucide-react';
import type { Column, Fact, FactHistoryEntry, Person } from '../types/notebook';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from '../utils/LanguageContext';
import { extractExportableDateFromFact } from '../utils/calendarExport';
import { formatDateTime } from '../utils/storage';
import { FAST_TRANSITION, collapseVariants } from '../utils/motionPresets';

interface ColumnsGridProps {
  person: Person;
  searchQuery: string;
  onClearSearch: () => void;
  onRenameColumn: (colId: string, newTitle: string) => void;
  onDeleteColumn: (colId: string) => void;
  onEditFact: (colId: string, factId: string, newText: string) => void;
  onDeleteFact: (colId: string, factId: string) => void;
  onQuickAddFact: (colId: string, text: string) => void;
  onExportDateToCalendar?: (factText: string, colTitle: string) => void;
}

interface ColumnCardProps {
  col: Column;
  onRenameColumn: (colId: string, newTitle: string) => void;
  onDeleteColumn: (colId: string) => void;
  onEditFact: (colId: string, factId: string, newText: string) => void;
  onDeleteFact: (colId: string, factId: string) => void;
  onQuickAddFact: (colId: string, text: string) => void;
  onExportDateToCalendar?: (factText: string, colTitle: string) => void;
}

const ColumnCard: React.FC<ColumnCardProps> = ({
  col,
  onRenameColumn,
  onDeleteColumn,
  onEditFact,
  onDeleteFact,
  onQuickAddFact,
  onExportDateToCalendar,
}) => {
  const { lang, t } = useI18n();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(col.title);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [factDraft, setFactDraft] = useState('');
  const [quickInput, setQuickInput] = useState('');
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Record<string, boolean>>({});

  const toggleHistory = (factId: string) => {
    setExpandedHistoryIds((prev) => ({ ...prev, [factId]: !prev[factId] }));
  };

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
      className="rounded-lg border p-4 flex flex-col gap-3"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: col.isNew ? 'var(--border-hover)' : 'var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
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
              className="w-full px-2 py-0.5 rounded border text-sm font-semibold outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-hover)',
              }}
            />
          ) : (
            <h3
              onClick={() => {
                setTitleDraft(col.title);
                setEditingTitle(true);
              }}
              title={t.columns.renameTitle}
              className="text-[14px] font-semibold truncate cursor-pointer hover:opacity-80 transition-opacity"
            >
              {col.title}
            </h3>
          )}
          <span className="text-xs shrink-0 tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {col.facts.length}
          </span>
          {col.isNew && (
            <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--success-text)' }}>
              {t.columns.newBadge}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDeleteColumn(col.id)}
          aria-label={t.columns.deleteSectionAria(col.title)}
          title={t.columns.deleteSectionTitle}
          className="w-6 h-6 rounded inline-flex items-center justify-center opacity-50 hover:opacity-100 hover:bg-[var(--bg-hover)] transition-opacity"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <ul className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
        {col.facts.length === 0 ? (
          <li className="text-xs py-1.5" style={{ color: 'var(--text-muted)' }}>
            {t.columns.emptyFacts}
          </li>
        ) : (
          col.facts.map((fact) => {
            const isInf = fact.tag === 'ai_inference';
            const isUpd = fact.tag === 'updated';
            const historyEntries: FactHistoryEntry[] =
              fact.history && fact.history.length > 0
                ? fact.history
                : fact.prevText
                ? [{ text: fact.prevText, changedAt: '', reason: fact.reason }]
                : [];
            const hasHistory = historyEntries.length > 0;
            const isHistoryOpen = Boolean(expandedHistoryIds[fact.id]);
            const exportableDate = onExportDateToCalendar
              ? extractExportableDateFromFact(col.title, fact.text)
              : null;

            return (
              <li
                key={fact.id}
                className="group flex items-start justify-between gap-2 py-2 first:pt-0.5 last:pb-0.5 text-[13px] leading-snug"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex-1 min-w-0">
                  {editingFactId === fact.id ? (
                    <input
                      type="text"
                      autoFocus
                      aria-label={t.columns.editFactTitle}
                      value={factDraft}
                      onChange={(e) => setFactDraft(e.target.value)}
                      onBlur={() => commitFact(fact.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitFact(fact.id);
                        if (e.key === 'Escape') setEditingFactId(null);
                      }}
                      className="w-full px-2 py-0.5 rounded border text-[13px] outline-none"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-hover)',
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => startFactEdit(fact)}
                      title={t.columns.editFactTitle}
                      className="block break-words cursor-pointer hover:opacity-85"
                    >
                      {fact.text}
                    </span>
                  )}

                  {(isInf || isUpd || fact.isNew || fact.prevText || fact.reason || hasHistory) && (
                    <div
                      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {isInf && <span style={{ color: 'var(--warning-text)' }}>{t.columns.tagInference}</span>}
                      {isUpd && <span style={{ color: 'var(--info-text)' }}>{t.columns.tagUpdated}</span>}
                      {!isInf && !isUpd && fact.isNew && (
                        <span style={{ color: 'var(--success-text)' }}>{t.columns.tagNew}</span>
                      )}
                      {fact.prevText && !isHistoryOpen && (
                        <span>
                          {t.columns.prevLabel} {fact.prevText}
                        </span>
                      )}
                      {fact.reason && <span>· {fact.reason}</span>}
                      {hasHistory && (
                        <button
                          type="button"
                          onClick={() => toggleHistory(fact.id)}
                          aria-expanded={isHistoryOpen}
                          className="inline-flex items-center gap-1 hover:underline"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <History className="w-3 h-3" />
                          <span>
                            {isHistoryOpen
                              ? t.columns.historyHideBtn
                              : t.columns.historyBtn(historyEntries.length)}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {hasHistory && isHistoryOpen && (
                      <motion.ol
                        key={`hist-${fact.id}`}
                        variants={collapseVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={FAST_TRANSITION}
                        className="mt-1.5 pl-2.5 border-l-2 space-y-1 text-[11.5px] overflow-hidden"
                        style={{
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {historyEntries.map((entry, idx) => (
                          <li key={`${fact.id}_hist_${idx}`} className="leading-snug">
                            <span className="line-through opacity-75">{entry.text}</span>
                            {entry.changedAt && (
                              <span className="ml-1.5 text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                                ({formatDateTime(entry.changedAt, lang)})
                              </span>
                            )}
                          </li>
                        ))}
                      </motion.ol>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                  {exportableDate && onExportDateToCalendar && (
                    <button
                      type="button"
                      onClick={() => onExportDateToCalendar(fact.text, col.title)}
                      aria-label={t.columns.exportCalendarAria(fact.text)}
                      title={t.columns.exportCalendarTitle}
                      className="w-5 h-5 rounded inline-flex items-center justify-center opacity-55 group-hover:opacity-100 focus:opacity-100 hover:bg-[var(--bg-hover)] transition-opacity"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteFact(col.id, fact.id)}
                    aria-label={t.columns.deleteFactAria(fact.text)}
                    title={t.common.delete}
                    className="w-5 h-5 rounded inline-flex items-center justify-center opacity-40 group-hover:opacity-100 focus:opacity-100 hover:bg-[var(--bg-hover)] transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X className="w-3 h-3" />
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
        className="flex items-center gap-1.5 pt-1"
      >
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder={t.columns.quickAddPlaceholder}
          aria-label={t.columns.quickAddAria(col.title)}
          className="flex-1 px-2.5 py-1.5 rounded-md border text-xs outline-none"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-color)',
          }}
        />
        <button
          type="submit"
          aria-label={t.columns.quickAddAria(col.title)}
          title={t.common.add}
          className="w-7 h-7 rounded-md border inline-flex items-center justify-center transition-colors hover:bg-[var(--bg-hover)] shrink-0"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
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
  onExportDateToCalendar,
}) => {
  const { t } = useI18n();
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
      <AnimatePresence initial={false}>
        {query && (
          <motion.div
            key="columns-search-banner"
            variants={collapseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={FAST_TRANSITION}
            className="overflow-hidden"
          >
            <div
              className="rounded-md border px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <span>
                {t.columns.filterPrefix} <strong style={{ color: 'var(--text-primary)' }}>«{searchQuery}»</strong> ·{' '}
                <span className="tabular-nums">
                  {t.columns.sectionsOf(filteredColumns.length, person.columns.length)}
                </span>
              </span>
              <button
                type="button"
                onClick={onClearSearch}
                className="text-xs font-medium hover:underline"
                style={{ color: 'var(--text-primary)' }}
              >
                {t.columns.resetFilter}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredColumns.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {query
              ? t.columns.emptySearch(person.name, searchQuery)
              : t.columns.emptySections}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {filteredColumns.map((col) => (
            <ColumnCard
              key={col.id}
              col={col}
              onRenameColumn={onRenameColumn}
              onDeleteColumn={onDeleteColumn}
              onEditFact={onEditFact}
              onDeleteFact={onDeleteFact}
              onQuickAddFact={onQuickAddFact}
              onExportDateToCalendar={onExportDateToCalendar}
            />
          ))}
        </div>
      )}
    </section>
  );
};
