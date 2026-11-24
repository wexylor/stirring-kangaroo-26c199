import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  CheckCircle2,
  Cpu,
  Database,
  FileText,
  KeyRound,
  Lock,
  Megaphone,
  MessageSquarePlus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { User } from '@firebase/auth';
import { useI18n } from '../utils/LanguageContext';
import { useScrollLock } from '../utils/scrollLock';
import { FAST_TRANSITION, TAB_SPRING_TRANSITION, WINDOW_TRANSITION, backdropVariants, windowEnterVariants } from '../utils/motionPresets';
import {
  computeLiveRemainingSeconds,
  computeLiveUptimeMs,
  formatDurationUptime,
  useLiveSecond,
} from '../utils/liveClock';
import type { AiKeyRouteMode, SlotHealthState } from '../utils/aiKeyRouter';
import { AI_MODEL_SPECS, type AiModelPreset } from '../utils/aiPolicy';
import type {
  AnnouncementTone,
  FeatureEventKey,
  SampleContactTemplate,
} from '../utils/adminOps';
import {
  checkAdminServerKeys,
  fetchAdminOverview,
  setAdminKeyRouteMode,
  testAdminWebhook,
  updateAdminAnnouncement,
  updateAdminFlags,
  updateAdminPoll,
  updateAdminSampleTemplate,
  updateAdminTicket,
  updateAdminWebhook,
  type AdminOverviewSnapshot,
} from '../services/gemini';
import {
  getFreshIdToken,
  setGlobalControlPatchInCloud,
} from '../services/firebase';
import { DEFAULT_GROUPS } from '../data/sampleData';
import { formatDateTime } from '../utils/storage';

type AdminTab = 'overview' | 'limits' | 'access' | 'journal';

