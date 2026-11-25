import React, { useEffect, useRef } from 'react';
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
  BookUser,
  ShieldCheck,
} from 'lucide-react';
import type { CloudSyncStatus, Person, UpcomingDateReminder } from '../types/notebook';
import { getAvatarGradient, DEFAULT_GROUPS } from '../data/sampleData';
import { getInitials } from '../utils/storage';
import { getDaysSinceLastContact } from '../utils/dateReminders';
import { useLiveMinute } from '../utils/liveClock';
import { UpcomingRemindersBar } from './UpcomingRemindersBar';
import { PWAInstallButton } from './PWAInstallButton';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useI18n } from '../utils/LanguageContext';
import { translateGroupLabel } from '../utils/i18n';
import { useScrollLock } from '../utils/scrollLock';
import {
  createSwipeSession,
  evaluateSwipeEnd,
  evaluateSwipeMove,
  isMobileViewportWidth,
  shouldIgnoreSwipeTarget,
  type DrawerSwipeSession,
} from '../utils/swipeDrawer';
import {
  DRAWER_TRANSITION,
  FAST_TRANSITION,
  TAB_SPRING_TRANSITION,
  backdropVariants,
  containerOrchestratorVariants,
  drawerLeftVariants,
} from '../utils/motionPresets';

interface SidebarProps {
  people: Person[];
  activePersonId: string | null;
  reminders: UpcomingDateReminder[];
  searchQuery: string;
  selectedGroup: string;
  theme: 'dark' | 'light';
  accountLabel: string;
  isSignedIn: boolean;
  cloudStatus: CloudSyncStatus;
  pendingCount: number;
  isSyncing: boolean;
  activeEngine: 'gemini' | 'local';
  mobileOpen: boolean;
  onCloseMobile: () => void;
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
  onExportReminderCalendar?: (reminder: UpcomingDateReminder) => void;
  defaultGroups?: string[];
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  people,
  activePersonId,
  reminders,
  searchQuery,
  selectedGroup,
  theme,
  accountLabel,
  isSignedIn,
  cloudStatus,
  pendingCount,
  isSyncing,
  activeEngine,
  mobileOpen,
  onCloseMobile,
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
  onExportReminderCalendar,
  defaultGroups,
  isAdmin = false,
  onOpenAdminPanel,
}) => {
  const { lang, t } = useI18n();
  useLiveMinute();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const swipeSessionRef = useRef<DrawerSwipeSession | null>(null);
  const query = searchQuery.trim().toLowerCase();

  useScrollLock(mobileOpen);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    const handleResize = () => {
      if (!isMobileViewportWidth(window.innerWidth)) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileOpen, onCloseMobile]);

  const baseGroups =
    defaultGroups && defaultGroups.length > 0 ? defaultGroups : DEFAULT_GROUPS;
  const customGroups = Array.from(
    new Set(
      people
        .map((p) => (p.group || '').trim())
        .filter((g) => g && !baseGroups.includes(g))
    )
  );
  const groupTabs = ['Все', ...baseGroups, ...customGroups];

  const sortedPeople = [...people].sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return a.isPinned ? -1 : 1;
    }
    return 0;
  });

  const visiblePeople = sortedPeople.filter((person) => {
    if (selectedGroup !== 'Все') {
      const pGroup = (person.group || '').trim();
      if (pGroup !== selectedGroup) return false;
    }
    if (query) {
      const matchCount = countPersonMatches(person, query);
      if (matchCount === 0) return false;
    }
    return true;
  });

  const syncLabel =
    pendingCount > 0
      ? t.sidebar.syncUnsaved(pendingCount)
      : cloudStatus === 'online'
      ? t.sidebar.syncOnline
      : cloudStatus === 'connecting' || cloudStatus === 'pending'
      ? t.sidebar.syncPending
      : cloudStatus === 'error'
      ? t.sidebar.syncError
      : t.sidebar.syncOffline;

  const handlePersonClick = (id: string) => {
    onSelectPerson(id);
    onCloseMobile();
  };

  const handleDrawerTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (!mobileOpen || e.touches.length !== 1) return;
    const touch = e.touches[0];
    swipeSessionRef.current = createSwipeSession({
      clientX: touch.clientX,
      clientY: touch.clientY,
      now: Date.now(),
      isMobileViewport: isMobileViewportWidth(window.innerWidth),
      isDrawerOpen: true,
      hasBlockingOverlay: false,
      ignoreTarget: shouldIgnoreSwipeTarget(e.target),
    });
  };

  const handleDrawerTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    const session = swipeSessionRef.current;
    if (!session || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const decision = evaluateSwipeMove(session, {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    if (decision === 'close') {
      swipeSessionRef.current = null;
      onCloseMobile();
    } else if (decision === 'cancel') {
      swipeSessionRef.current = null;
    }
  };

  const handleDrawerTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    const session = swipeSessionRef.current;
    swipeSessionRef.current = null;
    if (!session || e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const result = evaluateSwipeEnd(session, {
      clientX: touch.clientX,
      clientY: touch.clientY,
      now: Date.now(),
    });
    if (result === 'close') {
      onCloseMobile();
    }
  };

  const renderSidebarContent = (isMobileDrawer: boolean) => (
    <div className="flex flex-col h-full">
      {/* Brand + Add person */}
      <div
        className="h-13 px-3.5 flex items-center justify-between gap-2 border-b shrink-0"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <BookUser className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />
          <span className="font-display text-[14px] font-semibold tracking-tight whitespace-nowrap truncate">
            {t.sidebar.brand}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              onOpenAddPerson();
              onCloseMobile();
            }}
            aria-label={t.sidebar.addContactAria}
            title={t.sidebar.addContactAria}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.sidebar.addContactBtn}</span>
          </button>

          {isMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label={t.sidebar.closeMenuAria}
              className="lg:hidden w-7 h-7 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search + Group filter */}
      <div className="p-3 space-y-2.5 border-b shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <div className="relative flex items-center">
          <Search
            className="w-3.5 h-3.5 absolute left-2.5 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            id={isMobileDrawer ? 'mobileSearchInput' : 'searchInput'}
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
            placeholder={t.sidebar.searchPlaceholder}
            aria-label={t.sidebar.searchAria}
            className="w-full pl-8 pr-7 py-1.5 rounded-md border text-[13px] outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: searchQuery ? 'var(--border-hover)' : 'var(--border-color)',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={t.sidebar.clearSearchAria}
              className="absolute right-1.5 p-0.5 rounded hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {people.length > 0 && (
          <LayoutGroup id={isMobileDrawer ? 'sidebar-tabs-mobile' : 'sidebar-tabs-desktop'}>
            <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label={t.sidebar.groupsAria}>
              {groupTabs.map((grp) => {
                const active = selectedGroup === grp;
                const count =
                  grp === 'Все'
                    ? people.length
                    : people.filter((p) => (p.group || '').trim() === grp).length;
                if (grp !== 'Все' && count === 0 && !baseGroups.includes(grp)) return null;
                return (
                  <button
                    key={grp}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onSelectGroup(grp)}
                    className="relative px-2 py-0.5 rounded text-[11.5px] font-medium whitespace-nowrap shrink-0 transition-colors"
                    style={{
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {active && (
                      <motion.span
                        layoutId={isMobileDrawer ? 'sidebarGroupMobile' : 'sidebarGroupDesktop'}
                        transition={TAB_SPRING_TRANSITION}
                        className="absolute inset-0 rounded"
                        style={{ backgroundColor: 'var(--bg-hover)' }}
                      />
                    )}
                    <span className="relative z-10">{translateGroupLabel(grp, lang)}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        )}
      </div>

      {/* Upcoming dates notice */}
      <UpcomingRemindersBar
        reminders={reminders}
        onSelectPerson={handlePersonClick}
        onExportCalendar={onExportReminderCalendar}
      />

      {/* Contacts list */}
      <nav
        className="flex-1 overflow-y-auto overscroll-contain px-2 py-2 thin-scrollbar"
        aria-label={t.sidebar.contactsNavAria}
      >
        {visiblePeople.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            {people.length === 0
              ? t.sidebar.emptyList
              : t.sidebar.noFilterMatches}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {visiblePeople.map((person) => {
              const isActive = person.id === activePersonId;
              const totalFacts = person.columns.reduce((sum, c) => sum + c.facts.length, 0);
              const matchCount = query ? countPersonMatches(person, query) : 0;
              const threshold = person.contactIntervalDays ?? 30;
              const daysInactive = getDaysSinceLastContact(person);
              const isOverdue = threshold > 0 && daysInactive >= threshold;

              return (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => handlePersonClick(person.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-left transition-colors ${
                      isActive
                        ? 'bg-[var(--bg-hover)] font-medium'
                        : 'hover:bg-[var(--bg-elevated)] font-normal'
                    }`}
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-6 h-6 rounded-md text-white text-[10px] font-semibold inline-flex items-center justify-center shrink-0"
                        style={{ backgroundColor: getAvatarGradient(person.colorId) }}
                      >
                        {getInitials(person.name)}
                      </span>
                      <span className="text-[13px] truncate">{person.name}</span>
                      {person.isPinned && (
                        <Pin
                          className="w-3 h-3 shrink-0 opacity-60"
                          aria-label={t.sidebar.pinnedAria}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[11px] tabular-nums">
                      {query && matchCount > 0 && (
                        <span style={{ color: 'var(--warning-text)' }}>
                          {matchCount} {t.sidebar.matchesSuffix}
                        </span>
                      )}
                      {isOverdue && (
                        <span
                          style={{ color: 'var(--warning-text)' }}
                          title={t.sidebar.overdueTitle(daysInactive)}
                        >
                          {t.sidebar.daysShort(daysInactive)}
                        </span>
                      )}
                      <span style={{ color: 'var(--text-muted)' }}>{totalFacts}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Bottom utilities */}
      <div
        className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t space-y-2 shrink-0"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <PWAInstallButton variant="sidebar" />

        <div className="flex items-center justify-between gap-2 text-[11.5px] px-1">
          <span style={{ color: 'var(--text-muted)' }}>
            {syncLabel} · {activeEngine === 'gemini' ? 'Gemini' : t.sidebar.engineLocal}
          </span>
          {isSignedIn && (
            <button
              type="button"
              onClick={onManualSync}
              disabled={isSyncing}
              title={t.sidebar.syncAria}
              aria-label={t.sidebar.syncAria}
              className="p-1 rounded hover:bg-[var(--bg-hover)] disabled:opacity-50"
              style={{
                color: pendingCount > 0 ? 'var(--warning-text)' : 'var(--text-secondary)',
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => {
              onOpenAccount();
              onCloseMobile();
            }}
            className="flex-1 min-w-0 inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium truncate hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title={t.sidebar.profileTitle}
          >
            <UserIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{accountLabel}</span>
          </button>

          <button
            type="button"
            onClick={onExportJson}
            aria-label={t.sidebar.exportAria}
            title={t.sidebar.exportTitle}
            className="w-7 h-7 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t.sidebar.importAria}
            title={t.sidebar.importTitle}
            className="w-7 h-7 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.vcf,application/json,text/vcard,text/x-vcard"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportJsonFile(file);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => {
              onOpenApiSettings();
              onCloseMobile();
            }}
            aria-label={t.sidebar.apiAria}
            title={t.sidebar.apiTitle}
            className="w-7 h-7 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {isAdmin && onOpenAdminPanel && (
            <button
              type="button"
              onClick={() => {
                onOpenAdminPanel();
                onCloseMobile();
              }}
              aria-label={t.sidebar.openAdminAria}
              title={t.sidebar.openAdminTitle}
              className="w-7 h-7 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors shrink-0"
              style={{ color: 'var(--success-text)' }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? t.sidebar.lightTheme : t.sidebar.darkTheme}
            title={theme === 'dark' ? t.sidebar.lightTheme : t.sidebar.darkTheme}
            className="w-7 h-7 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-[272px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen border-r"
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderColor: 'var(--border-color)',
        }}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile slide-over drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-sidebar-drawer"
            variants={containerOrchestratorVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onTouchStart={handleDrawerTouchStart}
            onTouchMove={handleDrawerTouchMove}
            onTouchEnd={handleDrawerTouchEnd}
            onTouchCancel={() => {
              swipeSessionRef.current = null;
            }}
            className="fixed inset-0 z-50 lg:hidden flex overscroll-contain touch-pan-y"
            role="dialog"
            aria-modal="true"
            aria-label={t.sidebar.mobileNavAria}
          >
            <motion.div
              variants={backdropVariants}
              transition={FAST_TRANSITION}
              className="fixed inset-0 bg-black/60 backdrop-blur-[1px] overscroll-contain"
              onClick={onCloseMobile}
            />
            <motion.aside
              variants={drawerLeftVariants}
              transition={DRAWER_TRANSITION}
              className="relative z-10 w-[284px] max-w-[85vw] h-dvh max-h-dvh border-r flex flex-col shadow-2xl overscroll-contain"
              style={{
                backgroundColor: 'var(--bg-sidebar)',
                borderColor: 'var(--border-color)',
              }}
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
