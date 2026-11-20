import React, { useRef } from 'react';
import {
  Download,
  Upload,
  Settings,
  Sun,
  Moon,
  Search,
  X,
  RefreshCw,
  Pin,
  Plus,
  User as UserIcon,
} from 'lucide-react';
import type { CloudSyncStatus, Person } from '../types/notebook';
import { getAvatarGradient, DEFAULT_GROUPS } from '../data/sampleData';
import { getInitials } from '../utils/storage';
import { getDaysSinceLastContact } from '../utils/dateReminders';

interface HeaderProps {
  people: Person[];
  activePersonId: string | null;
  searchQuery: string;
  selectedGroup: string;
  theme: 'dark' | 'light';
  accountLabel: string;
  isSignedIn: boolean;
  cloudStatus: CloudSyncStatus;
  pendingCount: number;
  isSyncing: boolean;
  activeEngine: 'gemini' | 'local';
  onSelectPerson: (id: string) => void;
  onSearchChange: (q: string) => void;
  onSelectGroup: (group: string) => void;
  onOpenAddPerson: () => void;
  onOpenAccount: () => void;
  onOpenApiSettings: () => void;
  onToggleTheme: () => void;
  onExportJson: () => void;
  onImportJsonFile: (file: File) => void;
  onManualSync: () => void;
}

function countPersonMatches(person: Person, query: string): number {
  if (!query) return 0;
  let matches = 0;
  if (
    person.name.toLowerCase().includes(query) ||
    (person.subtitle && person.subtitle.toLowerCase().includes(query))
  ) {
    matches++;
  }
  person.columns.forEach((col) => {
    if (col.title.toLowerCase().includes(query)) matches++;
    col.facts.forEach((f) => {
      if (f.text.toLowerCase().includes(query)) matches++;
    });
  });
  return matches;
}

