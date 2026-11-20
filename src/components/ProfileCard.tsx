import React, { useState } from 'react';
import {
  Pin,
  Sparkles,
  Plus,
  Trash2,
  CalendarPlus,
  Eraser,
  Pencil,
  Clock,
} from 'lucide-react';
import type { Person } from '../types/notebook';
import { DEFAULT_GROUPS, getAvatarGradient } from '../data/sampleData';
import { formatDateTime, getInitials } from '../utils/storage';
import { formatDaysRussian, getDaysSinceLastContact } from '../utils/dateReminders';

interface ProfileCardProps {
  person: Person;
  onRename: (newName: string) => void;
  onEditSubtitle: (newSubtitle: string) => void;
  onTogglePin: () => void;
  onChangeGroup: (group: string) => void;
  onChangeInterval: (days: number) => void;
  onOpenDossier: () => void;
  onOpenAddColumn: () => void;
  onOpenAddMeeting: () => void;
  onDeduplicate: () => void;
  onDeletePerson: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  person,
  onRename,
  onEditSubtitle,
  onTogglePin,
  onChangeGroup,
  onChangeInterval,
  onOpenDossier,
  onOpenAddColumn,
  onOpenAddMeeting,
  onDeduplicate,
  onDeletePerson,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(person.name);
  const [editingSub, setEditingSub] = useState(false);
  const [subDraft, setSubDraft] = useState(person.subtitle);

  const totalFacts = person.columns.reduce((s, c) => s + c.facts.length, 0);
  const daysSince = getDaysSinceLastContact(person);
  const threshold = person.contactIntervalDays ?? 30;
  const isOverdue = threshold > 0 && daysSince >= threshold;

  const commitName = () => {
    setEditingName(false);
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== person.name) {
      onRename(trimmed);
    } else {
      setNameDraft(person.name);
    }
  };

  const commitSub = () => {
    setEditingSub(false);
    const trimmed = subDraft.trim();
    if (trimmed !== person.subtitle) {
      onEditSubtitle(trimmed);
    }
  };

  return (
    <section
      className="rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col gap-3.5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-[220px] flex-1">
          <div
            className="w-13 h-13 rounded-2xl text-white text-xl font-bold flex items-center justify-center shrink-0 shadow-md"
            style={{ background: getAvatarGradient(person.colorId) }}
          >
            {getInitials(person.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {editingName ? (
                <input
                  type="text"
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitName();
                    if (e.key === 'Escape') {
                      setNameDraft(person.name);
                      setEditingName(false);
                    }
                  }}
                  className="px-2 py-0.5 rounded-lg border text-xl font-bold outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--accent)',
                  }}
                />
              ) : (
                <>
                  <h1
                    onClick={() => {
                      setNameDraft(person.name);
                      setEditingName(true);
                    }}
                    title="Нажмите, чтобы переименовать"
                    className="font-display text-[22px] font-bold tracking-tight cursor-pointer hover:text-violet-400 transition-colors"
                  >
                    {person.name}
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      setNameDraft(person.name);
                      setEditingName(true);
                    }}
                    aria-label="Переименовать вкладку"
                    title="Переименовать вкладку"
                    className="p-1 rounded-lg opacity-70 hover:opacity-100"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onTogglePin}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-medium transition-colors"
                style={{
                  backgroundColor: person.isPinned ? 'var(--warning-bg)' : 'var(--bg-elevated)',
                  borderColor: person.isPinned ? 'var(--warning-border)' : 'var(--border-color)',
                  color: person.isPinned ? 'var(--warning-text)' : 'var(--text-secondary)',
                }}
                title={person.isPinned ? 'Открепить вкладку' : 'Закрепить в начале списка'}
              >
                <Pin className={`w-3 h-3 ${person.isPinned ? 'fill-current' : ''}`} />
                <span>{person.isPinned ? 'Закреплено' : 'Закрепить'}</span>
              </button>
            </div>

            {editingSub ? (
              <input
                type="text"
                autoFocus
                value={subDraft}
                onChange={(e) => setSubDraft(e.target.value)}
                onBlur={commitSub}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitSub();
                  if (e.key === 'Escape') {
                    setSubDraft(person.subtitle);
                    setEditingSub(false);
                  }
                }}
                className="mt-1 w-full max-w-md px-2 py-0.5 rounded-lg border text-[13px] outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--accent)',
                }}
              />
            ) : (
              <p
                onClick={() => {
                  setSubDraft(person.subtitle);
                  setEditingSub(true);
                }}
                title="Нажмите, чтобы изменить пометку"
                className="text-[13px] mt-0.5 cursor-pointer hover:opacity-90"
                style={{ color: 'var(--text-secondary)' }}
              >
                {person.subtitle || 'Нажмите, чтобы добавить краткое описание...'}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenDossier}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold text-white whitespace-nowrap shadow-sm transition-all hover:brightness-110"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Собрать все данные (ИИ)</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddMeeting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[13px] font-semibold whitespace-nowrap transition-colors"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Записать встречу / звонок</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddColumn}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[13px] font-semibold whitespace-nowrap transition-colors"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Колонка</span>
          </button>

          <button
            type="button"
            onClick={onDeduplicate}
            title="Проверить и удалить повторяющиеся факты"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[13px] font-semibold whitespace-nowrap transition-colors"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Убрать дубли</span>
          </button>

          <button
            type="button"
            onClick={onDeletePerson}
            title="Удалить вкладку человека"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-colors hover:opacity-90"
            style={{
              color: 'var(--danger-text)',
              backgroundColor: 'var(--danger-bg)',
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Удалить вкладку</span>
          </button>
        </div>
      </div>

      {/* Full-width unboxed typographic metadata + inline group/interval controls */}
      <div
        className="pt-3 border-t flex flex-wrap items-center gap-x-3 gap-y-2 text-xs"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
      >
        <span className="tabular-nums">
          Категорий: <strong style={{ color: 'var(--text-secondary)' }}>{person.columns.length}</strong>
        </span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">
          Фактов: <strong style={{ color: 'var(--text-secondary)' }}>{totalFacts}</strong>
        </span>
        <span aria-hidden="true">·</span>
        <span>Обновлено: {formatDateTime(person.updatedAt)}</span>
        <span aria-hidden="true">·</span>

        <label className="inline-flex items-center gap-1.5">
          <span>Группа:</span>
          <select
            value={person.group || ''}
            onChange={(e) => onChangeGroup(e.target.value)}
            aria-label="Группа контакта"
            className="px-2 py-0.5 rounded-md border text-xs outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Без группы</option>
            {DEFAULT_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <span aria-hidden="true">·</span>

        <label className="inline-flex items-center gap-1.5">
          <span>Трекер общения:</span>
          <select
            value={String(threshold)}
            onChange={(e) => onChangeInterval(Number(e.target.value))}
            aria-label="Интервал напоминания о контакте"
            className="px-2 py-0.5 rounded-md border text-xs outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="14">Раз в 14 дн.</option>
            <option value="30">Раз в 30 дн.</option>
            <option value="60">Раз в 60 дн.</option>
            <option value="0">Выкл</option>
          </select>
        </label>

        {isOverdue && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold tabular-nums"
            style={{
              backgroundColor: 'var(--warning-bg)',
              borderColor: 'var(--warning-border)',
              color: 'var(--warning-text)',
            }}
          >
            <Clock className="w-3 h-3" />
            <span>Не общались {formatDaysRussian(daysSince)}</span>
          </span>
        )}
      </div>
    </section>
  );
};
