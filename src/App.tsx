import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@firebase/auth';
import {
  Menu,
  Plus,
  X,
  Sun,
  Moon,
  Lock,
  Megaphone,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
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
  getSavedAnalyzerMode,
  normalizePeople,
  safeStorage,
  saveAnalyzerMode,
  STORAGE_DATA_PREFIX,
  STORAGE_LANG_KEY,
  STORAGE_PENDING_PREFIX,
  STORAGE_TAB_PREFIX,
  STORAGE_THEME_KEY,
  uid,
} from './utils/storage';
import {
  shouldUseCloudAi,
  type AnalyzerPreferenceMode,
} from './utils/aiPolicy';
import type { AiKeyRouteMode } from './utils/aiKeyRouter';
import {
  APP_VERSION,
  createDefaultUiDefaults,
  isClientVersionOutdated,
  type FeaturePoll,
  type GlobalAnnouncement,
  type SampleContactTemplate,
  type UiDefaultsConfig,
  type UserFeedbackTicketSummary,
} from './utils/adminOps';
import { parseVCardContacts } from './utils/importers';
import {
  buildLocalGreeting,
  type GreetingOccasion,
  type GreetingTone,
} from './utils/greetingGenerator';
import { useLiveMinute } from './utils/liveClock';
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
  getFreshIdToken,
  getUserDisplayLabel,
  isAdminUser,
  isSyntheticLoginEmail,
  logoutFromFirebase,
  reloadFirebaseUser,
  savePersonToCloud,
  setCloudWriteBlockedByReadOnly,
  subscribeAuthChanges,
  subscribeGlobalAiConfig,
  subscribeUserPeople,
  syncPeopleMapToCloud,
  updateUserProfileInCloud,
  deleteCurrentUserAccount,
} from './services/firebase';
import {
  analyzeTextWithGemini,
  askAdvisorWithGemini,
  buildDossierWithGemini,
  fetchMyFeedbackTickets,
  fetchServerAiStatus,
  formatGeminiFallbackReason,
  generateGreetingWithGemini,
  notifyNewUserRegistration,
  submitPollVote,
  submitUserFeedback,
  trackFeatureUsage,
} from './services/gemini';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { ProfileCard } from './components/ProfileCard';
import { AnalyzerCard } from './components/AnalyzerCard';
import { ColumnsGrid } from './components/ColumnsGrid';
import { MeetingsTimeline } from './components/MeetingsTimeline';
import { RawNotesHistory } from './components/RawNotesHistory';
import { OfflineIndicator } from './components/PWAInstallButton';
import { AdminModal } from './components/AdminModal';
import {
  AccountModal,
  DeleteAccountModal,
  AddColumnModal,
  AddMeetingModal,
  AddPersonModal,
  ApiSettingsModal,
  ConfirmModal,
  GreetingModal,
  ShareTargetModal,
  SummaryModal,
} from './components/Modals';
import { isDocumentScrollLocked } from './utils/scrollLock';
import {
  createSwipeSession,
  evaluateSwipeEnd,
  evaluateSwipeMove,
  isMobileViewportWidth,
  shouldIgnoreSwipeTarget,
  type DrawerSwipeSession,
} from './utils/swipeDrawer';
import {
  FAST_TRANSITION,
  WINDOW_TRANSITION,
  fadeEnterVariants,
  toastVariants,
  windowEnterVariants,
} from './utils/motionPresets';

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

  const [analyzerMode, setAnalyzerMode] = useState<AnalyzerPreferenceMode>(() =>
    getSavedAnalyzerMode()
  );
  const [sharedAiEnabled, setSharedAiEnabled] = useState<boolean>(true);
  const [guestAiEnabled, setGuestAiEnabled] = useState<boolean>(true);
  const [readOnlyMode, setReadOnlyMode] = useState<boolean>(false);
  const [serverKeyConfigured, setServerKeyConfigured] = useState<boolean>(false);
  const [serverIsAdmin, setServerIsAdmin] = useState<boolean>(false);
  const [extraAdminUids, setExtraAdminUids] = useState<string[]>([]);
  const [extraAdminEmails, setExtraAdminEmails] = useState<string[]>([]);
  const [, setKeyRouteMode] = useState<AiKeyRouteMode>('auto');
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [announcementDismissedText, setAnnouncementDismissedText] = useState<string>('');
  const [sampleTemplate, setSampleTemplate] = useState<SampleContactTemplate | null>(null);
  const [poll, setPoll] = useState<FeaturePoll | null>(null);
  const [pollVotedMap, setPollVotedMap] = useState<Record<string, string>>(() => {
    try {
      const raw = safeStorage.getItem('spn_poll_votes_v1');
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });
  const [pollDismissedId, setPollDismissedId] = useState<string>('');
  const [votingPoll, setVotingPoll] = useState(false);

  const [uiDefaults, setUiDefaults] = useState<UiDefaultsConfig>(() =>
    createDefaultUiDefaults()
  );
  const [minClientVersion, setMinClientVersion] = useState<string>(APP_VERSION);
  const [updateDismissedForVersion, setUpdateDismissedForVersion] = useState<string>('');
  const [guestTicketIds, setGuestTicketIds] = useState<string[]>(() => {
    try {
      const raw = safeStorage.getItem('spn_my_ticket_ids_v1');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [myTickets, setMyTickets] = useState<UserFeedbackTicketSummary[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [activeEngine, setActiveEngine] = useState<'gemini' | 'local'>('local');
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('local');
  const [pendingQueue, setPendingQueue] = useState<PendingSyncQueue>({
    upsertIds: [],
    deleteIds: [],
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [accountOpen, setAccountOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [addMeetingOpen, setAddMeetingOpen] = useState(false);
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
  const [greetingOpen, setGreetingOpen] = useState(false);
  const [shareModalState, setShareModalState] = useState<{
    open: boolean;
    text: string;
    suggestedName: string;
  }>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isShare = params.get('share') === '1';
      const title = (params.get('title') || '').trim();
      const text = (params.get('text') || '').trim();
      const url = (params.get('url') || '').trim();
      const combined = [title, text, url].filter(Boolean).join('\n');
      if (isShare || combined) {
        return {
          open: Boolean(combined),
          text: combined,
          suggestedName: title.slice(0, 40),
        };
      }
    }
    return { open: false, text: '', suggestedName: '' };
  });
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

  const liveMinuteTick = useLiveMinute();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const cloudUnsubRef = useRef<(() => void) | null>(null);
  const workspaceSwipeRef = useRef<DrawerSwipeSession | null>(null);
  const peopleRef = useRef<Person[]>([]);
  peopleRef.current = people;
  const pendingRef = useRef<PendingSyncQueue>(pendingQueue);
  pendingRef.current = pendingQueue;
  const sampleTemplateRef = useRef<SampleContactTemplate | null>(sampleTemplate);
  sampleTemplateRef.current = sampleTemplate;
  const readOnlyRef = useRef<boolean>(readOnlyMode);
  readOnlyRef.current = readOnlyMode;
  const adminUrlHandledRef = useRef(false);

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

  useEffect(() => {
    let active = true;
    const syncStatus = async () => {
      const idToken = currentUser ? await getFreshIdToken(currentUser) : null;
      const status = await fetchServerAiStatus(idToken);
      if (!active) return;
      setSharedAiEnabled(status.sharedAiEnabled);
      setGuestAiEnabled(status.guestAiEnabled);
      setReadOnlyMode(status.readOnlyMode);
      setServerKeyConfigured(status.serverKeyConfigured);
      setServerIsAdmin(Boolean(status.isAdmin));
      if (status.keyRouteMode) setKeyRouteMode(status.keyRouteMode);
      if (status.announcement) setAnnouncement(status.announcement);
      if (status.sampleTemplate) setSampleTemplate(status.sampleTemplate);
      if (status.poll) setPoll(status.poll);
      if (status.uiDefaults) setUiDefaults(status.uiDefaults);
      if (status.minClientVersion) setMinClientVersion(status.minClientVersion);
    };
    void syncStatus();
    return () => {
      active = false;
    };
  }, [currentUser, authRevision]);

  useEffect(() => {
    let active = true;
    let unsubGlobalAi: (() => void) | null = null;
    try {
      unsubGlobalAi = subscribeGlobalAiConfig(
        (cfg) => {
          if (!active) return;
          setSharedAiEnabled(cfg.sharedAiEnabled);
          setGuestAiEnabled(cfg.guestAiEnabled);
          setReadOnlyMode(cfg.readOnlyMode);
          setExtraAdminUids(cfg.extraAdminUids || []);
          setExtraAdminEmails(cfg.extraAdminEmails || []);
          if (cfg.keyRouteMode) setKeyRouteMode(cfg.keyRouteMode);
          if (cfg.announcement) setAnnouncement(cfg.announcement);
          if (cfg.sampleTemplate) setSampleTemplate(cfg.sampleTemplate);
          if (cfg.poll) setPoll(cfg.poll);
          if (cfg.uiDefaults) setUiDefaults(cfg.uiDefaults);
          if (cfg.minClientVersion) setMinClientVersion(cfg.minClientVersion);
        },
        () => {
          // If appConfig isn't readable yet in RTDB rules, keep server status
        }
      );
    } catch {
      // Ignore Firebase initialization failure
    }

    return () => {
      active = false;
      unsubGlobalAi?.();
    };
  }, []);

  const effectiveIsAdmin = useMemo(() => {
    if (!currentUser) return false;
    if (isAdminUser(currentUser) || serverIsAdmin) return true;
    if (extraAdminUids.includes(currentUser.uid)) return true;
    if (
      currentUser.emailVerified &&
      currentUser.email &&
      extraAdminEmails.includes(currentUser.email.trim().toLowerCase())
    ) {
      return true;
    }
    return false;
  }, [currentUser, serverIsAdmin, extraAdminUids, extraAdminEmails]);

  useEffect(() => {
    if (!effectiveIsAdmin || adminUrlHandledRef.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1') {
      adminUrlHandledRef.current = true;
      setAdminModalOpen(true);
    }
  }, [effectiveIsAdmin]);

  useEffect(() => {
    setCloudWriteBlockedByReadOnly(readOnlyMode);
  }, [readOnlyMode]);

  useEffect(() => {
    const syncEngineIndicator = () => {
      const decision = shouldUseCloudAi({
        preferenceMode: analyzerMode,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        sharedAiEnabled,
        serverKeyConfigured,
        isGuest: !currentUser,
        guestAiEnabled,
      });
      setActiveEngine(decision.useCloud ? 'gemini' : 'local');
    };
    syncEngineIndicator();
    window.addEventListener('online', syncEngineIndicator);
    window.addEventListener('offline', syncEngineIndicator);
    return () => {
      window.removeEventListener('online', syncEngineIndicator);
      window.removeEventListener('offline', syncEngineIndicator);
    };
  }, [analyzerMode, sharedAiEnabled, serverKeyConfigured, currentUser, guestAiEnabled]);

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
      const sample = createDefaultSampleState(sampleTemplateRef.current);
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
    if (readOnlyRef.current) {
      showToast(tRef.current.readOnly.blockedActionToast, 'warning');
      return;
    }
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

  useEffect(() => {
    if (!accountOpen) return;
    let active = true;
    setLoadingTickets(true);
    (async () => {
      try {
        const token = currentUser ? await getFreshIdToken(currentUser) : null;
        const list = await fetchMyFeedbackTickets(token, guestTicketIds);
        if (active) setMyTickets(list);
      } finally {
        if (active) setLoadingTickets(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [accountOpen, currentUser, guestTicketIds]);

  const handleSubmitFeedback = useCallback(
    async (type: 'bug' | 'idea', text: string) => {
      try {
        const token = currentUser ? await getFreshIdToken(currentUser) : null;
        const res = await submitUserFeedback(
          {
            type,
            text,
            lang,
            authorLabel: currentUser ? getUserDisplayLabel(currentUser) : tRef.current.common.guest,
            appVersion: APP_VERSION,
          },
          token
        );
        setGuestTicketIds((prev) => {
          const next = Array.from(new Set([res.ticketId, ...prev])).slice(0, 30);
          safeStorage.setItem('spn_my_ticket_ids_v1', JSON.stringify(next));
          return next;
        });
        if (res.ticket) {
          setMyTickets((prev) => [res.ticket!, ...prev.filter((tk) => tk.id !== res.ticket!.id)]);
        }
        showToast(tRef.current.account.feedbackSentToast, 'success');
      } catch (err) {
        showToast(tRef.current.account.feedbackErrorToast, 'error');
        throw err;
      }
    },
    [currentUser, lang, showToast]
  );

  const handleVotePoll = useCallback(
    async (optionId: string) => {
      if (!poll || !poll.enabled || votingPoll) return;
      if (pollVotedMap[poll.id]) return;
      setVotingPoll(true);
      try {
        const voterKey = currentUser?.uid
          ? `u_${currentUser.uid}`
          : (() => {
              let guestId = safeStorage.getItem('spn_guest_voter_id');
              if (!guestId) {
                guestId = uid('guest');
                safeStorage.setItem('spn_guest_voter_id', guestId);
              }
              return guestId;
            })();
        const res = await submitPollVote({
          pollId: poll.id,
          optionId,
          voterKey,
        });
        setPoll(res.poll);
        const nextMap = { ...pollVotedMap, [poll.id]: optionId };
        setPollVotedMap(nextMap);
        safeStorage.setItem('spn_poll_votes_v1', JSON.stringify(nextMap));
      } catch {
        showToast(tRef.current.account.feedbackErrorToast, 'error');
      } finally {
        setVotingPoll(false);
      }
    },
    [currentUser, poll, pollVotedMap, showToast, votingPoll]
  );

  const handleDeleteAccount = useCallback(
    async (currentPassword: string) => {
      if (!currentUser) return;
      const deletedUid = currentUser.uid;

      await deleteCurrentUserAccount(currentUser, currentPassword, () => {
        if (cloudUnsubRef.current) {
          cloudUnsubRef.current();
          cloudUnsubRef.current = null;
        }
      });

      safeStorage.removeItem(STORAGE_DATA_PREFIX + deletedUid);
      safeStorage.removeItem(STORAGE_TAB_PREFIX + deletedUid);
      safeStorage.removeItem(STORAGE_PENDING_PREFIX + deletedUid);
      setPeople([]);
      setActivePersonId(null);
      setPendingQueue({ upsertIds: [], deleteIds: [] });
      setDeleteAccountOpen(false);
      setAccountOpen(false);
      showToast(tRef.current.deleteAccount.deletedToast, 'success');
    },
    [currentUser, showToast]
  );

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

          try {
            const cMs = user.metadata?.creationTime
              ? Date.parse(user.metadata.creationTime)
              : 0;
            const sMs = user.metadata?.lastSignInTime
              ? Date.parse(user.metadata.lastSignInTime)
              : 0;
            const notifiedKey = `spn_notified_new_user_${user.uid}`;
            if (
              cMs > 0 &&
              sMs > 0 &&
              Math.abs(sMs - cMs) < 120_000 &&
              !safeStorage.getItem(notifiedKey)
            ) {
              safeStorage.setItem(notifiedKey, '1');
              getFreshIdToken(user)
                .then((tk) => {
                  if (tk) notifyNewUserRegistration(tk);
                })
                .catch(() => {});
            }
          } catch {
            // Non-blocking telemetry
          }

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

  const upcomingReminders = useMemo(
    () => getUpcomingReminders(people, 30),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [people, liveMinuteTick]
  );

  const updateSinglePerson = useCallback(
    (personId: string, updater: (p: Person) => Person) => {
      if (readOnlyRef.current) {
        showToast(tRef.current.readOnly.blockedActionToast, 'warning');
        return;
      }
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
    [activePersonId, currentScope, currentUser, persistLocalSnapshot, pushPersonUpdate, showToast]
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

  const buildInitialColumnsForPerson = () => {
    const sections =
      uiDefaults.defaultSections && uiDefaults.defaultSections.length > 0
        ? uiDefaults.defaultSections
        : [
            { title: 'Нравится', icon: '❤️' },
            { title: 'Не нравится', icon: '👎' },
            { title: 'Увлечения', icon: '🎯' },
          ];
    return sections.map((sec) => ({
      id: uid('col'),
      title: sec.title,
      icon: sec.icon,
      isNew: false,
      facts: [],
    }));
  };

  const handleCreatePerson = (
    name: string,
    subtitle: string,
    colorId: string,
    group: string
  ) => {
    if (readOnlyRef.current) {
      showToast(tRef.current.readOnly.blockedActionToast, 'warning');
      return;
    }
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
      columns: buildInitialColumnsForPerson(),
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
    if (readOnlyRef.current) {
      showToast(tRef.current.readOnly.blockedActionToast, 'warning');
      return;
    }
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

  const runAnalysisForPerson = async (
    targetPerson: Person,
    rawInput: string,
    allContacts: Person[]
  ) => {
    if (readOnlyRef.current) {
      showToast(tRef.current.readOnly.blockedActionToast, 'warning');
      return;
    }
    const rawText = rawInput.trim();
    if (!rawText) {
      showToast(t.toasts.enterText, 'warning');
      return;
    }

    setIsAnalyzing(true);
    const snapshotBefore: Person = JSON.parse(JSON.stringify(targetPerson));
    let result: AnalysisResultPayload;
    let engineUsed: 'gemini' | 'local' = 'gemini';
    let usedFallback = false;
    let fallbackReason = '';

    try {
      const policy = shouldUseCloudAi({
        preferenceMode: analyzerMode,
        isOnline: navigator.onLine,
        sharedAiEnabled,
        serverKeyConfigured,
        isGuest: !currentUser,
        guestAiEnabled,
      });
      if (!policy.useCloud) {
        throw new Error(policy.reason || 'NO_API_KEY');
      }
      const idToken = currentUser ? await getFreshIdToken(currentUser) : null;
      result = await analyzeTextWithGemini(targetPerson, rawText, allContacts, idToken);
      engineUsed = 'gemini';
      trackFeatureUsage('ai_analyze');
    } catch (err) {
      engineUsed = 'local';
      const errCode = err instanceof Error ? err.message : '';
      if (errCode === 'AI_DISABLED_BY_ADMIN') {
        setSharedAiEnabled(false);
      } else if (errCode === 'GUEST_AI_DISABLED') {
        setGuestAiEnabled(false);
      }
      const reasonMsg = formatGeminiFallbackReason(err, lang);
      if (
        errCode &&
        errCode !== 'NO_API_KEY' &&
        errCode !== 'LOCAL_ONLY_MODE'
      ) {
        usedFallback = true;
        fallbackReason = reasonMsg;
        showToast(reasonMsg, 'warning');
      }
      result = analyzeTextLocally(targetPerson, rawText, allContacts, lang);
      trackFeatureUsage('local_analyze');
    }

    setActiveEngine(engineUsed);

    const nowIso = new Date().toISOString();
    const updatedPerson: Person = JSON.parse(JSON.stringify(targetPerson));
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

    updateSinglePerson(targetPerson.id, () => updatedPerson);
    setIsAnalyzing(false);
    setDraftText('');
    setLastReport({
      personId: targetPerson.id,
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

  const handleAnalyzeText = async () => {
    if (!activePerson || isAnalyzing) return;
    await runAnalysisForPerson(activePerson, draftText, people);
  };

  const handleUndoAnalysis = () => {
    if (readOnlyRef.current) {
      showToast(tRef.current.readOnly.blockedActionToast, 'warning');
      return;
    }
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
      const policy = shouldUseCloudAi({
        preferenceMode: analyzerMode,
        isOnline: navigator.onLine,
        sharedAiEnabled,
        serverKeyConfigured,
        isGuest: !currentUser,
        guestAiEnabled,
      });
      if (!policy.useCloud) {
        throw new Error(policy.reason || 'NO_API_KEY');
      }
      const idToken = currentUser ? await getFreshIdToken(currentUser) : null;
      const answer = await askAdvisorWithGemini(activePerson, q, lang, idToken);
      setActiveEngine('gemini');
      setAdvisorAnswer(answer);
    } catch (err) {
      setActiveEngine('local');
      const errCode = err instanceof Error ? err.message : '';
      if (errCode === 'AI_DISABLED_BY_ADMIN') {
        setSharedAiEnabled(false);
      } else if (errCode === 'GUEST_AI_DISABLED') {
        setGuestAiEnabled(false);
      }
      if (errCode && errCode !== 'NO_API_KEY' && errCode !== 'LOCAL_ONLY_MODE') {
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

    trackFeatureUsage(mode === 'all' ? 'dossier_all' : 'dossier_single');
    setSummaryLoading(true);
    let data: DossierData;
    let engineUsed: 'gemini' | 'local' = 'gemini';

    try {
      const policy = shouldUseCloudAi({
        preferenceMode: analyzerMode,
        isOnline: navigator.onLine,
        sharedAiEnabled,
        serverKeyConfigured,
        isGuest: !currentUser,
        guestAiEnabled,
      });
      if (!policy.useCloud) {
        throw new Error(policy.reason || 'NO_API_KEY');
      }
      const idToken = currentUser ? await getFreshIdToken(currentUser) : null;
      data = await buildDossierWithGemini(mode, activePerson, people, lang, idToken);
      engineUsed = 'gemini';
    } catch (err) {
      engineUsed = 'local';
      const errCode = err instanceof Error ? err.message : '';
      if (errCode === 'AI_DISABLED_BY_ADMIN') {
        setSharedAiEnabled(false);
      } else if (errCode === 'GUEST_AI_DISABLED') {
        setGuestAiEnabled(false);
      }
      if (errCode && errCode !== 'NO_API_KEY' && errCode !== 'LOCAL_ONLY_MODE') {
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

  const handleGenerateGreeting = async (
    occasion: GreetingOccasion,
    tone: GreetingTone
  ): Promise<string> => {
    if (!activePerson) return '';
    try {
      const policy = shouldUseCloudAi({
        preferenceMode: analyzerMode,
        isOnline: navigator.onLine,
        sharedAiEnabled,
        serverKeyConfigured,
        isGuest: !currentUser,
        guestAiEnabled,
      });
      if (!policy.useCloud) {
        throw new Error(policy.reason || 'NO_API_KEY');
      }
      const idToken = currentUser ? await getFreshIdToken(currentUser) : null;
      const text = await generateGreetingWithGemini(
        activePerson,
        occasion,
        tone,
        lang,
        idToken
      );
      setActiveEngine('gemini');
      return text;
    } catch (err) {
      const errCode = err instanceof Error ? err.message : '';
      if (errCode && errCode !== 'NO_API_KEY' && errCode !== 'LOCAL_ONLY_MODE') {
        showToast(formatGeminiFallbackReason(err, lang), 'warning');
      }
      return buildLocalGreeting({ person: activePerson, occasion, tone, lang });
    }
  };

  const clearShareUrlParams = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let changed = false;
    for (const k of ['share', 'title', 'text', 'url']) {
      if (url.searchParams.has(k)) {
        url.searchParams.delete(k);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  };

  const handleShareTargetSubmit = async (
    targetPersonId: string | 'new',
    newName: string,
    sharedText: string
  ) => {
    setShareModalState({ open: false, text: '', suggestedName: '' });
    clearShareUrlParams();

    if (readOnlyRef.current) {
      showToast(tRef.current.readOnly.blockedActionToast, 'warning');
      return;
    }

    if (targetPersonId === 'new') {
      const nowIso = new Date().toISOString();
      const createdPerson: Person = {
        id: uid('person'),
        name: newName,
        subtitle: t.common.personalCard,
        colorId: 'emerald',
        group: uiDefaults.defaultGroups[0] || 'Друзья',
        isPinned: false,
        contactIntervalDays: 30,
        updatedAt: nowIso,
        lastContactAt: nowIso,
        columns: buildInitialColumnsForPerson(),
        rawNotes: [],
        meetings: [],
      };
      const nextPeople = [...people, createdPerson];
      setPeople(nextPeople);
      setActivePersonId(createdPerson.id);
      persistLocalSnapshot(nextPeople, createdPerson.id, currentScope);
      if (currentUser) {
        pushPersonUpdate(createdPerson, currentUser.uid);
      }
      const lines = sharedText.split(/\r?\n/);
      const cleanedSharedText =
        lines.length > 1 && lines[0].trim().toLowerCase() === newName.trim().toLowerCase()
          ? lines.slice(1).join('\n').trim()
          : sharedText;
      await runAnalysisForPerson(createdPerson, cleanedSharedText || sharedText, nextPeople);
      return;
    }

    const existing = people.find((p) => p.id === targetPersonId);
    if (existing) {
      setActivePersonId(existing.id);
      await runAnalysisForPerson(existing, sharedText, people);
    }
  };

  const handleApplyPwaUpdate = async () => {
    try {
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.update().catch(() => r.unregister())));
      }
    } catch {
      // ignore
    }
    window.location.reload();
  };

  const handleImportJsonFile = (file: File) => {
    if (readOnlyRef.current) {
      showToast(tRef.current.readOnly.blockedActionToast, 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const content = String(ev.target?.result || '');
        if (file.name.toLowerCase().endsWith('.vcf') || content.includes('BEGIN:VCARD')) {
          const parsedCards = parseVCardContacts(content);
          if (parsedCards.length === 0) {
            showToast(t.toasts.vcardEmpty, 'warning');
            return;
          }
          const nowIso = new Date().toISOString();
          const importedCards: Person[] = parsedCards.map((card, cardIdx) => {
            const colsMap = new Map<string, Person['columns'][number]>();
            for (const sec of uiDefaults.defaultSections) {
              const title = sec.title.trim();
              if (!title) continue;
              colsMap.set(title.toLowerCase(), {
                id: uid('col'),
                title,
                icon: sec.icon || '📌',
                isNew: false,
                facts: [],
              });
            }
            for (const f of card.facts) {
              const key = f.columnTitle.trim().toLowerCase();
              let col = colsMap.get(key);
              if (!col) {
                col = {
                  id: uid('col'),
                  title: f.columnTitle,
                  icon: f.icon || '📌',
                  isNew: true,
                  facts: [],
                };
                colsMap.set(key, col);
              }
              col.facts.push({
                id: uid('fact'),
                text: f.text,
                isNew: true,
                tag: 'fact',
                reason: '',
                prevText: '',
              });
            }
            return {
              id: uid('person'),
              name: card.name,
              subtitle: card.subtitle || t.common.personalCard,
              colorId: ['violet', 'blue', 'emerald', 'amber', 'rose', 'cyan'][(peopleRef.current.length + cardIdx) % 6],
              group: card.group || uiDefaults.defaultGroups[0] || 'Друзья',
              isPinned: false,
              contactIntervalDays: 30,
              updatedAt: nowIso,
              lastContactAt: nowIso,
              columns: Array.from(colsMap.values()),
              rawNotes: [],
              meetings: [],
            };
          });
          const nextPeople = [...peopleRef.current, ...importedCards];
          const nextActive = importedCards[0].id;
          setPeople(nextPeople);
          setActivePersonId(nextActive);
          setLastReport(null);
          persistLocalSnapshot(nextPeople, nextActive, currentScope);
          if (currentUser) {
            for (const c of importedCards) {
              await pushPersonUpdate(c, currentUser.uid);
            }
          }
          showToast(t.toasts.vcardImported(importedCards.length), 'success');
          return;
        }

        const parsed = JSON.parse(content);
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
      trackFeatureUsage('calendar_ics');
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
      trackFeatureUsage('calendar_ics');
      showToast(t.toasts.calendarExported(title), 'success');
    },
    [activePerson, showToast, t]
  );

  const hasModalOpen =
    accountOpen ||
    adminModalOpen ||
    deleteAccountOpen ||
    addPersonOpen ||
    addColumnOpen ||
    addMeetingOpen ||
    apiSettingsOpen ||
    greetingOpen ||
    shareModalState.open ||
    confirmState.open ||
    summaryOpen;

  const handleWorkspaceTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    workspaceSwipeRef.current = createSwipeSession({
      clientX: touch.clientX,
      clientY: touch.clientY,
      now: Date.now(),
      isMobileViewport: isMobileViewportWidth(window.innerWidth),
      isDrawerOpen: mobileSidebarOpen,
      hasBlockingOverlay: hasModalOpen || isDocumentScrollLocked(),
      ignoreTarget: shouldIgnoreSwipeTarget(e.target),
    });
  };

  const handleWorkspaceTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const session = workspaceSwipeRef.current;
    if (!session || session.mode !== 'open' || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const decision = evaluateSwipeMove(session, {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    if (decision === 'open') {
      workspaceSwipeRef.current = null;
      setMobileSidebarOpen(true);
    } else if (decision === 'cancel') {
      workspaceSwipeRef.current = null;
    }
  };

  const handleWorkspaceTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const session = workspaceSwipeRef.current;
    workspaceSwipeRef.current = null;
    if (!session || session.mode !== 'open' || e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const result = evaluateSwipeEnd(session, {
      clientX: touch.clientX,
      clientY: touch.clientY,
      now: Date.now(),
    });
    if (result === 'open') {
      setMobileSidebarOpen(true);
    }
  };

  const pendingCount = pendingQueue.upsertIds.length + pendingQueue.deleteIds.length;

  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider lang={lang} onChangeLang={handleChangeLanguage}>
        {authLoading ? (
          <motion.div
            key="screen-loading"
            variants={windowEnterVariants}
            initial="initial"
            animate="animate"
            transition={FAST_TRANSITION}
            className="min-h-screen flex flex-col items-center justify-center gap-3 p-6"
          >
            <div className="w-7 h-7 rounded-full border-2 border-zinc-500/30 border-t-zinc-400 animate-spin" />
            <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {t.common.loading}
            </div>
          </motion.div>
        ) : !currentUser && !isGuestMode ? (
          <motion.div
            key="screen-auth"
            variants={windowEnterVariants}
            initial="initial"
            animate="animate"
            transition={WINDOW_TRANSITION}
          >
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
          </motion.div>
        ) : (
          <motion.div
            key="screen-workspace"
            variants={fadeEnterVariants}
            initial="initial"
            animate="animate"
            transition={WINDOW_TRANSITION}
            className="min-h-screen flex"
          >
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
            defaultGroups={uiDefaults.defaultGroups}
            isAdmin={effectiveIsAdmin}
            onOpenAdminPanel={() => setAdminModalOpen(true)}
          />

          <div
            className="flex-1 min-w-0 flex flex-col touch-pan-y"
            onTouchStart={handleWorkspaceTouchStart}
            onTouchMove={handleWorkspaceTouchMove}
            onTouchEnd={handleWorkspaceTouchEnd}
            onTouchCancel={() => {
              workspaceSwipeRef.current = null;
            }}
          >
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

            {readOnlyMode && (
              <div
                role="status"
                className="px-4 py-2 border-b text-xs font-medium flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--warning-bg)',
                  borderColor: 'var(--warning-border)',
                  color: 'var(--warning-text)',
                }}
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>{t.readOnly.bannerTitle}</span>
              </div>
            )}

            {isClientVersionOutdated(APP_VERSION, minClientVersion) &&
              updateDismissedForVersion !== minClientVersion && (
                <div
                  role="status"
                  className="px-4 py-2 border-b text-xs font-medium flex flex-wrap items-center justify-between gap-2.5"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-hover)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                    <span>{t.pwa.updateBannerText(minClientVersion)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleApplyPwaUpdate}
                      className="px-2.5 py-1 rounded text-xs font-semibold hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--btn-primary-bg)',
                        color: 'var(--btn-primary-text)',
                      }}
                    >
                      {t.pwa.updateNowBtn}
                    </button>
                    <button
                      type="button"
                      aria-label={t.common.closeNotice}
                      onClick={() => setUpdateDismissedForVersion(minClientVersion)}
                      className="p-0.5 rounded opacity-70 hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            {announcement?.enabled &&
              announcement.text.trim() &&
              announcementDismissedText !== announcement.text && (
                <div
                  role="region"
                  aria-label={t.adminPanel.bannerTitle}
                  className="px-4 py-2 border-b text-xs font-medium flex items-center justify-between gap-3"
                  style={{
                    backgroundColor:
                      announcement.tone === 'danger'
                        ? 'var(--danger-bg)'
                        : announcement.tone === 'warning'
                        ? 'var(--warning-bg)'
                        : 'var(--bg-elevated)',
                    borderColor:
                      announcement.tone === 'danger'
                        ? 'var(--danger-border)'
                        : announcement.tone === 'warning'
                        ? 'var(--warning-border)'
                        : 'var(--border-color)',
                    color:
                      announcement.tone === 'danger'
                        ? 'var(--danger-text)'
                        : announcement.tone === 'warning'
                        ? 'var(--warning-text)'
                        : 'var(--text-primary)',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Megaphone className="w-3.5 h-3.5 shrink-0" />
                    <span className="break-words">{announcement.text}</span>
                  </div>
                  <button
                    type="button"
                    aria-label={t.common.closeNotice}
                    onClick={() => setAnnouncementDismissedText(announcement.text)}
                    className="p-0.5 rounded opacity-70 hover:opacity-100 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            <main className="max-w-[960px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1 flex flex-col">
              {poll?.enabled &&
                poll.question.trim() &&
                poll.options.length >= 2 &&
                pollDismissedId !== poll.id && (
                  <div
                    className="mb-5 rounded-lg border p-3.5 space-y-2.5"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                          <span>
                            {pollVotedMap[poll.id] ? t.pollWidget.votedBadge : t.pollWidget.badge}
                          </span>
                        </div>
                        <h3 className="text-[13.5px] font-semibold mt-0.5">{poll.question}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPollDismissedId(poll.id)}
                        aria-label={t.pollWidget.dismissAria}
                        className="p-1 rounded hover:bg-[var(--bg-hover)] shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {(() => {
                        const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
                        const myChoice = pollVotedMap[poll.id];
                        return poll.options.map((opt) => {
                          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                          const chosen = myChoice === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={Boolean(myChoice) || votingPoll}
                              onClick={() => void handleVotePoll(opt.id)}
                              className="relative overflow-hidden rounded-md border px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--bg-hover)] disabled:cursor-default"
                              style={{
                                backgroundColor: 'var(--bg-input)',
                                borderColor: chosen ? 'var(--accent)' : 'var(--border-color)',
                              }}
                            >
                              {myChoice && (
                                <span
                                  aria-hidden="true"
                                  className="absolute inset-y-0 left-0 opacity-15"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: 'var(--accent)',
                                  }}
                                />
                              )}
                              <div className="relative z-10 flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 font-medium">
                                  {chosen && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />}
                                  <span>{opt.label}</span>
                                </span>
                                {myChoice && (
                                  <span className="tabular-nums font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                    {pct}% · {t.pollWidget.votesCount(opt.votes)}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

              {!activePerson ? (
                <motion.div
                  key="person-empty"
                  variants={windowEnterVariants}
                  initial="initial"
                  animate="animate"
                  transition={FAST_TRANSITION}
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
                        if (readOnlyRef.current) {
                          showToast(tRef.current.readOnly.blockedActionToast, 'warning');
                          return;
                        }
                        const sample = createDefaultSampleState(sampleTemplate);
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
                </motion.div>
              ) : (
                <motion.div
                  key={activePerson.id}
                  variants={windowEnterVariants}
                  initial="initial"
                  animate="animate"
                  transition={FAST_TRANSITION}
                  className="flex flex-col gap-6"
                >
                <ProfileCard
                  person={activePerson}
                  defaultGroups={uiDefaults.defaultGroups}
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
                  onOpenGreeting={() => setGreetingOpen(true)}
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
                  quickQuestions={uiDefaults.quickAdvisorPrompts}
                  onDraftChange={setDraftText}
                  onFillDemo={() =>
                    setDraftText(sampleTemplate?.demoNoteText || DEMO_SAMPLE_TEXT)
                  }
                  onClearDraft={() => setDraftText('')}
                  onAnalyze={handleAnalyzeText}
                  onUndoAnalysis={handleUndoAnalysis}
                  onDismissReport={() => setLastReport(null)}
                  onAdvisorQueryChange={setAdvisorQuery}
                  onAskAdvisor={handleAskAdvisor}
                  onDismissAdvisor={() => setAdvisorAnswer('')}
                  onChatCleaned={() => {
                    trackFeatureUsage('chat_clean');
                    showToast(t.toasts.chatCleanedToast, 'info');
                  }}
                  onChatImported={(count) =>
                    showToast(t.toasts.chatImported(count), 'success')
                  }
                  onChatImportError={() =>
                    showToast(t.toasts.chatImportInvalid, 'error')
                  }
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
                </motion.div>
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
            isAdmin={effectiveIsAdmin}
            onOpenAdminPanel={() => {
              setAccountOpen(false);
              setAdminModalOpen(true);
            }}
            onSubmitFeedback={handleSubmitFeedback}
            myTickets={myTickets}
            loadingTickets={loadingTickets}
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
            onRequestDeleteAccount={
              currentUser
                ? () => {
                    setAccountOpen(false);
                    setDeleteAccountOpen(true);
                  }
                : undefined
            }
            onToast={showToast}
          />

          <AdminModal
            open={adminModalOpen}
            user={currentUser}
            onClose={() => setAdminModalOpen(false)}
            onConfigSynced={(patch) => {
              if (typeof patch.sharedAiEnabled === 'boolean') {
                setSharedAiEnabled(patch.sharedAiEnabled);
              }
              if (typeof patch.guestAiEnabled === 'boolean') {
                setGuestAiEnabled(patch.guestAiEnabled);
              }
              if (typeof patch.readOnlyMode === 'boolean') {
                setReadOnlyMode(patch.readOnlyMode);
              }
              if (patch.keyRouteMode) {
                setKeyRouteMode(patch.keyRouteMode);
              }
              if (typeof patch.serverKeyConfigured === 'boolean') {
                setServerKeyConfigured(patch.serverKeyConfigured);
              }
              if (patch.announcement) {
                setAnnouncement(patch.announcement);
              }
              if (patch.sampleTemplate) {
                setSampleTemplate(patch.sampleTemplate);
              }
              if (patch.poll) {
                setPoll(patch.poll);
              }
              if (patch.uiDefaults) {
                setUiDefaults(patch.uiDefaults);
              }
              if (patch.minClientVersion) {
                setMinClientVersion(patch.minClientVersion);
              }
            }}
            onToast={showToast}
          />

          <DeleteAccountModal
            open={deleteAccountOpen}
            user={currentUser}
            contactsCount={people.length}
            onClose={() => setDeleteAccountOpen(false)}
            onExportBackup={handleExportJson}
            onConfirmDelete={handleDeleteAccount}
          />

          <AddPersonModal
            open={addPersonOpen}
            defaultGroups={uiDefaults.defaultGroups}
            onClose={() => setAddPersonOpen(false)}
            onCreate={handleCreatePerson}
          />

          <AddColumnModal
            open={addColumnOpen}
            defaultSections={uiDefaults.defaultSections}
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
            mode={analyzerMode}
            sharedAiEnabled={sharedAiEnabled}
            serverKeyConfigured={serverKeyConfigured}
            onClose={() => setApiSettingsOpen(false)}
            onSaveMode={(nextMode) => {
              setAnalyzerMode(nextMode);
              saveAnalyzerMode(nextMode);
              showToast(
                nextMode === 'local' ? t.toasts.modeSavedLocal : t.toasts.modeSavedAuto,
                'success'
              );
              setApiSettingsOpen(false);
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

          <GreetingModal
            open={greetingOpen}
            person={activePerson}
            canUseAi={activeEngine === 'gemini'}
            onClose={() => setGreetingOpen(false)}
            onGenerateAi={handleGenerateGreeting}
            onCopy={copyText}
          />

          <ShareTargetModal
            open={shareModalState.open}
            people={people}
            initialText={shareModalState.text}
            suggestedNewName={shareModalState.suggestedName}
            onClose={() => {
              setShareModalState({ open: false, text: '', suggestedName: '' });
              clearShareUrlParams();
            }}
            onSubmit={handleShareTargetSubmit}
          />
          </motion.div>
        )}

        {/* Toast stack */}
        <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-2 max-w-[370px] w-[calc(100%-40px)] pointer-events-none">
          <AnimatePresence initial={false}>
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
                <motion.div
                  key={toastItem.id}
                  layout
                  role="status"
                  variants={toastVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={FAST_TRANSITION}
                  className="pointer-events-auto px-3.5 py-3 rounded-xl border shadow-lg text-[13px] font-medium flex items-center justify-between gap-2.5"
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </LanguageProvider>
    </MotionConfig>
  );
}