export const Header: React.FC<HeaderProps> = ({
  people,
  activePersonId,
  searchQuery,
  selectedGroup,
  theme,
  accountLabel,
  isSignedIn,
  cloudStatus,
  pendingCount,
  isSyncing,
  activeEngine,
  onSelectPerson,
  onSearchChange,
  onSelectGroup,
  onOpenAddPerson,
  onOpenAccount,
  onOpenApiSettings,
  onToggleTheme,
  onExportJson,
  onImportJsonFile,
  onManualSync,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const query = searchQuery.trim().toLowerCase();

  // Gather unique groups from defaults + people
  const customGroups = Array.from(
    new Set(
      people
        .map((p) => (p.group || '').trim())
        .filter((g) => g && !DEFAULT_GROUPS.includes(g))
    )
  );
  const groupTabs = ['Все', ...DEFAULT_GROUPS, ...customGroups];

  // Sort pinned people first, preserve relative order otherwise
  const sortedPeople = [...people].sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return a.isPinned ? -1 : 1;
    }
    return 0;
  });

  const visiblePeople = sortedPeople.filter((person) => {
    const isActive = person.id === activePersonId;
    if (selectedGroup !== 'Все') {
      const pGroup = (person.group || '').trim();
      if (pGroup !== selectedGroup) return false;
    }
    if (query) {
      const matchCount = countPersonMatches(person, query);
      if (!isActive && matchCount === 0) return false;
    }
    return true;
  });

  const syncLabel =
    pendingCount > 0
      ? `Не сохранено (${pendingCount})`
      : cloudStatus === 'online'
      ? 'Синхронизировано'
      : cloudStatus === 'connecting' || cloudStatus === 'pending'
      ? 'Синхронизация...'
      : cloudStatus === 'error'
      ? 'Ошибка облака'
      : 'Локальный режим';

  const syncColorStyle =
    pendingCount > 0 || cloudStatus === 'pending' || cloudStatus === 'connecting'
      ? {
          backgroundColor: 'var(--warning-bg)',
          color: 'var(--warning-text)',
          borderColor: 'var(--warning-border)',
        }
      : cloudStatus === 'online'
      ? {
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success-text)',
          borderColor: 'var(--success-border)',
        }
      : {
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger-text)',
          borderColor: 'var(--danger-border)',
        };

  return (
    <header
      className="md:sticky md:top-0 z-30 border-b backdrop-blur-md"
      style={{
        backgroundColor: 'var(--bg-header)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-[1240px] mx-auto px-4">
        <div className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-3 py-2.5">
          {/* Brand + Sync status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-[11px] text-white flex items-center justify-center text-lg shrink-0 shadow-md"
              style={{ background: 'var(--accent-gradient)' }}
              aria-hidden="true"
            >
              🧠
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-[16px] font-bold tracking-tight whitespace-nowrap">
                  Умный блокнот о людях
                </span>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap"
                  style={syncColorStyle}
                  title="Статус синхронизации с облаком Firebase"
                >
                  {syncLabel}
                </span>
                {isSignedIn && (
                  <button
                    type="button"
                    onClick={onManualSync}
                    disabled={isSyncing}
                    title="Принудительно синхронизировать данные с облаком"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-colors hover:brightness-110 disabled:opacity-60 whitespace-nowrap"
                    style={{
                      backgroundColor: pendingCount > 0 ? 'var(--warning-bg)' : 'var(--bg-surface)',
                      borderColor: pendingCount > 0 ? 'var(--warning-border)' : 'var(--border-color)',
                      color: pendingCount > 0 ? 'var(--warning-text)' : 'var(--text-secondary)',
                    }}
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Синхронизировать сейчас</span>
                  </button>
                )}
              </div>
              <p className="hidden lg:block text-[11.5px] truncate" style={{ color: 'var(--text-secondary)' }}>
                Личный облачный блокнот без дублей, напоминания о датах и хронология встреч
              </p>
            </div>
          </div>

          {/* Right tools */}
          <div className="flex flex-wrap xl:flex-nowrap items-center gap-1.5 max-w-full min-w-0">
            <button
              type="button"
              onClick={onOpenAccount}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'rgba(124, 58, 237, 0.35)',
                color: 'var(--accent-text)',
              }}
              title="Управление аккаунтом, привязка Email и выход"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{accountLabel}</span>
            </button>

            <span
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11.5px] font-semibold whitespace-nowrap"
              style={{
                backgroundColor:
                  activeEngine === 'gemini' ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                borderColor:
                  activeEngine === 'gemini' ? 'rgba(124, 58, 237, 0.3)' : 'var(--border-color)',
                color: activeEngine === 'gemini' ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              {activeEngine === 'gemini' ? '⚡ Gemini AI' : '🧠 Локальный ИИ'}
            </span>

            {/* Search input with readonly anti-autofill trick */}
            <div className="relative flex items-center">
              <Search
                className="w-3.5 h-3.5 absolute left-2.5 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                id="searchInput"
                type="search"
                name="notebook_filter_query"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                readOnly
                onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Поиск по людям и фактам..."
                className="w-[150px] sm:w-[175px] focus:w-[205px] pl-8 pr-7 py-1.5 rounded-xl border text-[13px] outline-none transition-all"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: searchQuery ? 'var(--accent)' : 'var(--border-color)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Очистить поиск"
                  className="absolute right-2 p-0.5 rounded hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onExportJson}
              aria-label="Экспорт JSON"
              title="Скачать резервную копию (JSON)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Экспорт</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Импорт JSON"
              title="Загрузить резервную копию (JSON)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Импорт</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportJsonFile(file);
                e.target.value = '';
              }}
            />

            <button
              type="button"
              onClick={onOpenApiSettings}
              title="Настройки Gemini API"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Настройки ИИ</span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Переключить тему"
              title="Переключить тему"
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl border transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Group filter strip */}
        {people.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 thin-scrollbar">
            <span className="text-[11px] font-semibold mr-1 shrink-0" style={{ color: 'var(--text-muted)' }}>
              Группы:
            </span>
            {groupTabs.map((grp) => {
              const active = selectedGroup === grp;
              const count =
                grp === 'Все'
                  ? people.length
                  : people.filter((p) => (p.group || '').trim() === grp).length;
              if (grp !== 'Все' && count === 0 && !DEFAULT_GROUPS.includes(grp)) return null;
              return (
                <button
                  key={grp}
                  type="button"
                  onClick={() => onSelectGroup(grp)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
                    color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                    border: active
                      ? '1px solid rgba(124, 58, 237, 0.35)'
                      : '1px solid transparent',
                  }}
                >
                  {grp} {count > 0 ? <span className="opacity-70 tabular-nums">({count})</span> : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* People tabs bar */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-3 pt-0.5 thin-scrollbar" aria-label="Вкладки людей">
          <div className="flex items-center gap-2">
            {visiblePeople.map((person) => {
              const isActive = person.id === activePersonId;
              const totalFacts = person.columns.reduce((sum, c) => sum + c.facts.length, 0);
              const matchCount = query ? countPersonMatches(person, query) : 0;
              const threshold = person.contactIntervalDays ?? 30;
              const daysInactive = getDaysSinceLastContact(person);
              const isOverdue = threshold > 0 && daysInactive >= threshold;

              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => onSelectPerson(person.id)}
                  className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] whitespace-nowrap shrink-0 border transition-all ${
                    isActive ? 'font-semibold shadow-sm' : 'font-medium hover:opacity-90'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                    borderColor: isActive ? 'var(--border-hover)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {person.isPinned && (
                    <Pin className="w-3 h-3 shrink-0 text-amber-400 fill-amber-400" aria-label="Закреплено" />
                  )}
                  <span
                    className="w-6 h-6 rounded-lg text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0"
                    style={{ background: getAvatarGradient(person.colorId) }}
                  >
                    {getInitials(person.name)}
                  </span>
                  <span>{person.name}</span>
                  <span
                    className="text-[11px] px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{
                      backgroundColor: isActive ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                      color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                    }}
                  >
                    {totalFacts}
                  </span>
                  {isOverdue && (
                    <span
                      className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums"
                      style={{
                        backgroundColor: 'var(--warning-bg)',
                        color: 'var(--warning-text)',
                      }}
                      title={`Давно не общались: ${daysInactive} дн.`}
                    >
                      ⏳ {daysInactive}д
                    </span>
                  )}
                  {query && matchCount > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border tabular-nums"
                      style={{
                        backgroundColor: 'var(--warning-bg)',
                        color: 'var(--warning-text)',
                        borderColor: 'var(--warning-border)',
                      }}
                    >
                      🔍 {matchCount}
                    </span>
                  )}
                  {isActive && (
                    <span
                      className="absolute bottom-[-1px] left-3.5 right-3.5 h-[2px] rounded-full"
                      style={{ background: 'var(--accent-gradient)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenAddPerson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 border border-dashed transition-colors hover:brightness-110"
            style={{
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent-text)',
              borderColor: 'rgba(124, 58, 237, 0.45)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить человека</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
