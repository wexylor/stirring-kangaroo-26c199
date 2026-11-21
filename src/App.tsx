import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@firebase/auth';
import { Menu, Plus, X, Sun, Moon } from 'lucide-react';
import type {
  AnalysisReport,
  CloudSyncStatus,
  DossierData,
  FactHistoryEntry,
  MeetingEntry,
  MeetingType,
  Person,
  ToastItem,
  UpcomingDateReminder,
} from './types/notebook';
import {
  computeLatestContactIso,
  getEffectiveApiKey,
  normalizePeople,
  safeStorage,
  STORAGE_API_KEY,
  STORAGE_DATA_PREFIX,
  STORAGE_LANG_KEY,
  STORAGE_PENDING_PREFIX,
  STORAGE_TAB_PREFIX,
  STORAGE_THEME_KEY,
  uid,
} from './utils/storage';
import {
  detectDeviceLanguage,
  detectDeviceTheme,
  type AppLang,
  type AppTheme,
} from './utils/preferences';
import { LanguageProvider } from './utils/LanguageContext';
import { getTranslations } from './utils/i18n';
import {
  analyzeTextLocally,
  buildDossierLocally,
  buildLocalAdvisorAnswer,
  deduplicatePersonFacts,
  findFactRelationAcrossPerson,
  type AnalysisResultPayload,
} from './utils/semantics';
import { getUpcomingReminders } from './utils/dateReminders';
import {
  downloadIcsEvent,
  extractExportableDateFromFact,
  isAnnualEventFact,
} from './utils/calendarExport';
import { createDefaultSampleState, DEMO_SAMPLE_TEXT } from './data/sampleData';
import {
  deletePersonFromCloud,
  getUserDisplayLabel,
  isSyntheticLoginEmail,
  logoutFromFirebase,
  reloadFirebaseUser,
  savePersonToCloud,
  subscribeAuthChanges,
  subscribeUserPeople,
  syncPeopleMapToCloud,
  updateUserProfileInCloud,
} from './services/firebase';
import {
  analyzeTextWithGemini,
  askAdvisorWithGemini,
  buildDossierWithGemini,
  formatGeminiFallbackReason,
} from './services/gemini';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { ProfileCard } from './components/ProfileCard';
import { AnalyzerCard } from './components/AnalyzerCard';
import { ColumnsGrid } from './components/ColumnsGrid';
import { MeetingsTimeline } from './components/MeetingsTimeline';
import { RawNotesHistory } from './components/RawNotesHistory';
import { OfflineIndicator } from './components/PWAInstallButton';
import {
  AccountModal,
  AddColumnModal,
  AddMeetingModal,
  AddPersonModal,
  ApiSettingsModal,
  ConfirmModal,
  SummaryModal,
} from './components/Modals';

interface PendingSyncQueue {
  upsertIds: string[];
  deleteIds: string[];
}

function readPendingQueue(scopeId: string): PendingSyncQueue {
  try {
    const raw = safeStorage.getItem(STORAGE_PENDING_PREFIX + scopeId);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PendingSyncQueue>;
      return {
        upsertIds: Array.isArray(parsed.upsertIds) ? parsed.upsertIds : [],
        deleteIds: Array.isArray(parsed.deleteIds) ? parsed.deleteIds : [],
      };
    }
  } catch {
    // ignore
  }
  return { upsertIds: [], deleteIds: [] };
}

