import React, { useState } from 'react';
import { Pin, Plus, CalendarPlus, Trash2, MessageCircle } from 'lucide-react';
import type { Person } from '../types/notebook';
import { DEFAULT_GROUPS, getAvatarGradient } from '../data/sampleData';
import { formatDateTime, getInitials } from '../utils/storage';
import { formatDaysForLang, getDaysSinceLastContact } from '../utils/dateReminders';
import { useLiveMinute } from '../utils/liveClock';
import { useI18n } from '../utils/LanguageContext';
import { translateGroupLabel } from '../utils/i18n';

interface ProfileCardProps {
  person: Person;
  defaultGroups?: string[];
  onRename: (newName: string) => void;
  onEditSubtitle: (newSubtitle: string) => void;
  onTogglePin: () => void;
  onChangeGroup: (group: string) => void;
  onChangeInterval: (days: number) => void;
  onOpenDossier: () => void;
  onOpenGreeting?: () => void;
  onOpenAddColumn: () => void;
  onOpenAddMeeting: () => void;
  onDeduplicate: () => void;
  onDeletePerson: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  person,
  defaultGroups,
  onRename,
  onEditSubtitle,
  onTogglePin,
  onChangeGroup,
  onChangeInterval,
  onOpenDossier,
  onOpenGreeting,
  onOpenAddColumn,
  onOpenAddMeeting,
  onDeduplicate,
  onDeletePerson,
}) => {
  const { lang, t } = useI18n();
  useLiveMinute();
  const groupOptions = Array.from(
    new Set([
      ...(defaultGroups && defaultGroups.length > 0 ? defaultGroups : DEFAULT_GROUPS),
      ...(person.group && person.group.trim() ? [person.group.trim()] : []),
    ])
  );
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
      className="pb-5 border-b flex flex-col gap-4"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-[220px] flex-1">
          <div
            className="w-11 h-11 rounded-lg text-white text-base font-semibold flex items-center justify-center shrink-0"
            style={{ backgroundColor: getAvatarGradient(person.colorId) }}
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
                  className="px-2 py-0.5 rounded-md border text-xl font-semibold outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-hover)',
                  }}
                />
              ) : (
                <h1
                  onClick={() => {
                    setNameDraft(person.name);
                    setEditingName(true);
                  }}
                  title={t.profileCard.renameTitle}
                  className="font-display text-[22px] font-semibold tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {person.name}
                </h1>
              )}
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
                className="mt-1 w-full max-w-md px-2 py-0.5 rounded-md border text-[13px] outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-hover)',
                }}
              />
            ) : (
              <p
                onClick={() => {
                  setSubDraft(person.subtitle);
                  setEditingSub(true);
                }}
                title={t.profileCard.editSubtitleTitle}
                className="text-[13px] mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: 'var(--text-secondary)' }}
              >
                {person.subtitle || t.profileCard.addSubtitlePlaceholder}
              </p>
            )}
          </div>
        </div>

        {/* Calm flat action row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenDossier}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <span>{t.profileCard.summaryBtn}</span>
          </button>

          {onOpenGreeting && (
            <button
              type="button"
              onClick={onOpenGreeting}
              title={t.profileCard.greetTitle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors hover:bg-[var(--bg-hover)]"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <MessageCircle className="w-3.5 h-3.5 opacity-70" />
              <span>{t.profileCard.greetBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddMeeting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <CalendarPlus className="w-3.5 h-3.5 opacity-70" />
            <span>{t.profileCard.contactBtn}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddColumn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <Plus className="w-3.5 h-3.5 opacity-70" />
            <span>{t.profileCard.sectionBtn}</span>
          </button>

          <button
            type="button"
            onClick={onDeduplicate}
            title={t.profileCard.dedupTitle}
            className="px-3 py-1.5 rounded-md border text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            {t.profileCard.dedupBtn}
          </button>

          <button
            type="button"
            onClick={onTogglePin}
            aria-label={person.isPinned ? t.profileCard.unpinAria : t.profileCard.pinAria}
            aria-pressed={Boolean(person.isPinned)}
            title={person.isPinned ? t.profileCard.unpinAria : t.profileCard.pinTitle}
            className="w-8 h-8 rounded-md border inline-flex items-center justify-center transition-colors hover:bg-[var(--bg-hover)] shrink-0"
            style={{
              backgroundColor: person.isPinned ? 'var(--bg-hover)' : 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: person.isPinned ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Pin className={`w-3.5 h-3.5 ${person.isPinned ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onDeletePerson}
            aria-label={t.profileCard.deleteAria(person.name)}
            title={t.profileCard.deleteTitle}
            className="w-8 h-8 rounded-md border inline-flex items-center justify-center transition-colors hover:bg-[var(--danger-bg)] shrink-0"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-muted)',
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Unboxed typographic metadata + inline group/interval controls */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <span className="tabular-nums">
          {t.profileCard.sectionsCount} <span style={{ color: 'var(--text-secondary)' }}>{person.columns.length}</span>
        </span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">
          {t.profileCard.factsCount} <span style={{ color: 'var(--text-secondary)' }}>{totalFacts}</span>
        </span>
        <span aria-hidden="true">·</span>
        <span>{t.profileCard.updatedLabel} {formatDateTime(person.updatedAt, lang)}</span>
        <span aria-hidden="true">·</span>

        <label className="inline-flex items-center gap-1.5">
          <span>{t.profileCard.groupLabel}</span>
          <select
            value={person.group || ''}
            onChange={(e) => onChangeGroup(e.target.value)}
            aria-label={t.profileCard.groupAria}
            className="px-1.5 py-0.5 rounded border text-xs outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">{t.groups.none}</option>
            {groupOptions.map((g) => (
              <option key={g} value={g}>
                {translateGroupLabel(g, lang)}
              </option>
            ))}
          </select>
        </label>

        <span aria-hidden="true">·</span>

        <label className="inline-flex items-center gap-1.5">
          <span>{t.profileCard.remindLabel}</span>
          <select
            value={String(threshold)}
            onChange={(e) => onChangeInterval(Number(e.target.value))}
            aria-label={t.profileCard.remindAria}
            className="px-1.5 py-0.5 rounded border text-xs outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="14">{t.profileCard.every14}</option>
            <option value="30">{t.profileCard.every30}</option>
            <option value="60">{t.profileCard.every60}</option>
            <option value="0">{t.profileCard.off}</option>
          </select>
        </label>

        {isOverdue && (
          <>
            <span aria-hidden="true">·</span>
            <span className="font-medium tabular-nums" style={{ color: 'var(--warning-text)' }}>
              {t.profileCard.noContactFor(formatDaysForLang(daysSince, lang))}
            </span>
          </>
        )}
      </div>
    </section>
  );
};