interface AdminModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onConfigSynced: (patch: {
    sharedAiEnabled?: boolean;
    guestAiEnabled?: boolean;
    readOnlyMode?: boolean;
    keyRouteMode?: AiKeyRouteMode;
    serverKeyConfigured?: boolean;
    announcement?: AdminOverviewSnapshot['announcement'];
    sampleTemplate?: SampleContactTemplate;
    poll?: AdminOverviewSnapshot['poll'];
  }) => void;
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  open,
  user,
  onClose,
  onConfigSynced,
  onToast,
}) => {
  const { lang, t } = useI18n();
  useScrollLock(open);

  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<AdminOverviewSnapshot | null>(null);
  const [pwaStatusText, setPwaStatusText] = useState<string>('Browser');

  // Action states
  const [savingFlags, setSavingFlags] = useState(false);
  const [checkingKeys, setCheckingKeys] = useState(false);
  const [updatingRoute, setUpdatingRoute] = useState(false);

  // Banner form
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerTone, setBannerTone] = useState<AnnouncementTone>('info');
  const [bannerText, setBannerText] = useState('');
  const [savingBanner, setSavingBanner] = useState(false);

  // Poll form
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionsText, setPollOptionsText] = useState('');
  const [pollResetVotes, setPollResetVotes] = useState(false);
  const [savingPoll, setSavingPoll] = useState(false);

  // Starter contact template form
  const [tplName, setTplName] = useState('');
  const [tplSubtitle, setTplSubtitle] = useState('');
  const [tplGroup, setTplGroup] = useState('Друзья');
  const [tplNote, setTplNote] = useState('');
  const [tplFactsLines, setTplFactsLines] = useState('');
  const [savingTpl, setSavingTpl] = useState(false);

  // Webhook form
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [webhookTriggers, setWebhookTriggers] = useState({
    onInvalidKey: true,
    onQuotaExceeded: true,
    onTrafficSpike: true,
    onNewUser: false,
    onNewTicket: true,
    dailyDigestEnabled: false,
  });
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Ticket replies map
  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({});
  const [busyTicketId, setBusyTicketId] = useState<string | null>(null);

  // Live 1-second timer for server uptime + real-time key cooldown countdowns
  const liveNowMs = useLiveSecond(open);

  const hydrateFormsFromOverview = (data: AdminOverviewSnapshot) => {
    setBannerEnabled(data.announcement.enabled);
    setBannerTone(data.announcement.tone);
    setBannerText(data.announcement.text);

    setPollEnabled(data.poll.enabled);
    setPollQuestion(data.poll.question);
    setPollOptionsText(
      data.poll.options.length > 0
        ? data.poll.options.map((o) => o.label).join('\n')
        : 'Синхронизация календаря\nГолосовые заметки\nСовместные карточки'
    );

    setTplName(data.sampleTemplate.name);
    setTplSubtitle(data.sampleTemplate.subtitle);
    setTplGroup(data.sampleTemplate.group);
    setTplNote(data.sampleTemplate.demoNoteText);
    setTplFactsLines(
      data.sampleTemplate.facts
        .map((f) => `${f.columnTitle} | ${f.icon} | ${f.text}`)
        .join('\n')
    );

    setWebhookTriggers(data.webhook.triggers);
  };

  const loadOverview = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getFreshIdToken(user);
      if (!token) throw new Error('NO_TOKEN');
      const data = await fetchAdminOverview(token);
      setOverview(data);
      hydrateFormsFromOverview(data);
      onConfigSynced({
        sharedAiEnabled: data.flags.sharedAiEnabled,
        guestAiEnabled: data.flags.guestAiEnabled,
        readOnlyMode: data.flags.readOnlyMode,
        keyRouteMode: data.flags.keyRouteMode,
        announcement: data.announcement,
        sampleTemplate: data.sampleTemplate,
        poll: data.poll,
      });
    } catch {
      onToast(t.account.adminToggleError, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadOverview();

    const inspectPwa = async () => {
      try {
        const swActive =
          typeof navigator !== 'undefined' &&
          'serviceWorker' in navigator &&
          Boolean(navigator.serviceWorker.controller);
        const cacheCount =
          typeof caches !== 'undefined' ? (await caches.keys()).length : 0;
        const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
        setPwaStatusText(
          `${swActive ? 'SW Ready' : 'No SW'} · ${cacheCount} cache · ${
            online ? 'Online' : 'Offline'
          }`
        );
      } catch {
        setPwaStatusText('Standard');
      }
    };
    void inspectPwa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const liveUptimeText = useMemo(() => {
    if (!overview?.serverStartedAtMs) return '00:00:00';
    return formatDurationUptime(
      computeLiveUptimeMs(overview.serverStartedAtMs, liveNowMs),
      lang
    );
  }, [overview?.serverStartedAtMs, liveNowMs, lang]);

  const openTicketsCount = useMemo(
    () => overview?.tickets.filter((tk) => tk.status === 'open').length ?? 0,
    [overview?.tickets]
  );

  const handleSelectModelPreset = async (preset: AiModelPreset) => {
    if (!user || !overview || savingFlags || overview.flags.aiModelPreset === preset) return;
    setSavingFlags(true);
    try {
      const token = await getFreshIdToken(user);
      if (!token) throw new Error('NO_TOKEN');
      const res = await updateAdminFlags(token, { aiModelPreset: preset });
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              geminiModel: res.geminiModel,
              flags: { ...prev.flags, ...res.flags },
            }
          : prev
      );
      await setGlobalControlPatchInCloud(user, { aiModelPreset: preset }).catch(() => {});
      onToast(t.adminPanel.modelSavedToast, 'success');
    } catch {
      onToast(t.account.adminToggleError, 'error');
    } finally {
      setSavingFlags(false);
    }
  };

  const handleToggleFlag = async (
    key: 'sharedAiEnabled' | 'guestAiEnabled' | 'readOnlyMode',
    nextVal: boolean
  ) => {
    if (!user || !overview || savingFlags) return;
    setSavingFlags(true);
    try {
      const token = await getFreshIdToken(user);
      if (!token) throw new Error('NO_TOKEN');
      const res = await updateAdminFlags(token, { [key]: nextVal });
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              flags: { ...prev.flags, ...res.flags },
            }
          : prev
      );
      onConfigSynced(res.flags);
      await setGlobalControlPatchInCloud(user, { [key]: nextVal }).catch(() => {});
      onToast(t.common.save + ': OK', 'success');
    } catch {
      onToast(t.account.adminToggleError, 'error');
    } finally {
      setSavingFlags(false);
    }
  };

  const handleChangeKeyRoute = async (routeMode: AiKeyRouteMode) => {
    if (!user || updatingRoute) return;
    setUpdatingRoute(true);
    try {
      const token = await getFreshIdToken(user);
      if (!token) throw new Error('NO_TOKEN');
      const res = await setAdminKeyRouteMode(token, routeMode);
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              flags: { ...prev.flags, keyRouteMode: routeMode },
              keyStatus: res.status,
            }
          : prev
      );
      onConfigSynced({
        keyRouteMode: routeMode,
        serverKeyConfigured: res.serverKeyConfigured,
      });
      await setGlobalControlPatchInCloud(user, { keyRouteMode: routeMode }).catch(() => {});
      onToast(t.account.adminKeyRouteSaved, 'success');
    } catch {
      onToast(t.account.adminKeyRouteError, 'error');
    } finally {
      setUpdatingRoute(false);
    }
  };

  const handlePingGemini = async () => {
    if (!user || checkingKeys) return;
    setCheckingKeys(true);
    try {
      const token = await getFreshIdToken(user);
      if (!token) throw new Error('NO_TOKEN');
      const res = await checkAdminServerKeys(token);
      setOverview((prev) => (prev ? { ...prev, keyStatus: res.status } : prev));
      onConfigSynced({ serverKeyConfigured: res.serverKeyConfigured });
      const anyHealthy =
        res.status.slots.primary.health === 'ok' || res.status.slots.backup.health === 'ok';
      onToast(
        anyHealthy ? t.account.adminKeysCheckedOk : t.account.adminKeysCheckedMissing,
        anyHealthy ? 'success' : 'warning'
      );
    } catch {
      onToast(t.account.adminKeysCheckError, 'error');
    } finally {
      setCheckingKeys(false);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || savingBanner) return;
    setSavingBanner(true);
    try {
      const token = await getFreshIdToken(user);
      if (!token) throw new Error('NO_TOKEN');
      const payload = {
        enabled: bannerEnabled,
        tone: bannerTone,
        text: bannerText.trim(),
      };
      const res = await updateAdminAnnouncement(token, payload);
      setOverview((prev) => (prev ? { ...prev, announcement: res.announcement } : prev));
      onConfigSynced({ announcement: res.announcement });
      await setGlobalControlPatchInCloud(user, { announcement: res.announcement }).catch(() => {});
      onToast(t.adminPanel.bannerSavedToast, 'success');
    } catch {
      onToast(t.account.adminToggleError, 'error');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleSavePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || savingPoll) return;
    setSavingPoll(true);
    try {
      const token = await getFreshIdToken(user);
      if (!token) throw new Error('NO_TOKEN');
      const existingOptions = overview?.poll.options || [];
      const lines = pollOptionsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5);

      const options = lines.map((label, idx) => {
        const match = existingOptions.find(
          (o) => o.label.toLowerCase() === label.toLowerCase()
        );
        return {
          id: match?.id || `opt_${idx + 1}`,
          label,
          votes: pollResetVotes ? 0 : match?.votes ?? 0,
        };
      });

      const res = await updateAdminPoll(token, {
        enabled: pollEnabled,
        question: pollQuestion.trim(),
        options,
        resetVotes: pollResetVotes,
      });
      setOverview((prev) => (prev ? { ...prev, poll: res.poll } : prev));
      onConfigSynced({ poll: res.poll });
      setPollResetVotes(false);
      await setGlobalControlPatchInCloud(user, { poll: res.poll }).catch(() => {});
      onToast(t.adminPanel.pollSavedToast, 'success');
    } catch {
      onToast(t.account.adminToggleError, 'error');
    } finally {
      setSavingPoll(false);
    }
  };

  const handleSaveTemplate = async (reset = false) => {
    if (!user || savingTpl) return;
    setSavingTpl(true);
    try {
      const token = await getFreshIdToken(user);
      if (!token) throw new Error('NO_TOKEN');
      const facts = tplFactsLines
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split('|').map((s) => s.trim());
          if (parts.length >= 3) {
            return { columnTitle: parts[0], icon: parts[1] || '📌', text: parts.slice(2).join(' | ') };
          }
          if (parts.length === 2) {
            return { columnTitle: parts[0], icon: '📌', text: parts[1] };
          }
          return { columnTitle: 'Нравится', icon: '📌', text: line };
        })
        .filter((f) => f.text.length > 0);

      const res = await updateAdminSampleTemplate(
        token,
        reset
          ? { reset: true }
          : {
              name: tplName.trim() || 'Алина',
              subtitle: tplSubtitle.trim(),
              group: tplGroup,
              demoNoteText: tplNote.trim(),
              facts,
            }
      );
      setOverview((prev) => (prev ? { ...prev, sampleTemplate: res.sampleTemplate } : prev));
      setTplName(res.sampleTemplate.name);
      setTplSubtitle(res.sampleTemplate.subtitle);
      setTplGroup(res.sampleTemplate.group);
      setTplNote(res.sampleTemplate.demoNoteText);
      setTplFactsLines(
        res.sampleTemplate.facts
          .map((f) => `${f.columnTitle} | ${f.icon} | ${f.text}`)
          .join('\n')
      );
      onConfigSynced({ sampleTemplate: res.sampleTemplate });
      await setGlobalControlPatchInCloud(user, { sampleTemplate: res.sampleTemplate }).catch(
        () => {}
      );
      onToast(t.adminPanel.templateSavedToast, 'success');
    } catch {
      onToast(t.account.adminToggleError, 'error');
    } finally {
      setSavingTpl(false);
    }
  };

  const handleSaveWebhook = async (clearUrl = false) => {
    if (!user || savingWebhook) return;
    setSavingWebhook(true);
    try {
      const token = await getFreshIdToken(user);
      if (!token) throw new Error('NO_TOKEN');
      const res = await updateAdminWebhook(token, {
        ...(clearUrl ? { clearUrl: true } : { webhookUrl: webhookUrlInput.trim() }),
        triggers: webhookTriggers,
      });
      setOverview((prev) => (prev ? { ...prev, webhook: res.webhook } : prev));
      if (clearUrl || webhookUrlInput.trim()) {
        setWebhookUrlInput('');
      }
      onToast(t.adminPanel.webhookSavedToast, 'success');
    } catch {
      onToast(t.adminPanel.webhookErrorToast, 'error');
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleTestWebhook = async (kind: 'test' | 'digest') => {
    if (!user || testingWebhook) return;
    setTestingWebhook(true);
    try {
      const token = await getFreshIdToken(user);
      if (!token) throw new Error('NO_TOKEN');
      const res = await testAdminWebhook(token, kind);
      setOverview((prev) => (prev ? { ...prev, webhook: res.webhook } : prev));
      onToast(t.adminPanel.webhookTestOkToast, 'success');
    } catch {
      onToast(t.adminPanel.webhookErrorToast, 'error');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleTicketAction = async (
    ticketId: string,
    action: 'resolve' | 'reopen' | 'delete',
    publishToBanner = false
  ) => {
    if (!user || busyTicketId) return;
    setBusyTicketId(ticketId);
    try {
      const token = await getFreshIdToken(user);
      if (!token) throw new Error('NO_TOKEN');
      const reply = (ticketReplies[ticketId] || '').trim();
      const res = await updateAdminTicket(token, {
        id: ticketId,
        action,
        reply,
        publishToBanner,
      });
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              tickets: res.tickets,
              ...(res.announcement ? { announcement: res.announcement } : {}),
            }
          : prev
      );
      if (res.announcement) {
        setBannerEnabled(res.announcement.enabled);
        setBannerTone(res.announcement.tone);
        setBannerText(res.announcement.text);
        onConfigSynced({ announcement: res.announcement });
        await setGlobalControlPatchInCloud(user, {
          announcement: res.announcement,
        }).catch(() => {});
      }
    } catch {
      onToast(t.account.adminToggleError, 'error');
    } finally {
      setBusyTicketId(null);
    }
  };

  const maxFeatureCount = useMemo(() => {
    if (!overview) return 1;
    return Math.max(
      1,
      ...Object.values(overview.telemetry.featureCounters)
    );
  }, [overview]);

  const featureEntries = useMemo(
    () =>
      (Object.keys(t.adminPanel.featureLabels) as FeatureEventKey[]).map((key) => ({
        key,
        label: t.adminPanel.featureLabels[key],
        count: overview?.telemetry.featureCounters[key] ?? 0,
      })),
    [t.adminPanel.featureLabels, overview?.telemetry.featureCounters]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="admin-console-modal"
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={FAST_TRANSITION}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-label={t.adminPanel.title}
        >
          <motion.div
            variants={windowEnterVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={WINDOW_TRANSITION}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] rounded-xl border flex flex-col shadow-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--success-text)' }} />
                <h2 className="font-display text-base font-semibold truncate">
                  {t.adminPanel.title}
                </h2>
                <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  v{overview?.appVersion || '2.4.0'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={loadOverview}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium hover:bg-[var(--bg-hover)] disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{t.adminPanel.refreshBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.common.closeWindow}
                  className="w-8 h-8 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4 Navigation Tabs */}
            <div
              role="tablist"
              aria-label={t.adminPanel.title}
              className="px-5 py-2 border-b flex items-center gap-1.5 overflow-x-auto thin-scrollbar shrink-0"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
              }}
            >
              {(
                [
                  { id: 'overview', label: t.adminPanel.tabs.overview },
                  { id: 'limits', label: t.adminPanel.tabs.limits },
                  { id: 'access', label: t.adminPanel.tabs.access },
                  {
                    id: 'journal',
                    label:
                      openTicketsCount > 0
                        ? `${t.adminPanel.tabs.journal} (${openTicketsCount})`
                        : t.adminPanel.tabs.journal,
                  },
                ] as const
              ).map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(item.id)}
                    className="relative px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
                    style={{
                      color: active ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    }}
                  >
                    {active && (
                      <motion.span
                        layoutId="adminTabActive"
                        transition={TAB_SPRING_TRANSITION}
                        className="absolute inset-0 rounded-md"
                        style={{ backgroundColor: 'var(--btn-primary-bg)' }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-6 thin-scrollbar">
              {loading && !overview ? (
                <div className="py-16 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t.adminPanel.loadingText}
                </div>
              ) : !overview ? null : tab === 'overview' ? (
                <div className="space-y-6">
                  {/* Environment Status Strip */}
                  <section className="space-y-2.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      {t.adminPanel.envTitle}
                    </h3>
                    <div
                      className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {t.adminPanel.uptimeLabel}
                        </div>
                        <div className="text-sm font-mono font-semibold tabular-nums mt-0.5">
                          {liveUptimeText}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {t.adminPanel.modelLabel}
                        </div>
                        <div className="text-sm font-mono font-medium truncate mt-0.5">
                          {overview.geminiModel}
                        </div>
                        <div className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                          {t.adminPanel.modelPresets[overview.flags.aiModelPreset]?.label}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {t.adminPanel.rtdbLabel}
                        </div>
                        <div
                          className="text-sm font-medium tabular-nums mt-0.5"
                          style={{
                            color: overview.rtdbStatus.connected
                              ? 'var(--success-text)'
                              : 'var(--danger-text)',
                          }}
                        >
                          {overview.rtdbStatus.connected
                            ? t.adminPanel.rtdbOnline(overview.rtdbStatus.latencyMs)
                            : t.adminPanel.rtdbOffline}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {t.adminPanel.pwaLabel}
                        </div>
                        <div className="text-xs font-mono truncate mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {pwaStatusText}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Metrics Grid */}
                  <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {[
                      { label: t.adminPanel.kpiRequests, value: overview.telemetry.totalRequests },
                      { label: t.adminPanel.kpiAvgLatency, value: `${overview.telemetry.avgLatencyMs} ms` },
                      { label: t.adminPanel.kpiTokens, value: overview.telemetry.totalTokens.toLocaleString() },
                      {
                        label: t.adminPanel.kpiCacheHits,
                        value: overview.telemetry.advisorCacheHits + overview.telemetry.dossierCacheHits,
                      },
                      { label: t.adminPanel.kpiDossierRebuilds, value: overview.telemetry.dossierRebuildCount },
                      {
                        label: t.adminPanel.kpiTokensSaved,
                        value: overview.telemetry.tokensSavedEstimate.toLocaleString(),
                      },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="p-3 rounded-lg border"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-color)',
                        }}
                      >
                        <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                          {kpi.label}
                        </div>
                        <div className="text-base font-mono font-semibold tabular-nums mt-1">
                          {kpi.value}
                        </div>
                      </div>
                    ))}
                  </section>

                  {/* Endpoint Latency & Token Table + Feature Popularity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <section
                      className="p-4 rounded-lg border space-y-3"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Activity className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                        <span>{t.adminPanel.endpointsTitle}</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr
                              className="border-b text-left"
                              style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                            >
                              <th className="py-1.5 font-medium">Endpoint</th>
                              <th className="py-1.5 text-right font-medium">Req</th>
                              <th className="py-1.5 text-right font-medium">Avg ms</th>
                              <th className="py-1.5 text-right font-medium">Tokens</th>
                              <th className="py-1.5 text-right font-medium">Cache</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y font-mono tabular-nums" style={{ borderColor: 'var(--border-color)' }}>
                            {overview.telemetry.endpointStats.map((ep) => (
                              <tr key={ep.endpoint} className="h-9">
                                <td className="font-medium">/{ep.endpoint}</td>
                                <td className="text-right">{ep.requests}</td>
                                <td className="text-right">{ep.avgLatencyMs}</td>
                                <td className="text-right">{ep.totalTokens}</td>
                                <td className="text-right" style={{ color: 'var(--success-text)' }}>
                                  {ep.cacheHits}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section
                      className="p-4 rounded-lg border space-y-3"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Database className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                        <span>{t.adminPanel.featuresTitle}</span>
                      </div>
                      <div className="space-y-2.5">
                        {featureEntries.map((item) => {
                          const pct = Math.round((item.count / maxFeatureCount) * 100);
                          return (
                            <div key={item.key} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                <span className="font-mono font-medium tabular-nums">
                                  {item.count}
                                </span>
                              </div>
                              <div
                                className="h-1.5 rounded-full overflow-hidden"
                                style={{ backgroundColor: 'var(--bg-elevated)' }}
                              >
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${item.count > 0 ? Math.max(6, pct) : 0}%`,
                                    backgroundColor: 'var(--accent)',
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>

                  {/* Daily Mini-Digest Card */}
                  <section
                    className="p-4 rounded-lg border space-y-2.5"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>
                        {t.adminPanel.digestTitle} ({overview.telemetry.dailyDigest.dateKey})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {t.adminPanel.digestActiveUsers}:{' '}
                        </span>
                        <span className="font-mono font-semibold tabular-nums">
                          {overview.telemetry.dailyDigest.activeVisitors}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {t.adminPanel.digestAiCalls}:{' '}
                        </span>
                        <span className="font-mono font-semibold tabular-nums">
                          {overview.telemetry.dailyDigest.aiRequests}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {t.adminPanel.digestErrors}:{' '}
                        </span>
                        <span
                          className="font-mono font-semibold tabular-nums"
                          style={{
                            color:
                              overview.telemetry.dailyDigest.aiErrors > 0
                                ? 'var(--danger-text)'
                                : 'inherit',
                          }}
                        >
                          {overview.telemetry.dailyDigest.aiErrors}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {t.adminPanel.digestOpenTickets}:{' '}
                        </span>
                        <span className="font-mono font-semibold tabular-nums">
                          {overview.telemetry.dailyDigest.openTickets}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              ) : tab === 'limits' ? (
                <div className="space-y-6">
                  {/* Core Feature Flags */}
                  <section className="space-y-3">
                    {(
                      [
                        {
                          key: 'sharedAiEnabled',
                          label: t.account.adminSharedAiLabel,
                          desc: t.account.adminSharedAiDesc,
                          val: overview.flags.sharedAiEnabled,
                          warningHighlight: false,
                        },
                        {
                          key: 'guestAiEnabled',
                          label: t.adminPanel.guestAiLabel,
                          desc: t.adminPanel.guestAiDesc,
                          val: overview.flags.guestAiEnabled,
                          warningHighlight: false,
                        },
                        {
                          key: 'readOnlyMode',
                          label: t.adminPanel.readOnlyLabel,
                          desc: t.adminPanel.readOnlyDesc,
                          val: overview.flags.readOnlyMode,
                          warningHighlight: true,
                        },
                      ] as const
                    ).map((flag) => (
                      <div
                        key={flag.key}
                        className="p-3.5 rounded-lg border flex items-center justify-between gap-4"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor:
                            flag.warningHighlight && flag.val
                              ? 'var(--warning-border)'
                              : 'var(--border-color)',
                        }}
                      >
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium flex items-center gap-1.5">
                            {flag.warningHighlight && <Lock className="w-3.5 h-3.5 shrink-0" />}
                            <span>{flag.label}</span>
                          </div>
                          <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {flag.desc}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={flag.val}
                          aria-label={flag.label}
                          disabled={savingFlags}
                          onClick={() => handleToggleFlag(flag.key, !flag.val)}
                          className="inline-flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: flag.val ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                            borderColor: 'var(--border-color)',
                            color: flag.val ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                          }}
                        >
                          <span>{flag.val ? t.account.adminSharedAiOn : t.account.adminSharedAiOff}</span>
                        </button>
                      </div>
                    ))}
                  </section>

                  {/* Gemini Model Switcher */}
                  <section
                    className="p-4 rounded-lg border space-y-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <Cpu className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />
                          <span>{t.adminPanel.modelSwitcherTitle}</span>
                        </div>
                        <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          {overview.geminiModel}
                        </span>
                      </div>
                      <p className="text-[11.5px]" style={{ color: 'var(--text-secondary)' }}>
                        {t.adminPanel.modelSwitcherDesc}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(['fast', 'balanced', 'accurate'] as const).map((presetKey) => {
                        const spec = AI_MODEL_SPECS[presetKey];
                        const copy = t.adminPanel.modelPresets[presetKey];
                        const active = overview.flags.aiModelPreset === presetKey;
                        return (
                          <button
                            key={presetKey}
                            type="button"
                            disabled={savingFlags}
                            aria-pressed={active}
                            onClick={() => handleSelectModelPreset(presetKey)}
                            className="p-3 rounded-lg border text-left transition-colors disabled:opacity-50 flex flex-col justify-between gap-1.5"
                            style={
                              active
                                ? {
                                    backgroundColor: 'var(--btn-primary-bg)',
                                    borderColor: 'var(--btn-primary-bg)',
                                    color: 'var(--btn-primary-text)',
                                  }
                                : {
                                    backgroundColor: 'var(--bg-elevated)',
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-primary)',
                                  }
                            }
                          >
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold whitespace-nowrap">
                                {copy.label}
                              </div>
                              <div
                                className="text-[11px] leading-snug"
                                style={{
                                  color: active ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                                  opacity: active ? 0.85 : 1,
                                }}
                              >
                                {copy.desc}
                              </div>
                            </div>
                            <div
                              className="text-[10.5px] font-mono tabular-nums"
                              style={{
                                color: active ? 'var(--btn-primary-text)' : 'var(--text-muted)',
                                opacity: active ? 0.8 : 1,
                              }}
                            >
                              {spec.modelId}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Server Key Routing & Live Test Ping */}
                  <section
                    className="p-4 rounded-lg border space-y-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <KeyRound className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />
                        <span>{t.account.adminKeyRoutingTitle}</span>
                      </div>

                      <button
                        type="button"
                        disabled={checkingKeys}
                        onClick={handlePingGemini}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 w-full sm:w-auto hover:bg-[var(--bg-hover)] disabled:opacity-55"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-color)',
                        }}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${checkingKeys ? 'animate-spin' : ''}`} />
                        <span>
                          {checkingKeys
                            ? t.adminPanel.pingingGeminiBtn
                            : t.adminPanel.pingGeminiBtn}
                        </span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: 'auto', label: t.account.adminKeyRouteAuto, disabled: false },
                          {
                            id: 'primary',
                            label: t.account.adminKeyRoutePrimary,
                            disabled: !overview.keyStatus.primaryConfigured,
                          },
                          {
                            id: 'backup',
                            label: t.account.adminKeyRouteBackup,
                            disabled: !overview.keyStatus.backupConfigured,
                          },
                        ] as const
                      ).map((opt) => {
                        const active = overview.keyStatus.routeMode === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={updatingRoute || opt.disabled}
                            onClick={() => handleChangeKeyRoute(opt.id)}
                            aria-pressed={active}
                            className="flex-1 min-w-fit px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-45"
                            style={
                              active
                                ? {
                                    backgroundColor: 'var(--btn-primary-bg)',
                                    borderColor: 'var(--btn-primary-bg)',
                                    color: 'var(--btn-primary-text)',
                                  }
                                : {
                                    backgroundColor: 'var(--bg-elevated)',
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-secondary)',
                                  }
                            }
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(
                        [
                          {
                            slotId: 'primary' as const,
                            title: t.account.adminKeyPrimarySlot,
                            envHint: t.account.adminKeyPrimaryEnvHint,
                            info: overview.keyStatus.slots.primary,
                          },
                          {
                            slotId: 'backup' as const,
                            title: t.account.adminKeyBackupSlot,
                            envHint: t.account.adminKeyBackupEnvHint,
                            info: overview.keyStatus.slots.backup,
                          },
                        ] as const
                      ).map((item) => {
                        const liveSec = computeLiveRemainingSeconds(
                          item.info.cooldownUntilMs,
                          liveNowMs
                        );
                        const health: SlotHealthState = !item.info.configured
                          ? 'unconfigured'
                          : liveSec > 0 && item.info.health === 'cooldown'
                          ? 'cooldown'
                          : liveSec === 0 && item.info.health === 'cooldown'
                          ? 'untested'
                          : item.info.health;

                        const statusLabel =
                          health === 'ok'
                            ? `${t.account.adminKeyHealthOk}${
                                item.info.lastLatencyMs ? ` · ${item.info.lastLatencyMs} ms` : ''
                              }`
                            : health === 'untested'
                            ? t.account.adminKeyHealthUntested
                            : health === 'cooldown'
                            ? item.info.lastErrorCode === 'RESOURCE_EXHAUSTED'
                              ? `${t.adminPanel.pingQuotaExhausted} · ${liveSec}с`
                              : t.account.adminKeyHealthCooldown(liveSec)
                            : health === 'invalid'
                            ? t.account.adminKeyHealthInvalid
                            : health === 'error'
                            ? item.info.lastErrorCode || t.account.adminKeyHealthError
                            : t.account.adminKeyHealthUnconfigured;

                        const isActiveSlot = overview.keyStatus.effectiveSlot === item.slotId;
                        const isStandbySlot =
                          !isActiveSlot &&
                          item.slotId === 'backup' &&
                          item.info.configured &&
                          overview.keyStatus.routeMode === 'auto';

                        return (
                          <div
                            key={item.slotId}
                            className="p-3 rounded-lg border space-y-1.5"
                            style={{
                              backgroundColor: 'var(--bg-elevated)',
                              borderColor: isActiveSlot
                                ? 'var(--success-border)'
                                : 'var(--border-color)',
                            }}
                          >
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-medium">{item.title}</span>
                              {isActiveSlot ? (
                                <span
                                  className="text-[11px] font-semibold whitespace-nowrap shrink-0"
                                  style={{ color: 'var(--success-text)' }}
                                >
                                  {t.account.adminKeyActiveTag}
                                </span>
                              ) : isStandbySlot ? (
                                <span
                                  className="text-[11px] whitespace-nowrap shrink-0"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {t.account.adminKeyStandbyTag}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-mono text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                                {item.envHint}
                              </span>
                              <span
                                className="font-mono font-semibold tabular-nums whitespace-nowrap shrink-0"
                                style={{
                                  color:
                                    health === 'ok'
                                      ? 'var(--success-text)'
                                      : health === 'cooldown'
                                      ? 'var(--warning-text)'
                                      : health === 'invalid' || health === 'error'
                                      ? 'var(--danger-text)'
                                      : 'var(--text-secondary)',
                                }}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {overview.keyStatus.lastFallbackReason &&
                      overview.keyStatus.lastFallbackFrom &&
                      overview.keyStatus.lastFallbackTo && (
                        <p className="text-xs" style={{ color: 'var(--warning-text)' }}>
                          {t.account.adminKeyLastFallbackNote(
                            overview.keyStatus.lastFallbackFrom === 'primary'
                              ? t.account.adminKeyPrimarySlot
                              : t.account.adminKeyBackupSlot,
                            overview.keyStatus.lastFallbackTo === 'primary'
                              ? t.account.adminKeyPrimarySlot
                              : t.account.adminKeyBackupSlot,
                            overview.keyStatus.lastFallbackReason
                          )}
                        </p>
                      )}
                  </section>

                  {/* Global Announcement Banner Editor */}
                  <form
                    onSubmit={handleSaveBanner}
                    className="p-4 rounded-lg border space-y-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Megaphone className="w-4 h-4" />
                        <span>{t.adminPanel.bannerTitle}</span>
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bannerEnabled}
                          onChange={(e) => setBannerEnabled(e.target.checked)}
                        />
                        <span>{t.adminPanel.bannerEnableLabel}</span>
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          { id: 'info', label: t.adminPanel.bannerToneInfo },
                          { id: 'warning', label: t.adminPanel.bannerToneWarning },
                          { id: 'danger', label: t.adminPanel.bannerToneDanger },
                        ] as const
                      ).map((toneOpt) => (
                        <button
                          key={toneOpt.id}
                          type="button"
                          onClick={() => setBannerTone(toneOpt.id)}
                          className="px-2.5 py-1 rounded border text-xs font-medium"
                          style={
                            bannerTone === toneOpt.id
                              ? {
                                  backgroundColor: 'var(--btn-primary-bg)',
                                  borderColor: 'var(--btn-primary-bg)',
                                  color: 'var(--btn-primary-text)',
                                }
                              : {
                                  backgroundColor: 'var(--bg-elevated)',
                                  borderColor: 'var(--border-color)',
                                  color: 'var(--text-secondary)',
                                }
                          }
                        >
                          {toneOpt.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setBannerEnabled(true);
                          setBannerTone('warning');
                          setBannerText(t.adminPanel.bannerPresetMaintenance);
                        }}
                        className="px-2.5 py-1 rounded border text-xs hover:bg-[var(--bg-hover)]"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                      >
                        + {t.adminPanel.bannerPresetMaintenance}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBannerEnabled(true);
                          setBannerTone('danger');
                          setBannerText(t.adminPanel.bannerPresetAiOff);
                        }}
                        className="px-2.5 py-1 rounded border text-xs hover:bg-[var(--bg-hover)]"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                      >
                        + {t.adminPanel.bannerPresetAiOff}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        placeholder={t.adminPanel.bannerPlaceholder}
                        className="flex-1 px-3 py-1.5 rounded-md border text-[13px] outline-none"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={savingBanner}
                        className="px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap"
                        style={{
                          backgroundColor: 'var(--btn-primary-bg)',
                          color: 'var(--btn-primary-text)',
                        }}
                      >
                        {t.adminPanel.bannerSaveBtn}
                      </button>
                    </div>
                  </form>

                  {/* Mini-Poll Editor */}
                  <form
                    onSubmit={handleSavePoll}
                    className="p-4 rounded-lg border space-y-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{t.adminPanel.pollEditorTitle}</span>
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pollEnabled}
                          onChange={(e) => setPollEnabled(e.target.checked)}
                        />
                        <span>{t.adminPanel.pollEnableLabel}</span>
                      </label>
                    </div>

                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder={t.adminPanel.pollQuestionPlaceholder}
                      className="w-full px-3 py-1.5 rounded-md border text-[13px] outline-none"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                      }}
                    />

                    <div>
                      <label className="block text-[11.5px] mb-1" style={{ color: 'var(--text-secondary)' }}>
                        {t.adminPanel.pollOptionsLabel}
                      </label>
                      <textarea
                        rows={3}
                        value={pollOptionsText}
                        onChange={(e) => setPollOptionsText(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border text-[13px] outline-none"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={pollResetVotes}
                          onChange={(e) => setPollResetVotes(e.target.checked)}
                        />
                        <span>{t.adminPanel.pollResetVotes}</span>
                      </label>
                      <button
                        type="submit"
                        disabled={savingPoll}
                        className="px-3.5 py-1.5 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--btn-primary-bg)',
                          color: 'var(--btn-primary-text)',
                        }}
                      >
                        {t.adminPanel.pollSaveBtn}
                      </button>
                    </div>
                  </form>
                </div>
              ) : tab === 'access' ? (
                <div className="space-y-6">
                  {/* Starter Contact Template Editor */}
                  <section
                    className="p-4 rounded-lg border space-y-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <FileText className="w-4 h-4" />
                        <span>{t.adminPanel.templateTitle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={savingTpl}
                          onClick={() => handleSaveTemplate(true)}
                          className="px-2.5 py-1 rounded border text-xs hover:bg-[var(--bg-hover)]"
                          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                        >
                          {t.adminPanel.templateResetBtn}
                        </button>
                        <button
                          type="button"
                          disabled={savingTpl}
                          onClick={() => handleSaveTemplate(false)}
                          className="px-3 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: 'var(--btn-primary-bg)',
                            color: 'var(--btn-primary-text)',
                          }}
                        >
                          {t.adminPanel.templateSaveBtn}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                          {t.adminPanel.templateNameLabel}
                        </label>
                        <input
                          type="text"
                          value={tplName}
                          onChange={(e) => setTplName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md border text-[13px] outline-none"
                          style={{
                            backgroundColor: 'var(--bg-input)',
                            borderColor: 'var(--border-color)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                          {t.adminPanel.templateSubtitleLabel}
                        </label>
                        <input
                          type="text"
                          value={tplSubtitle}
                          onChange={(e) => setTplSubtitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md border text-[13px] outline-none"
                          style={{
                            backgroundColor: 'var(--bg-input)',
                            borderColor: 'var(--border-color)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                          {t.adminPanel.templateGroupLabel}
                        </label>
                        <select
                          value={tplGroup}
                          onChange={(e) => setTplGroup(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md border text-[13px] outline-none"
                          style={{
                            backgroundColor: 'var(--bg-input)',
                            borderColor: 'var(--border-color)',
                          }}
                        >
                          {DEFAULT_GROUPS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                        {t.adminPanel.templateNoteLabel}
                      </label>
                      <textarea
                        rows={3}
                        value={tplNote}
                        onChange={(e) => setTplNote(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border text-[13px] outline-none"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                        {t.adminPanel.templateFactsLabel}
                      </label>
                      <textarea
                        rows={4}
                        value={tplFactsLines}
                        onChange={(e) => setTplFactsLines(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border text-xs font-mono outline-none"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                        }}
                      />
                    </div>
                  </section>

                  {/* Telegram / Discord / Webhook Alerts */}
                  <section
                    className="p-4 rounded-lg border space-y-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Bell className="w-4 h-4" />
                        <span>{t.adminPanel.webhookTitle}</span>
                      </div>
                      {overview.webhook.configured && overview.webhook.maskedTarget && (
                        <span className="text-xs font-mono" style={{ color: 'var(--success-text)' }}>
                          {t.adminPanel.webhookConfiguredMask(
                            overview.webhook.maskedTarget,
                            overview.webhook.provider || 'webhook'
                          )}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={webhookUrlInput}
                        onChange={(e) => setWebhookUrlInput(e.target.value)}
                        placeholder={t.adminPanel.webhookUrlPlaceholder}
                        className="flex-1 px-3 py-1.5 rounded-md border text-[13px] font-mono outline-none"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                        }}
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={savingWebhook}
                          onClick={() => handleSaveWebhook(false)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium"
                          style={{
                            backgroundColor: 'var(--btn-primary-bg)',
                            color: 'var(--btn-primary-text)',
                          }}
                        >
                          {t.adminPanel.webhookSaveBtn}
                        </button>
                        {overview.webhook.configured && (
                          <button
                            type="button"
                            disabled={savingWebhook}
                            onClick={() => handleSaveWebhook(true)}
                            className="px-2.5 py-1.5 rounded-md border text-xs hover:bg-[var(--bg-hover)]"
                            style={{ borderColor: 'var(--border-color)', color: 'var(--danger-text)' }}
                          >
                            {t.adminPanel.webhookClearBtn}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {(Object.keys(t.adminPanel.triggers) as Array<keyof typeof webhookTriggers>).map(
                        (k) => (
                          <label
                            key={k}
                            className="inline-flex items-center gap-2 text-xs cursor-pointer"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <input
                              type="checkbox"
                              checked={webhookTriggers[k]}
                              onChange={(e) =>
                                setWebhookTriggers((prev) => ({
                                  ...prev,
                                  [k]: e.target.checked,
                                }))
                              }
                            />
                            <span>{t.adminPanel.triggers[k]}</span>
                          </label>
                        )
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={testingWebhook || !overview.webhook.configured}
                        onClick={() => handleTestWebhook('test')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-[var(--bg-hover)] disabled:opacity-45"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-color)',
                        }}
                      >
                        <Send className="w-3 h-3" />
                        <span>{t.adminPanel.webhookTestBtn}</span>
                      </button>
                      <button
                        type="button"
                        disabled={testingWebhook || !overview.webhook.configured}
                        onClick={() => handleTestWebhook('digest')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-[var(--bg-hover)] disabled:opacity-45"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-color)',
                        }}
                      >
                        <span>{t.adminPanel.webhookSendDigestBtn}</span>
                      </button>
                      {overview.webhook.lastError && (
                        <span className="text-xs" style={{ color: 'var(--danger-text)' }}>
                          {overview.webhook.lastError}
                        </span>
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Admin Feedback Inbox */}
                  <section className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <MessageSquarePlus className="w-4 h-4" />
                      <span>{t.adminPanel.inboxTitle}</span>
                    </div>

                    {overview.tickets.length === 0 ? (
                      <div
                        className="p-4 rounded-lg border text-xs text-center"
                        style={{
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {t.adminPanel.inboxEmpty}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {overview.tickets.map((tk) => (
                          <div
                            key={tk.id}
                            className="p-3.5 rounded-lg border space-y-2"
                            style={{
                              backgroundColor: 'var(--bg-elevated)',
                              borderColor: 'var(--border-color)',
                            }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="font-semibold"
                                  style={{
                                    color:
                                      tk.type === 'bug' ? 'var(--warning-text)' : 'var(--info-text)',
                                  }}
                                >
                                  {tk.type === 'bug'
                                    ? t.adminPanel.ticketBug
                                    : t.adminPanel.ticketIdea}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-medium truncate">{tk.authorLabel}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
                                  v{tk.appVersion} · {tk.lang}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className="font-semibold"
                                  style={{
                                    color:
                                      tk.status === 'resolved'
                                        ? 'var(--success-text)'
                                        : 'var(--warning-text)',
                                  }}
                                >
                                  {tk.status === 'resolved'
                                    ? t.adminPanel.ticketStatusResolved
                                    : t.adminPanel.ticketStatusOpen}
                                </span>
                                <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                  {formatDateTime(tk.createdAt, lang)}
                                </span>
                              </div>
                            </div>

                            <p className="text-[13px] leading-relaxed">{tk.text}</p>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={ticketReplies[tk.id] ?? tk.adminReply ?? ''}
                                onChange={(e) =>
                                  setTicketReplies((prev) => ({
                                    ...prev,
                                    [tk.id]: e.target.value,
                                  }))
                                }
                                placeholder={t.adminPanel.ticketReplyPlaceholder}
                                className="flex-1 min-w-[180px] px-2.5 py-1 rounded border text-xs outline-none"
                                style={{
                                  backgroundColor: 'var(--bg-input)',
                                  borderColor: 'var(--border-color)',
                                }}
                              />
                              <button
                                type="button"
                                disabled={busyTicketId === tk.id}
                                onClick={() =>
                                  handleTicketAction(
                                    tk.id,
                                    tk.status === 'resolved' ? 'reopen' : 'resolve',
                                    false
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-medium hover:bg-[var(--bg-hover)]"
                                style={{
                                  backgroundColor: 'var(--bg-surface)',
                                  borderColor: 'var(--border-color)',
                                }}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>
                                  {tk.status === 'resolved'
                                    ? t.adminPanel.ticketReopenBtn
                                    : t.adminPanel.ticketResolveBtn}
                                </span>
                              </button>
                              <button
                                type="button"
                                disabled={
                                  busyTicketId === tk.id ||
                                  !(ticketReplies[tk.id] ?? tk.adminReply ?? '').trim()
                                }
                                onClick={() => handleTicketAction(tk.id, 'resolve', true)}
                                className="px-2.5 py-1 rounded border text-xs font-medium hover:bg-[var(--bg-hover)] disabled:opacity-40"
                                style={{
                                  backgroundColor: 'var(--bg-surface)',
                                  borderColor: 'var(--border-color)',
                                }}
                              >
                                {t.adminPanel.ticketPublishBannerBtn}
                              </button>
                              <button
                                type="button"
                                disabled={busyTicketId === tk.id}
                                onClick={() => handleTicketAction(tk.id, 'delete')}
                                aria-label={t.common.delete}
                                className="p-1.5 rounded border hover:bg-[var(--danger-bg)]"
                                style={{
                                  borderColor: 'var(--border-color)',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Recent Gemini Requests Log */}
                  <section className="space-y-2.5">
                    <h3 className="text-xs font-semibold">{t.adminPanel.requestsLogTitle}</h3>
                    {overview.telemetry.recentRequests.length === 0 ? (
                      <div
                        className="p-4 rounded-lg border text-xs text-center"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                      >
                        {t.adminPanel.requestsLogEmpty}
                      </div>
                    ) : (
                      <div
                        className="rounded-lg border overflow-x-auto"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <table className="w-full text-xs">
                          <thead>
                            <tr
                              className="border-b text-left"
                              style={{
                                backgroundColor: 'var(--bg-elevated)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <th className="px-3 py-2 font-medium">Time</th>
                              <th className="px-3 py-2 font-medium">Endpoint</th>
                              <th className="px-3 py-2 font-medium">Slot</th>
                              <th className="px-3 py-2 text-right font-medium">ms</th>
                              <th className="px-3 py-2 text-right font-medium">In/Out</th>
                              <th className="px-3 py-2 text-right font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody
                            className="divide-y font-mono tabular-nums"
                            style={{ borderColor: 'var(--border-color)' }}
                          >
                            {overview.telemetry.recentRequests.map((r) => (
                              <tr key={r.id} className="h-9">
                                <td className="px-3 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                                  {formatDateTime(r.timestamp, lang)}
                                </td>
                                <td className="px-3">/{r.endpoint}</td>
                                <td className="px-3">{r.cacheHit ? 'cache' : r.slotUsed || '-'}</td>
                                <td className="px-3 text-right">{r.latencyMs}</td>
                                <td className="px-3 text-right">
                                  {r.promptTokens}/{r.candidatesTokens}
                                </td>
                                <td
                                  className="px-3 text-right"
                                  style={{
                                    color: r.ok ? 'var(--success-text)' : 'var(--danger-text)',
                                  }}
                                >
                                  {r.ok ? (r.cacheHit ? 'HIT' : 'OK') : r.errorCode || 'ERR'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* System Events */}
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold">{t.adminPanel.eventsLogTitle}</h3>
                    {overview.events.length === 0 ? (
                      <div
                        className="p-4 rounded-lg border text-xs text-center"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                      >
                        {t.adminPanel.eventsLogEmpty}
                      </div>
                    ) : (
                      <ul
                        className="rounded-lg border divide-y text-xs"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        {overview.events.map((ev) => (
                          <li key={ev.id} className="px-3 py-2 flex items-center justify-between gap-3">
                            <span
                              style={{
                                color:
                                  ev.level === 'warning' || ev.level === 'error'
                                    ? 'var(--warning-text)'
                                    : 'var(--text-primary)',
                              }}
                            >
                              {ev.message}
                            </span>
                            <span className="font-mono tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                              {formatDateTime(ev.timestamp, lang)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