function writePendingQueue(scopeId: string, queue: PendingSyncQueue) {
  safeStorage.setItem(STORAGE_PENDING_PREFIX + scopeId, JSON.stringify(queue));
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authRevision, setAuthRevision] = useState(0);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('autostart') === '1';
    }
    return false;
  });

  const [theme, setTheme] = useState<AppTheme>(() =>
    detectDeviceTheme(safeStorage.getItem(STORAGE_THEME_KEY))
  );
  const [hasManualTheme, setHasManualTheme] = useState<boolean>(() => {
    const saved = safeStorage.getItem(STORAGE_THEME_KEY);
    return saved === 'light' || saved === 'dark';
  });

  const [lang, setLang] = useState<AppLang>(() =>
    detectDeviceLanguage(safeStorage.getItem(STORAGE_LANG_KEY))
  );
  const t = useMemo(() => getTranslations(lang), [lang]);
  const tRef = useRef(t);
  tRef.current = t;

  const [people, setPeople] = useState<Person[]>([]);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Все');
  const [draftText, setDraftText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastReport, setLastReport] = useState<AnalysisReport | null>(null);
  const [advisorQuery, setAdvisorQuery] = useState('');
  const [advisorAnswer, setAdvisorAnswer] = useState('');
  const [isAskingAdvisor, setIsAskingAdvisor] = useState(false);

  const [activeEngine, setActiveEngine] = useState<'gemini' | 'local'>(() =>
    getEffectiveApiKey() ? 'gemini' : 'local'
  );
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('local');
  const [pendingQueue, setPendingQueue] = useState<PendingSyncQueue>({
    upsertIds: [],
    deleteIds: [],
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [accountOpen, setAccountOpen] = useState(false);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [addMeetingOpen, setAddMeetingOpen] = useState(false);
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryMode, setSummaryMode] = useState<'single' | 'all'>('single');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<DossierData | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const cloudUnsubRef = useRef<(() => void) | null>(null);
  const peopleRef = useRef<Person[]>([]);
  peopleRef.current = people;
  const pendingRef = useRef<PendingSyncQueue>(pendingQueue);
  pendingRef.current = pendingQueue;

  const showToast = useCallback(
    (message: string, type: ToastItem['type'] = 'info') => {
      const id = uid('toast');
      setToasts((prev) => [...prev.slice(-1), { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    root.setAttribute('data-theme', theme);
    void root.offsetHeight;
    root.classList.remove('theme-switching');
  }, [theme]);

  useEffect(() => {
    if (hasManualTheme || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'light' : 'dark');
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [hasManualTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: AppTheme = prev === 'dark' ? 'light' : 'dark';
      setHasManualTheme(true);
      safeStorage.setItem(STORAGE_THEME_KEY, next);
      return next;
    });
  }, []);

  const handleChangeLanguage = useCallback((nextLang: AppLang) => {
    setLang(nextLang);
    safeStorage.setItem(STORAGE_LANG_KEY, nextLang);
  }, []);

  const currentScope = currentUser?.uid || 'guest';

  const loadLocalScope = useCallback((scopeId: string) => {
    const dataKey = STORAGE_DATA_PREFIX + scopeId;
    const tabKey = STORAGE_TAB_PREFIX + scopeId;
    const savedTab = safeStorage.getItem(tabKey);
    setPendingQueue(readPendingQueue(scopeId));
    setDraftText('');
    setLastReport(null);
    setAdvisorQuery('');
    setAdvisorAnswer('');
    setSearchQuery('');
    setSelectedGroup('Все');

    try {
      const raw = safeStorage.getItem(dataKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          activePersonId?: string;
          people?: unknown;
        };
        if (parsed && Array.isArray(parsed.people)) {
          const norm = normalizePeople(parsed.people);
          setPeople(norm);
          const validTab =
            savedTab && norm.some((p) => p.id === savedTab)
              ? savedTab
              : parsed.activePersonId && norm.some((p) => p.id === parsed.activePersonId)
              ? parsed.activePersonId
              : norm[0]?.id || null;
          setActivePersonId(validTab);
          return;
        }
      }
    } catch {
      // Fallback
    }

    if (scopeId === 'guest') {
      const sample = createDefaultSampleState();
      setPeople(sample.people);
      setActivePersonId(sample.activePersonId);
    } else {
      setPeople([]);
      setActivePersonId(null);
    }
  }, []);

  const persistLocalSnapshot = useCallback(
    (nextPeople: Person[], nextActiveId: string | null, scopeId: string) => {
      if (nextActiveId) {
        safeStorage.setItem(STORAGE_TAB_PREFIX + scopeId, nextActiveId);
      }
      safeStorage.setItem(
        STORAGE_DATA_PREFIX + scopeId,
        JSON.stringify({
          activePersonId: nextActiveId,
          people: nextPeople,
        })
      );
    },
    []
  );

  // Sync a single modified person to Firebase (targeted write, never overwriting other people!)
  const pushPersonUpdate = useCallback(
    async (person: Person, uidStr: string) => {
      setCloudStatus('pending');
      try {
        await savePersonToCloud(uidStr, person);
        setPendingQueue((prev) => {
          const next: PendingSyncQueue = {
            upsertIds: prev.upsertIds.filter((id) => id !== person.id),
            deleteIds: prev.deleteIds.filter((id) => id !== person.id),
          };
          writePendingQueue(uidStr, next);
          return next;
        });
        setCloudStatus('online');
      } catch {
        setPendingQueue((prev) => {
          const next: PendingSyncQueue = {
            upsertIds: prev.upsertIds.includes(person.id)
              ? prev.upsertIds
              : [...prev.upsertIds, person.id],
            deleteIds: prev.deleteIds.filter((id) => id !== person.id),
          };
          writePendingQueue(uidStr, next);
          return next;
        });
        setCloudStatus('error');
        showToast(tRef.current.toasts.syncLocalNotice, 'warning');
      }
    },
    [showToast]
  );

  const pushPersonDelete = useCallback(
    async (personId: string, uidStr: string) => {
      setCloudStatus('pending');
      try {
        await deletePersonFromCloud(uidStr, personId);
        setPendingQueue((prev) => {
          const next: PendingSyncQueue = {
            upsertIds: prev.upsertIds.filter((id) => id !== personId),
            deleteIds: prev.deleteIds.filter((id) => id !== personId),
          };
          writePendingQueue(uidStr, next);
          return next;
        });
        setCloudStatus('online');
      } catch {
        setPendingQueue((prev) => {
          const next: PendingSyncQueue = {
            upsertIds: prev.upsertIds.filter((id) => id !== personId),
            deleteIds: prev.deleteIds.includes(personId)
              ? prev.deleteIds
              : [...prev.deleteIds, personId],
          };
          writePendingQueue(uidStr, next);
          return next;
        });
        setCloudStatus('error');
        showToast(tRef.current.toasts.deleteLocalNotice, 'warning');
      }
    },
    [showToast]
  );

  const handleManualSync = useCallback(async () => {
    if (!currentUser || isSyncing) return;
    const uidStr = currentUser.uid;
    setIsSyncing(true);
    setCloudStatus('pending');

    try {
      const q = pendingRef.current;
      const latestPeople = peopleRef.current;

      if (q.upsertIds.length === 0 && q.deleteIds.length === 0) {
        // Full idempotent sync of current map
        await syncPeopleMapToCloud(uidStr, latestPeople);
      } else {
        for (const pId of q.upsertIds) {
          const target = latestPeople.find((p) => p.id === pId);
          if (target) {
            await savePersonToCloud(uidStr, target);
          }
        }
        for (const delId of q.deleteIds) {
          await deletePersonFromCloud(uidStr, delId);
        }
      }

      const emptyQ: PendingSyncQueue = { upsertIds: [], deleteIds: [] };
      setPendingQueue(emptyQ);
      writePendingQueue(uidStr, emptyQ);
      setCloudStatus('online');
      showToast(tRef.current.toasts.syncSuccess, 'success');
    } catch {
      setCloudStatus('error');
      showToast(tRef.current.toasts.syncError, 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, isSyncing, showToast]);

  const handleRefreshAccountStatus = useCallback(async () => {
    if (!currentUser) return null;
    const res = await reloadFirebaseUser(currentUser);
    setAuthRevision((v) => v + 1);
    if (!res.requiresRelogin) {
      updateUserProfileInCloud(currentUser).catch(() => {});
    }
    return res;
  }, [currentUser]);

  // Auth & RTDB subscription
  useEffect(() => {
    let unsubAuth: (() => void) | null = null;
    try {
      unsubAuth = subscribeAuthChanges((user) => {
        setAuthLoading(false);
        setCurrentUser(user || null);

        if (cloudUnsubRef.current) {
          cloudUnsubRef.current();
          cloudUnsubRef.current = null;
        }

        if (user) {
          setIsGuestMode(false);
          const uidStr = user.uid;
          loadLocalScope(uidStr);
          setCloudStatus('connecting');
          updateUserProfileInCloud(user).catch(() => {});

          if (!user.emailVerified || isSyntheticLoginEmail(user.email)) {
            reloadFirebaseUser(user)
              .then((res) => {
                if (!res.requiresRelogin) {
                  setAuthRevision((v) => v + 1);
                  updateUserProfileInCloud(user).catch(() => {});
                }
              })
              .catch(() => {});
          }

          let firstSnapshot = true;
          cloudUnsubRef.current = subscribeUserPeople(
            uidStr,
            (cloudPeople, hadData) => {
              const q = pendingRef.current;
              const localPeople = peopleRef.current;

              // Merge cloud snapshot without clobbering local pending unsynced edits!
              let merged: Person[];
              if (!hadData && firstSnapshot && localPeople.length > 0) {
                merged = localPeople;
                syncPeopleMapToCloud(uidStr, localPeople).catch(() => {});
              } else {
                const cloudById = new Map(cloudPeople.map((p) => [p.id, p]));
                const localById = new Map(localPeople.map((p) => [p.id, p]));

                const mergedMap = new Map<string, Person>();
                for (const cp of cloudPeople) {
                  if (q.deleteIds.includes(cp.id)) continue;
                  if (q.upsertIds.includes(cp.id) && localById.has(cp.id)) {
                    mergedMap.set(cp.id, localById.get(cp.id)!);
                  } else {
                    mergedMap.set(cp.id, cp);
                  }
                }
                for (const pid of q.upsertIds) {
                  if (!mergedMap.has(pid) && localById.has(pid)) {
                    mergedMap.set(pid, localById.get(pid)!);
                  }
                }
                merged = Array.from(mergedMap.values());
              }

              firstSnapshot = false;
              setPeople(merged);
              setActivePersonId((prevId) => {
                const nextId =
                  prevId && merged.some((p) => p.id === prevId)
                    ? prevId
                    : merged[0]?.id || null;
                persistLocalSnapshot(merged, nextId, uidStr);
                return nextId;
              });

              const hasPending =
                pendingRef.current.upsertIds.length > 0 ||
                pendingRef.current.deleteIds.length > 0;
              setCloudStatus(hasPending ? 'pending' : 'online');
            },
            () => {
              setCloudStatus('error');
              showToast(
                'Нет доступа к ветке пользователя в Firebase. Проверьте правила Realtime Database.',
                'error'
              );
            }
          );
        } else if (isGuestMode) {
          setCloudStatus('local');
          loadLocalScope('guest');
        } else {
          setPeople([]);
          setActivePersonId(null);
          setCloudStatus('local');
        }
      });
    } catch (err) {
      setAuthLoading(false);
      setAuthError(
        `Не удалось инициализировать Firebase (${err instanceof Error ? err.message : 'ошибка'}). Вы можете продолжить локально.`
      );
    }

    return () => {
      if (unsubAuth) unsubAuth();
      if (cloudUnsubRef.current) cloudUnsubRef.current();
    };
  }, [isGuestMode, loadLocalScope, persistLocalSnapshot, showToast]);

  const activePerson = useMemo(
    () => people.find((p) => p.id === activePersonId) || null,
    [people, activePersonId]
  );

  const upcomingReminders = useMemo(() => getUpcomingReminders(people, 30), [people]);

  const updateSinglePerson = useCallback(
    (personId: string, updater: (p: Person) => Person) => {
      let updatedPerson: Person | null = null;
      setPeople((prev) => {
        const next = prev.map((p) => {
          if (p.id !== personId) return p;
          updatedPerson = updater(p);
          return updatedPerson;
        });
        persistLocalSnapshot(next, activePersonId, currentScope);
        return next;
      });
      if (updatedPerson && currentUser) {
        pushPersonUpdate(updatedPerson, currentUser.uid);
      }
    },
    [activePersonId, currentScope, currentUser, persistLocalSnapshot, pushPersonUpdate]
  );

  const handleSelectPerson = useCallback(
    (id: string) => {
      if (id === activePersonId) return;
      setActivePersonId(id);
      safeStorage.setItem(STORAGE_TAB_PREFIX + currentScope, id);
      setDraftText('');
      setLastReport(null);
      setAdvisorQuery('');
      setAdvisorAnswer('');
    },
    [activePersonId, currentScope]
  );

  const handleCreatePerson = (
    name: string,
    subtitle: string,
    colorId: string,
    group: string
  ) => {
    const nowIso = new Date().toISOString();
    const newPerson: Person = {
      id: uid('person'),
      name,
      subtitle: subtitle || t.common.personalCard,
      colorId,
      group,
      isPinned: false,
      contactIntervalDays: 30,
      updatedAt: nowIso,
      lastContactAt: nowIso,
      columns: [
        { id: uid('col'), title: 'Нравится', icon: '❤️', isNew: false, facts: [] },
        { id: uid('col'), title: 'Не нравится', icon: '👎', isNew: false, facts: [] },
        { id: uid('col'), title: 'Увлечения', icon: '🎯', isNew: false, facts: [] },
      ],
      rawNotes: [],
      meetings: [],
    };

    const nextPeople = [...people, newPerson];
    setPeople(nextPeople);
    setActivePersonId(newPerson.id);
    setDraftText('');
    setLastReport(null);
    setAdvisorQuery('');
    setAdvisorAnswer('');
    persistLocalSnapshot(nextPeople, newPerson.id, currentScope);
    if (currentUser) {
      pushPersonUpdate(newPerson, currentUser.uid);
    }
    setAddPersonOpen(false);
    showToast(t.toasts.tabCreated(name), 'success');
  };

  const handleDeletePerson = (person: Person) => {
    setConfirmState({
      open: true,
      title: t.toasts.deleteTabTitle(person.name),
      message: t.toasts.deleteTabMsg,
      onConfirm: () => {
        const nextPeople = people.filter((p) => p.id !== person.id);
        const nextActive = nextPeople[0]?.id || null;
        setPeople(nextPeople);
        setActivePersonId(nextActive);
        setLastReport(null);
        setAdvisorAnswer('');
        persistLocalSnapshot(nextPeople, nextActive, currentScope);
        if (currentUser) {
          pushPersonDelete(person.id, currentUser.uid);
        }
        showToast(t.toasts.tabDeleted(person.name), 'info');
      },
    });
  };

  const handleAddColumn = (title: string, icon: string) => {
    if (!activePerson) return;
    if (
      activePerson.columns.some(
        (c) => c.title.toLowerCase() === title.toLowerCase()
      )
    ) {
      showToast(t.toasts.colExists, 'warning');
      return;
    }

    updateSinglePerson(activePerson.id, (p) => ({
      ...p,
      updatedAt: new Date().toISOString(),
      columns: [
        ...p.columns,
        { id: uid('col'), title, icon, isNew: true, facts: [] },
      ],
    }));
    setAddColumnOpen(false);
    showToast(t.toasts.colAdded(title), 'success');
  };

  const handleAddMeeting = (date: string, type: MeetingType, summary: string) => {
    if (!activePerson) return;
    const nowIso = new Date().toISOString();
    const newEntry: MeetingEntry = {
      id: uid('meet'),
      date,
      type,
      summary,
      createdAt: nowIso,
    };

    updateSinglePerson(activePerson.id, (p) => {
      const nextMeetings = [newEntry, ...(p.meetings || [])].sort((a, b) =>
        b.date.localeCompare(a.date)
      );
      return {
        ...p,
        updatedAt: nowIso,
        meetings: nextMeetings,
        lastContactAt: computeLatestContactIso({
          meetings: nextMeetings,
          rawNotes: p.rawNotes,
          lastContactAt: p.lastContactAt,
          updatedAt: nowIso,
        }),
      };
    });
    setAddMeetingOpen(false);
    showToast(t.toasts.meetingSaved, 'success');
  };

  const handleDeleteMeeting = (meetingId: string) => {
    if (!activePerson) return;
    updateSinglePerson(activePerson.id, (p) => {
      const nextMeetings = (p.meetings || []).filter((m) => m.id !== meetingId);
      return {
        ...p,
        updatedAt: new Date().toISOString(),
        meetings: nextMeetings,
        lastContactAt: computeLatestContactIso({
          meetings: nextMeetings,
          rawNotes: p.rawNotes,
          updatedAt: p.updatedAt,
        }),
      };
    });
    showToast(t.toasts.meetingDeleted, 'info');
  };

  const handleAnalyzeText = async () => {
    if (!activePerson || isAnalyzing) return;
    const rawText = draftText.trim();
    if (!rawText) {
      showToast(t.toasts.enterText, 'warning');
      return;
    }

    setIsAnalyzing(true);
    const snapshotBefore: Person = JSON.parse(JSON.stringify(activePerson));
    let result: AnalysisResultPayload;
    let engineUsed: 'gemini' | 'local' = 'gemini';
    let usedFallback = false;
    let fallbackReason = '';

    try {
      if (!navigator.onLine) {
        throw new Error('OFFLINE');
      }
      if (!getEffectiveApiKey()) {
        throw new Error('NO_API_KEY');
      }
      result = await analyzeTextWithGemini(activePerson, rawText, people);
      engineUsed = 'gemini';
    } catch (err) {
      engineUsed = 'local';
      const reasonMsg = formatGeminiFallbackReason(err, lang);
      // Show explicit fallback toast if user expected Gemini (had API key or hit network/timeout)
      if (err instanceof Error && err.message !== 'NO_API_KEY') {
        usedFallback = true;
        fallbackReason = reasonMsg;
        showToast(reasonMsg, 'warning');
      }
      result = analyzeTextLocally(activePerson, rawText, people, lang);
    }

    setActiveEngine(engineUsed);

    const nowIso = new Date().toISOString();
    const updatedPerson: Person = JSON.parse(JSON.stringify(activePerson));
    updatedPerson.columns.forEach((col) => {
      col.isNew = false;
      col.facts.forEach((f) => {
        f.isNew = false;
      });
    });

    if (result.suggestedSubtitle && result.suggestedSubtitle.trim()) {
      updatedPerson.subtitle = result.suggestedSubtitle.trim();
    }

    let factsAdded = 0;
    let newColsCount = 0;
    let inferencesCount = 0;
    let updatedCount = 0;
    let duplicatesSkipped = 0;

    if (Array.isArray(result.updates)) {
      result.updates.forEach((upd) => {
        if (!upd || !upd.columnTitle || !Array.isArray(upd.facts)) return;
        const title = upd.columnTitle.trim();
        if (!title) return;

        let targetCol = updatedPerson.columns.find(
          (c) => c.title.trim().toLowerCase() === title.toLowerCase()
        );

        let createdNow = false;
        if (!targetCol) {
          targetCol = {
            id: uid('col'),
            title,
            icon: upd.icon || '✨',
            isNew: true,
            facts: [],
          };
          updatedPerson.columns.push(targetCol);
          createdNow = true;
          newColsCount++;
        }

        let addedInCol = 0;
        upd.facts.forEach((rawFactItem) => {
          const cleanFact = String(rawFactItem?.text || '').trim();
          if (!cleanFact) return;

          const tag =
            rawFactItem.tag === 'ai_inference' || rawFactItem.tag === 'updated'
              ? rawFactItem.tag
              : 'fact';
          const reasonStr = String(rawFactItem.reason || '').trim();
          const relation = findFactRelationAcrossPerson(
            updatedPerson,
            cleanFact,
            rawFactItem.replacesOldFact || ''
          );

          if (relation.type === 'duplicate') {
            duplicatesSkipped++;
            return;
          }

          if ((relation.type === 'contradict' || relation.type === 'enrich') && relation.fact) {
            const oldSnapshotText = relation.fact.text;
            if (oldSnapshotText.trim().toLowerCase() === cleanFact.toLowerCase()) {
              duplicatesSkipped++;
              return;
            }
            const nextReason =
              reasonStr ||
              (relation.type === 'enrich' ? t.toasts.enrichedReason : t.toasts.updatedReason);
            const prevHistory: FactHistoryEntry[] = Array.isArray(relation.fact.history)
              ? [...relation.fact.history]
              : relation.fact.prevText
              ? [
                  {
                    text: relation.fact.prevText,
                    changedAt: updatedPerson.updatedAt || nowIso,
                    reason: relation.fact.reason || undefined,
                  },
                ]
              : [];
            if (
              prevHistory.length === 0 ||
              prevHistory[prevHistory.length - 1].text.trim().toLowerCase() !==
                oldSnapshotText.trim().toLowerCase()
            ) {
              prevHistory.push({
                text: oldSnapshotText,
                changedAt: nowIso,
                reason: nextReason,
              });
            }

            relation.fact.text = cleanFact;
            relation.fact.isNew = true;
            relation.fact.tag = 'updated';
            relation.fact.prevText = oldSnapshotText;
            relation.fact.reason = nextReason;
            relation.fact.history = prevHistory.slice(-20);
            addedInCol++;
            factsAdded++;
            updatedCount++;
            return;
          }

          targetCol!.facts.push({
            id: uid('fact'),
            text: cleanFact,
            isNew: true,
            tag,
            reason: reasonStr,
            prevText: '',
          });
          addedInCol++;
          factsAdded++;
          if (tag === 'ai_inference') inferencesCount++;
          if (tag === 'updated') updatedCount++;
        });

        if (createdNow && addedInCol === 0) {
          updatedPerson.columns = updatedPerson.columns.filter((c) => c.id !== targetCol!.id);
          newColsCount--;
        }
      });
    }

    const isSameAsLastNote =
      updatedPerson.rawNotes.length > 0 &&
      updatedPerson.rawNotes[0].text.trim() === rawText;

    if (!isSameAsLastNote) {
      updatedPerson.rawNotes.unshift({
        id: uid('note'),
        createdAt: nowIso,
        text: rawText,
      });
    }
    updatedPerson.updatedAt = nowIso;
    updatedPerson.lastContactAt = computeLatestContactIso({
      meetings: updatedPerson.meetings,
      rawNotes: updatedPerson.rawNotes,
      lastContactAt: updatedPerson.lastContactAt,
      updatedAt: nowIso,
    });

    updateSinglePerson(activePerson.id, () => updatedPerson);
    setIsAnalyzing(false);
    setDraftText('');
    setLastReport({
      personId: activePerson.id,
      factsAdded,
      newColsCount,
      inferencesCount,
      updatedCount,
      duplicatesSkipped,
      engineName: engineUsed === 'gemini' ? 'Gemini' : t.sidebar.engineLocal,
      usedFallback,
      fallbackReason,
      snapshotBefore,
    });

    if (factsAdded > 0) {
      showToast(
        t.toasts.analysisSuccess(factsAdded, inferencesCount, duplicatesSkipped),
        'success'
      );
    } else {
      showToast(
        duplicatesSkipped > 0
          ? t.toasts.analysisDupsOnly(duplicatesSkipped)
          : t.toasts.analysisEmpty,
        'info'
      );
    }
  };

  const handleUndoAnalysis = () => {
    if (!lastReport?.snapshotBefore) return;
    const restored = lastReport.snapshotBefore;
    updateSinglePerson(restored.id, () => restored);
    setLastReport(null);
    showToast(t.toasts.analysisUndone, 'info');
  };

  const handleAskAdvisor = async (questionText: string) => {
    if (!activePerson || isAskingAdvisor) return;
    const q = questionText.trim();
    if (!q) return;

    setAdvisorQuery(q);
    setIsAskingAdvisor(true);
    setAdvisorAnswer('');

    try {
      if (!navigator.onLine || !getEffectiveApiKey()) {
        throw new Error('NO_API_KEY');
      }
      const answer = await askAdvisorWithGemini(activePerson, q, lang);
      setActiveEngine('gemini');
      setAdvisorAnswer(answer);
    } catch (err) {
      setActiveEngine('local');
      if (err instanceof Error && err.message !== 'NO_API_KEY') {
        showToast(formatGeminiFallbackReason(err, lang), 'warning');
      }
      setAdvisorAnswer(buildLocalAdvisorAnswer(activePerson, q, lang));
    } finally {
      setIsAskingAdvisor(false);
    }
  };

  const handleOpenSummary = async (mode: 'single' | 'all') => {
    setSummaryMode(mode);
    setSummaryOpen(true);
    if (summaryLoading) return;

    setSummaryLoading(true);
    let data: DossierData;
    let engineUsed: 'gemini' | 'local' = 'gemini';

    try {
      if (!navigator.onLine || !getEffectiveApiKey()) {
        throw new Error('NO_API_KEY');
      }
      data = await buildDossierWithGemini(mode, activePerson, people, lang);
      engineUsed = 'gemini';
    } catch (err) {
      engineUsed = 'local';
      if (err instanceof Error && err.message !== 'NO_API_KEY') {
        showToast(formatGeminiFallbackReason(err, lang), 'warning');
      }
      data = buildDossierLocally(mode, activePerson, people);
    }

    setActiveEngine(engineUsed);
    setSummaryData({
      ...data,
      engineUsed: engineUsed === 'gemini' ? 'Gemini' : t.sidebar.engineLocal,
    });
    setSummaryLoading(false);
  };

  const copyText = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast(t.toasts.copied, 'success'))
        .catch(() => showToast(t.toasts.copyFailed, 'error'));
    } else {
      showToast(t.toasts.copyUnsupported, 'error');
    }
  };

  const formatSummaryPlainText = (d: DossierData) => {
    const locale = lang === 'kk' ? 'kk-KZ' : lang === 'en' ? 'en-US' : 'ru-RU';
    return [
      '====================================================',
      String(d.reportTitle || t.toasts.summaryPlainTitle).toUpperCase(),
      `${t.toasts.summaryGeneratedAt}: ${new Date().toLocaleString(locale)}`,
      '====================================================',
      '',
      d.block1Title,
      d.block1Text,
      '',
      d.block2Title,
      d.block2Text,
      '',
      d.block3Title,
      d.block3Text,
      '',
      d.block4Title,
      d.block4Text,
      '',
      d.block5Title,
      d.block5Text,
      '',
      d.block6Title || '',
      d.block6Text || '',
    ].join('\n');
  };

  const handleExportJson = () => {
    const json = JSON.stringify(
      {
        app: 'SmartPeopleNotebook',
        account: currentUser ? getUserDisplayLabel(currentUser) : 'guest',
        exportedAt: new Date().toISOString(),
        people,
      },
      null,
      2
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `people-notebook-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(t.toasts.jsonExported, 'success');
  };

  const handleImportJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || ''));
        if (!parsed || !Array.isArray(parsed.people)) {
          throw new Error('INVALID_JSON');
        }
        const imported = normalizePeople(parsed.people);
        const nextActive = imported[0]?.id || null;
        setPeople(imported);
        setActivePersonId(nextActive);
        setLastReport(null);
        persistLocalSnapshot(imported, nextActive, currentScope);
        if (currentUser) {
          await syncPeopleMapToCloud(currentUser.uid, imported).catch(() => {
            showToast(t.toasts.importLocalOnly, 'warning');
          });
        }
        showToast(t.toasts.jsonImported(imported.length), 'success');
      } catch {
        showToast(t.toasts.jsonInvalid, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExportReminderCalendar = useCallback(
    (reminder: UpcomingDateReminder) => {
      const eventLabel = reminder.isBirthday ? t.reminders.birthday : reminder.factText;
      const title = `${reminder.personName} — ${eventLabel}`;
      downloadIcsEvent({
        personName: reminder.personName,
        title,
        day: reminder.day,
        month: reminder.month,
        isRecurringYearly:
          reminder.isBirthday || isAnnualEventFact('', reminder.factText),
        description: reminder.factText,
      });
      showToast(t.toasts.calendarExported(title), 'success');
    },
    [showToast, t]
  );

  const handleExportFactCalendar = useCallback(
    (factText: string, colTitle: string) => {
      if (!activePerson) return;
      const extracted = extractExportableDateFromFact(colTitle, factText);
      if (!extracted) return;
      const title = `${activePerson.name} — ${factText}`;
      downloadIcsEvent({
        personName: activePerson.name,
        title,
        day: extracted.day,
        month: extracted.month,
        isRecurringYearly: extracted.isYearly,
        description: `${colTitle}: ${factText}`,
      });
      showToast(t.toasts.calendarExported(title), 'success');
    },
    [activePerson, showToast, t]
  );

  const pendingCount = pendingQueue.upsertIds.length + pendingQueue.deleteIds.length;

  return (
    <LanguageProvider lang={lang} onChangeLang={handleChangeLanguage}>
      {authLoading ? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
          <div className="w-7 h-7 rounded-full border-2 border-zinc-500/30 border-t-zinc-400 animate-spin" />
          <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {t.common.loading}
          </div>
        </div>
      ) : !currentUser && !isGuestMode ? (
        <AuthScreen
          initialError={authError}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onContinueGuest={() => {
            setIsGuestMode(true);
            loadLocalScope('guest');
            showToast(t.toasts.guestMode, 'info');
          }}
          onToast={showToast}
        />
      ) : (
        <div className="min-h-screen flex">
          <Sidebar
            people={people}
            activePersonId={activePersonId}
            reminders={upcomingReminders}
            searchQuery={searchQuery}
            selectedGroup={selectedGroup}
            theme={theme}
            accountLabel={currentUser ? getUserDisplayLabel(currentUser) : t.common.guest}
            isSignedIn={Boolean(currentUser)}
            cloudStatus={cloudStatus}
            pendingCount={pendingCount}
            isSyncing={isSyncing}
            activeEngine={activeEngine}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
            onSelectPerson={handleSelectPerson}
            onSearchChange={setSearchQuery}
            onSelectGroup={setSelectedGroup}
            onOpenAddPerson={() => setAddPersonOpen(true)}
            onOpenAccount={() => setAccountOpen(true)}
            onOpenApiSettings={() => setApiSettingsOpen(true)}
            onToggleTheme={handleToggleTheme}
            onExportJson={handleExportJson}
            onImportJsonFile={handleImportJsonFile}
            onManualSync={handleManualSync}
            onExportReminderCalendar={handleExportReminderCalendar}
          />

          <div className="flex-1 min-w-0 flex flex-col">
            <OfflineIndicator />
            {/* Compact mobile bar */}
            <header
              className="lg:hidden h-12 px-3.5 border-b flex items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur-md"
              style={{
                backgroundColor: 'var(--bg-header)',
                borderColor: 'var(--border-color)',
              }}
            >
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label={t.sidebar.openContactsAria}
                className="w-8 h-8 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-primary)' }}
              >
                <Menu className="w-4 h-4" />
              </button>
              <span className="font-display text-sm font-semibold truncate flex-1 text-center">
                {activePerson ? activePerson.name : t.sidebar.brand}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleTheme}
                  aria-label={theme === 'dark' ? t.sidebar.lightTheme : t.sidebar.darkTheme}
                  title={theme === 'dark' ? t.sidebar.lightTheme : t.sidebar.darkTheme}
                  className="w-8 h-8 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setAddPersonOpen(true)}
                  aria-label={t.sidebar.addContactHeaderAria}
                  className="w-8 h-8 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </header>

            <main className="max-w-[960px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1 flex flex-col gap-6">
              {!activePerson ? (
                <div
                  className="rounded-lg border p-10 text-center my-auto"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <h2 className="font-display text-lg font-semibold mb-2">
                    {t.emptyState.title}
                  </h2>
                  <p
                    className="text-[13px] max-w-md mx-auto mb-5 leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t.emptyState.description}
                  </p>
                  <div className="flex flex-wrap gap-2.5 justify-center">
                    <button
                      type="button"
                      onClick={() => setAddPersonOpen(true)}
                      className="px-4 py-2 rounded-md text-[13px] font-medium hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--btn-primary-bg)',
                        color: 'var(--btn-primary-text)',
                      }}
                    >
                      {t.emptyState.addContact}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sample = createDefaultSampleState();
                        setPeople(sample.people);
                        setActivePersonId(sample.activePersonId);
                        persistLocalSnapshot(
                          sample.people,
                          sample.activePersonId,
                          currentScope
                        );
                        if (currentUser && sample.people[0]) {
                          pushPersonUpdate(sample.people[0], currentUser.uid);
                        }
                        showToast(t.emptyState.sampleToast, 'success');
                      }}
                      className="px-4 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      {t.emptyState.loadSample}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                <ProfileCard
                  person={activePerson}
                  onRename={(newName) =>
                    updateSinglePerson(activePerson.id, (p) => ({
                      ...p,
                      name: newName,
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  onEditSubtitle={(newSubtitle) =>
                    updateSinglePerson(activePerson.id, (p) => ({
                      ...p,
                      subtitle: newSubtitle,
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  onTogglePin={() =>
                    updateSinglePerson(activePerson.id, (p) => ({
                      ...p,
                      isPinned: !p.isPinned,
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  onChangeGroup={(group) =>
                    updateSinglePerson(activePerson.id, (p) => ({
                      ...p,
                      group,
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  onChangeInterval={(days) =>
                    updateSinglePerson(activePerson.id, (p) => ({
                      ...p,
                      contactIntervalDays: days,
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  onOpenDossier={() => handleOpenSummary('single')}
                  onOpenAddColumn={() => setAddColumnOpen(true)}
                  onOpenAddMeeting={() => setAddMeetingOpen(true)}
                  onDeduplicate={() => {
                    const copy: Person = JSON.parse(JSON.stringify(activePerson));
                    const removed = deduplicatePersonFacts(copy);
                    if (removed > 0) {
                      copy.updatedAt = new Date().toISOString();
                      updateSinglePerson(activePerson.id, () => copy);
                      showToast(t.toasts.dedupDone(removed), 'success');
                    } else {
                      showToast(t.toasts.dedupNone, 'info');
                    }
                  }}
                  onDeletePerson={() => handleDeletePerson(activePerson)}
                />

                <AnalyzerCard
                  person={activePerson}
                  draftText={draftText}
                  isAnalyzing={isAnalyzing}
                  report={lastReport?.personId === activePerson.id ? lastReport : null}
                  advisorQuery={advisorQuery}
                  advisorAnswer={advisorAnswer}
                  isAskingAdvisor={isAskingAdvisor}
                  onDraftChange={setDraftText}
                  onFillDemo={() => setDraftText(DEMO_SAMPLE_TEXT)}
                  onClearDraft={() => setDraftText('')}
                  onAnalyze={handleAnalyzeText}
                  onUndoAnalysis={handleUndoAnalysis}
                  onDismissReport={() => setLastReport(null)}
                  onAdvisorQueryChange={setAdvisorQuery}
                  onAskAdvisor={handleAskAdvisor}
                  onDismissAdvisor={() => setAdvisorAnswer('')}
                  onChatCleaned={() => showToast(t.toasts.chatCleanedToast, 'info')}
                />

                <ColumnsGrid
                  person={activePerson}
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery('')}
                  onRenameColumn={(colId, newTitle) =>
                    updateSinglePerson(activePerson.id, (p) => ({
                      ...p,
                      updatedAt: new Date().toISOString(),
                      columns: p.columns.map((c) =>
                        c.id === colId ? { ...c, title: newTitle } : c
                      ),
                    }))
                  }
                  onDeleteColumn={(colId) => {
                    const col = activePerson.columns.find((c) => c.id === colId);
                    if (!col) return;
                    setConfirmState({
                      open: true,
                      title: t.toasts.deleteColTitle(col.title),
                      message: t.toasts.deleteColMsg(col.facts.length),
                      onConfirm: () => {
                        updateSinglePerson(activePerson.id, (p) => ({
                          ...p,
                          updatedAt: new Date().toISOString(),
                          columns: p.columns.filter((c) => c.id !== colId),
                        }));
                        showToast(t.toasts.colDeleted(col.title), 'info');
                      },
                    });
                  }}
                  onEditFact={(colId, factId, newText) =>
                    updateSinglePerson(activePerson.id, (p) => {
                      const editNow = new Date().toISOString();
                      return {
                        ...p,
                        updatedAt: editNow,
                        columns: p.columns.map((c) => {
                          if (c.id !== colId) return c;
                          if (!newText) {
                            return {
                              ...c,
                              facts: c.facts.filter((f) => f.id !== factId),
                            };
                          }
                          return {
                            ...c,
                            facts: c.facts.map((f) => {
                              if (f.id !== factId) return f;
                              if (f.text === newText) {
                                return { ...f, isNew: false };
                              }
                              const prevHistory: FactHistoryEntry[] = Array.isArray(f.history)
                                ? [...f.history]
                                : f.prevText
                                ? [
                                    {
                                      text: f.prevText,
                                      changedAt: p.updatedAt || editNow,
                                      reason: f.reason || undefined,
                                    },
                                  ]
                                : [];
                              if (
                                prevHistory.length === 0 ||
                                prevHistory[prevHistory.length - 1].text.trim().toLowerCase() !==
                                  f.text.trim().toLowerCase()
                              ) {
                                prevHistory.push({
                                  text: f.text,
                                  changedAt: editNow,
                                  reason: t.toasts.manualEditReason,
                                });
                              }
                              return {
                                ...f,
                                text: newText,
                                isNew: false,
                                tag: 'updated',
                                prevText: f.text,
                                reason: t.toasts.manualEditReason,
                                history: prevHistory.slice(-20),
                              };
                            }),
                          };
                        }),
                      };
                    })
                  }
                  onExportDateToCalendar={handleExportFactCalendar}
                  onDeleteFact={(colId, factId) =>
                    updateSinglePerson(activePerson.id, (p) => ({
                      ...p,
                      updatedAt: new Date().toISOString(),
                      columns: p.columns.map((c) =>
                        c.id === colId
                          ? { ...c, facts: c.facts.filter((f) => f.id !== factId) }
                          : c
                      ),
                    }))
                  }
                  onQuickAddFact={(colId, text) => {
                    const rel = findFactRelationAcrossPerson(activePerson, text, '');
                    if (rel.type === 'duplicate' || rel.type === 'enrich') {
                      showToast(
                        t.toasts.similarFactExists(rel.col?.title || ''),
                        'warning'
                      );
                      return;
                    }
                    updateSinglePerson(activePerson.id, (p) => ({
                      ...p,
                      updatedAt: new Date().toISOString(),
                      columns: p.columns.map((c) =>
                        c.id === colId
                          ? {
                              ...c,
                              facts: [
                                ...c.facts,
                                {
                                  id: uid('fact'),
                                  text,
                                  isNew: false,
                                  tag: 'fact',
                                  reason: '',
                                  prevText: '',
                                },
                              ],
                            }
                          : c
                      ),
                    }));
                  }}
                />

                <MeetingsTimeline
                  person={activePerson}
                  onOpenAddMeeting={() => setAddMeetingOpen(true)}
                  onDeleteMeeting={handleDeleteMeeting}
                />

                <RawNotesHistory
                  person={activePerson}
                  onCopyNote={copyText}
                  onDeleteNote={(noteId) => {
                    updateSinglePerson(activePerson.id, (p) => ({
                      ...p,
                      rawNotes: p.rawNotes.filter((n) => n.id !== noteId),
                    }));
                    showToast(t.toasts.noteDeleted, 'info');
                  }}
                />
                </>
              )}
            </main>
          </div>

          {/* Modals */}
          <AccountModal
            open={accountOpen}
            user={currentUser}
            authRevision={authRevision}
            pendingCount={pendingCount}
            isSyncing={isSyncing}
            onClose={() => setAccountOpen(false)}
            onRefreshAccount={handleRefreshAccountStatus}
            onManualSync={handleManualSync}
            onLogout={async () => {
              setAccountOpen(false);
              if (currentUser) {
                try {
                  await logoutFromFirebase();
                  showToast(t.toasts.loggedOut, 'info');
                } catch {
                  showToast(t.toasts.logoutError, 'error');
                }
              } else {
                setIsGuestMode(false);
              }
            }}
            onToast={showToast}
          />

          <AddPersonModal
            open={addPersonOpen}
            onClose={() => setAddPersonOpen(false)}
            onCreate={handleCreatePerson}
          />

          <AddColumnModal
            open={addColumnOpen}
            onClose={() => setAddColumnOpen(false)}
            onCreate={handleAddColumn}
          />

          <AddMeetingModal
            open={addMeetingOpen}
            personName={activePerson?.name || ''}
            onClose={() => setAddMeetingOpen(false)}
            onCreate={handleAddMeeting}
          />

          <ApiSettingsModal
            open={apiSettingsOpen}
            currentKey={safeStorage.getItem(STORAGE_API_KEY) || ''}
            onClose={() => setApiSettingsOpen(false)}
            onSaveKey={(val) => {
              if (val) {
                safeStorage.setItem(STORAGE_API_KEY, val);
                setActiveEngine('gemini');
                showToast(t.toasts.apiSaved, 'success');
              } else {
                safeStorage.removeItem(STORAGE_API_KEY);
                setActiveEngine('local');
                showToast(t.toasts.apiCleared, 'info');
              }
              setApiSettingsOpen(false);
            }}
            onClearKey={() => {
              safeStorage.removeItem(STORAGE_API_KEY);
              setActiveEngine('local');
              showToast(t.toasts.userKeyCleared, 'info');
            }}
          />

          <ConfirmModal
            open={confirmState.open}
            title={confirmState.title}
            message={confirmState.message}
            onClose={() => setConfirmState((s) => ({ ...s, open: false }))}
            onConfirm={confirmState.onConfirm}
          />

          <SummaryModal
            open={summaryOpen}
            mode={summaryMode}
            activePersonName={activePerson?.name || ''}
            isLoading={summaryLoading}
            data={summaryData}
            onClose={() => setSummaryOpen(false)}
            onSwitchMode={(m) => handleOpenSummary(m)}
            onRefresh={() => handleOpenSummary(summaryMode)}
            onCopy={() => {
              if (summaryData) copyText(formatSummaryPlainText(summaryData));
            }}
            onDownloadTxt={() => {
              if (!summaryData) return;
              const text = formatSummaryPlainText(summaryData);
              const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ai-dosye-${new Date().toISOString().slice(0, 10)}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              showToast(t.toasts.txtDownloaded, 'success');
            }}
          />
        </div>
      )}

      {/* Toast stack */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-2 max-w-[370px] w-[calc(100%-40px)] pointer-events-none">
        {toasts.map((toastItem) => {
          const borderCol =
            toastItem.type === 'success'
              ? 'var(--success-border)'
              : toastItem.type === 'warning'
              ? 'var(--warning-border)'
              : toastItem.type === 'error'
              ? 'var(--danger-border)'
              : 'var(--border-color)';
          return (
            <div
              key={toastItem.id}
              role="status"
              className="pointer-events-auto px-3.5 py-3 rounded-xl border shadow-lg text-[13px] font-medium flex items-center justify-between gap-2.5 animate-pop-in"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: borderCol,
                color: 'var(--text-primary)',
              }}
            >
              <span>{toastItem.message}</span>
              <button
                type="button"
                aria-label={t.common.closeNotice}
                onClick={() =>
                  setToasts((prev) => prev.filter((item) => item.id !== toastItem.id))
                }
                className="opacity-70 hover:opacity-100 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </LanguageProvider>
  );
}
