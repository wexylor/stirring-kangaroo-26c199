import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@firebase/auth';
import { X } from 'lucide-react';
import type {
  AnalysisReport,
  CloudSyncStatus,
  DossierData,
  MeetingEntry,
  MeetingType,
  Person,
  ToastItem,
} from './types/notebook';
import {
  computeLatestContactIso,
  getEffectiveApiKey,
  normalizePeople,
  safeStorage,
  STORAGE_API_KEY,
  STORAGE_DATA_PREFIX,
  STORAGE_PENDING_PREFIX,
  STORAGE_TAB_PREFIX,
  STORAGE_THEME_KEY,
  uid,
} from './utils/storage';
import {
  analyzeTextLocally,
  buildDossierLocally,
  buildLocalAdvisorAnswer,
  deduplicatePersonFacts,
  findFactRelationAcrossPerson,
  type AnalysisResultPayload,
} from './utils/semantics';
import { getUpcomingReminders } from './utils/dateReminders';
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
import { Header } from './components/Header';
import { UpcomingRemindersBar } from './components/UpcomingRemindersBar';
import { ProfileCard } from './components/ProfileCard';
import { AnalyzerCard } from './components/AnalyzerCard';
import { ColumnsGrid } from './components/ColumnsGrid';
import { MeetingsTimeline } from './components/MeetingsTimeline';
import { RawNotesHistory } from './components/RawNotesHistory';
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

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = safeStorage.getItem(STORAGE_THEME_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

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
    document.documentElement.setAttribute('data-theme', theme);
    safeStorage.setItem(STORAGE_THEME_KEY, theme);
  }, [theme]);

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
        showToast(
          'Изменения сохранены локально. Нажмите «Синхронизировать сейчас», когда появится связь.',
          'warning'
        );
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
        showToast(
          'Удаление сохранено локально и ожидает синхронизации.',
          'warning'
        );
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
      showToast('Синхронизация с облаком выполнена успешно!', 'success');
    } catch {
      setCloudStatus('error');
      showToast('Не удалось синхронизироваться с облаком. Проверьте интернет.', 'error');
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
      subtitle: subtitle || 'Личная карточка',
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
    showToast(`Вкладка «${name}» создана`, 'success');
  };

  const handleDeletePerson = (person: Person) => {
    setConfirmState({
      open: true,
      title: `Удалить вкладку «${person.name}»?`,
      message:
        'Все колонки, факты, таймлайн встреч и история заметок этого человека будут удалены из вашего аккаунта.',
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
        showToast(`Вкладка «${person.name}» удалена`, 'info');
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
      showToast('Колонка с таким названием уже есть', 'warning');
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
    showToast(`Колонка «${title}» добавлена`, 'success');
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
    showToast('Встреча/контакт записаны в таймлайн', 'success');
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
    showToast('Запись удалена из таймлайна', 'info');
  };

  const handleAnalyzeText = async () => {
    if (!activePerson || isAnalyzing) return;
    const rawText = draftText.trim();
    if (!rawText) {
      showToast('Введите или вставьте текст для анализа', 'warning');
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
      const reasonMsg = formatGeminiFallbackReason(err);
      // Show explicit fallback toast if user expected Gemini (had API key or hit network/timeout)
      if (err instanceof Error && err.message !== 'NO_API_KEY') {
        usedFallback = true;
        fallbackReason = reasonMsg;
        showToast(reasonMsg, 'warning');
      }
      result = analyzeTextLocally(activePerson, rawText, people);
    }

    setActiveEngine(engineUsed);

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
            relation.fact.text = cleanFact;
            relation.fact.isNew = true;
            relation.fact.tag = 'updated';
            relation.fact.prevText = oldSnapshotText;
            relation.fact.reason =
              reasonStr ||
              (relation.type === 'enrich' ? 'Дополнено деталями' : 'Обновлено');
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

    const nowIso = new Date().toISOString();
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
      engineName: engineUsed === 'gemini' ? 'Gemini AI' : 'Локальный ИИ',
      usedFallback,
      fallbackReason,
      snapshotBefore,
    });

    if (factsAdded > 0) {
      const dupPart =
        duplicatesSkipped > 0 ? `, пропущено дублей: ${duplicatesSkipped}` : '';
      showToast(
        `Готово! +${factsAdded} фактов, ${inferencesCount} выводов ИИ${dupPart}`,
        'success'
      );
    } else {
      showToast(
        duplicatesSkipped > 0
          ? `Дубликаты не добавлены (заблокировано ${duplicatesSkipped} повторяющихся фактов)`
          : 'Новых фактов в тексте не обнаружено',
        'info'
      );
    }
  };

  const handleUndoAnalysis = () => {
    if (!lastReport?.snapshotBefore) return;
    const restored = lastReport.snapshotBefore;
    updateSinglePerson(restored.id, () => restored);
    setLastReport(null);
    showToast('Последний разбор отменён', 'info');
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
      const answer = await askAdvisorWithGemini(activePerson, q);
      setActiveEngine('gemini');
      setAdvisorAnswer(answer);
    } catch (err) {
      setActiveEngine('local');
      if (err instanceof Error && err.message !== 'NO_API_KEY') {
        showToast(formatGeminiFallbackReason(err), 'warning');
      }
      setAdvisorAnswer(buildLocalAdvisorAnswer(activePerson, q));
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
      data = await buildDossierWithGemini(mode, activePerson, people);
      engineUsed = 'gemini';
    } catch (err) {
      engineUsed = 'local';
      if (err instanceof Error && err.message !== 'NO_API_KEY') {
        showToast(formatGeminiFallbackReason(err), 'warning');
      }
      data = buildDossierLocally(mode, activePerson, people);
    }

    setActiveEngine(engineUsed);
    setSummaryData({
      ...data,
      engineUsed: engineUsed === 'gemini' ? '⚡ Gemini AI' : '🧠 Умный локальный ИИ',
    });
    setSummaryLoading(false);
  };

  const copyText = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast('Текст скопирован в буфер обмена', 'success'))
        .catch(() => showToast('Не удалось скопировать текст', 'error'));
    } else {
      showToast('Копирование не поддерживается в этом контексте', 'error');
    }
  };

  const formatSummaryPlainText = (d: DossierData) =>
    [
      '====================================================',
      String(d.reportTitle || 'ИИ-ДОСЬЕ И АНАЛИТИКА').toUpperCase(),
      `Сформировано: ${new Date().toLocaleString('ru-RU')}`,
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
    showToast('Резервная копия JSON скачана', 'success');
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
            showToast('Импорт выполнен локально, нажмите «Синхронизировать сейчас»', 'warning');
          });
        }
        showToast(`Импортировано вкладок: ${imported.length}`, 'success');
      } catch {
        showToast('Ошибка: неверный формат JSON-файла', 'error');
      }
    };
    reader.readAsText(file);
  };

  const pendingCount = pendingQueue.upsertIds.length + pendingQueue.deleteIds.length;

  return (
    <>
      {authLoading ? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3.5 p-6">
          <div className="w-9 h-9 rounded-full border-3 border-violet-500/25 border-t-violet-500 animate-spin" />
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Проверяем аккаунт и синхронизацию...
          </div>
        </div>
      ) : !currentUser && !isGuestMode ? (
        <AuthScreen
          initialError={authError}
          onContinueGuest={() => {
            setIsGuestMode(true);
            loadLocalScope('guest');
            showToast(
              'Открыт локальный блокнот (данные хранятся только в этом браузере)',
              'info'
            );
          }}
          onToast={showToast}
        />
      ) : (
        <div className="min-h-screen flex flex-col">
          <Header
            people={people}
            activePersonId={activePersonId}
            searchQuery={searchQuery}
            selectedGroup={selectedGroup}
            theme={theme}
            accountLabel={currentUser ? getUserDisplayLabel(currentUser) : 'Гость (локально)'}
            isSignedIn={Boolean(currentUser)}
            cloudStatus={cloudStatus}
            pendingCount={pendingCount}
            isSyncing={isSyncing}
            activeEngine={activeEngine}
            onSelectPerson={handleSelectPerson}
            onSearchChange={setSearchQuery}
            onSelectGroup={setSelectedGroup}
            onOpenAddPerson={() => setAddPersonOpen(true)}
            onOpenAccount={() => setAccountOpen(true)}
            onOpenApiSettings={() => setApiSettingsOpen(true)}
            onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            onExportJson={handleExportJson}
            onImportJsonFile={handleImportJsonFile}
            onManualSync={handleManualSync}
          />

          <main className="max-w-[1240px] w-full mx-auto px-4 pt-5 pb-12 flex-1 flex flex-col gap-5">
            <UpcomingRemindersBar
              reminders={upcomingReminders}
              onSelectPerson={handleSelectPerson}
            />

            {!activePerson ? (
              <div
                className="rounded-2xl border p-12 text-center"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="text-4xl mb-3">📒</div>
                <h2 className="font-display text-xl font-bold mb-2">
                  В вашем блокноте пока нет вкладок
                </h2>
                <p
                  className="text-sm max-w-md mx-auto mb-5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Создайте вкладку с именем человека, а затем вставляйте любые заметки о нём — ИИ сам разложит факты без дублей, сделает выводы и создаст новые колонки.
                </p>
                <div className="flex flex-wrap gap-2.5 justify-center">
                  <button
                    type="button"
                    onClick={() => setAddPersonOpen(true)}
                    className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                    style={{ background: 'var(--accent-gradient)' }}
                  >
                    + Добавить человека
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
                      showToast('Загружен пример вкладки «Алина»', 'success');
                    }}
                    className="px-4 py-2.5 rounded-xl border text-[13px] font-semibold"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    Загрузить пример (Алина)
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
                      showToast(`Очищено повторяющихся фактов: ${removed}`, 'success');
                    } else {
                      showToast('Дубликатов не найдено — все факты уникальны', 'info');
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
                      title: `Удалить колонку «${col.title}»?`,
                      message: `Будут удалены все записи внутри этой колонки (${col.facts.length} шт.).`,
                      onConfirm: () => {
                        updateSinglePerson(activePerson.id, (p) => ({
                          ...p,
                          updatedAt: new Date().toISOString(),
                          columns: p.columns.filter((c) => c.id !== colId),
                        }));
                        showToast(`Колонка «${col.title}» удалена`, 'info');
                      },
                    });
                  }}
                  onEditFact={(colId, factId, newText) =>
                    updateSinglePerson(activePerson.id, (p) => ({
                      ...p,
                      updatedAt: new Date().toISOString(),
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
                          facts: c.facts.map((f) =>
                            f.id === factId ? { ...f, text: newText, isNew: false } : f
                          ),
                        };
                      }),
                    }))
                  }
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
                        `Похожий факт уже есть в колонке «${rel.col?.title}»`,
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
                    showToast('Заметка удалена из истории', 'info');
                  }}
                />
              </>
            )}
          </main>

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
                  showToast('Вы вышли из аккаунта', 'info');
                } catch {
                  showToast('Ошибка при выходе из аккаунта', 'error');
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
                showToast('API-ключ сохранён (активен Gemini AI)', 'success');
              } else {
                safeStorage.removeItem(STORAGE_API_KEY);
                setActiveEngine('local');
                showToast('Ключ очищен', 'info');
              }
              setApiSettingsOpen(false);
            }}
            onClearKey={() => {
              safeStorage.removeItem(STORAGE_API_KEY);
              setActiveEngine('local');
              showToast('Пользовательский ключ очищен', 'info');
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
              showToast('Файл .txt скачан', 'success');
            }}
          />
        </div>
      )}

      {/* Toast stack */}
      <div className="fixed bottom-5 right-5 z-60 flex flex-col gap-2 max-w-[370px] w-[calc(100%-40px)] pointer-events-none">
        {toasts.map((t) => {
          const borderCol =
            t.type === 'success'
              ? 'var(--success-border)'
              : t.type === 'warning'
              ? 'var(--warning-border)'
              : t.type === 'error'
              ? 'var(--danger-border)'
              : 'var(--border-color)';
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto px-3.5 py-3 rounded-xl border shadow-lg text-[13px] font-medium flex items-center justify-between gap-2.5 animate-pop-in"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: borderCol,
                color: 'var(--text-primary)',
              }}
            >
              <span>{t.message}</span>
              <button
                type="button"
                aria-label="Закрыть уведомление"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="opacity-70 hover:opacity-100 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
