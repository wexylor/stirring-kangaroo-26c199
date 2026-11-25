import React, { useEffect, useState } from 'react';
import type { User } from '@firebase/auth';
import {
  X,
  Mail,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Globe,
  Trash2,
  Download,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Cpu,
  Eye,
  EyeOff,
  MessageSquarePlus,
  Send,
  Copy,
  Check,
  MessageCircle,
  Share2,
} from 'lucide-react';
import type { AnalyzerPreferenceMode } from '../utils/aiPolicy';
import type { DossierData, MeetingType, Person } from '../types/notebook';
import type { UiDefaultSection, UserFeedbackTicketSummary } from '../utils/adminOps';
import {
  buildLocalGreeting,
  type GreetingOccasion,
  type GreetingTone,
} from '../utils/greetingGenerator';
import { AVATAR_COLORS, DEFAULT_GROUPS } from '../data/sampleData';
import {
  bindRealEmailToUser,
  getHumanFirebaseAuthError,
  getUserDisplayLabel,
  isSyntheticLoginEmail,
  resendVerificationForUser,
  sendPasswordResetForEmail,
} from '../services/firebase';
import { formatDateTime, getTodayInputDate } from '../utils/storage';
import {
  AUTHOR_INSTAGRAM_HANDLE,
  AUTHOR_INSTAGRAM_URL,
  type AppLang,
} from '../utils/preferences';
import { useI18n } from '../utils/LanguageContext';
import { translateGroupLabel } from '../utils/i18n';
import {
  canAdvanceDeleteStep1,
  canAdvanceDeleteStep2,
  canSubmitDeleteStep3,
  getDeleteConfirmKeyword,
  getNextDeleteStep,
  getPrevDeleteStep,
  type DeleteAccountStep,
} from '../utils/accountDelete';
import { AnimatePresence, motion } from 'motion/react';
import { useScrollLock } from '../utils/scrollLock';
import {
  FAST_TRANSITION,
  TAB_SPRING_TRANSITION,
  WINDOW_TRANSITION,
  backdropVariants,
  collapseVariants,
  getDirectionalSlideVariants,
  getStepDirection,
  modalPanelVariants,
  windowEnterVariants,
} from '../utils/motionPresets';
import { PWAInstallButton } from './PWAInstallButton';

const stepSlideVariants = getDirectionalSlideVariants(18);

interface ModalBackdropProps {
  open: boolean;
  onClose: () => void;
  large?: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const ModalWrapper: React.FC<ModalBackdropProps> = ({
  open,
  onClose,
  large,
  title,
  subtitle,
  children,
}) => {
  const { t } = useI18n();

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          role="dialog"
          aria-modal="true"
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={FAST_TRANSITION}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px] flex items-center justify-center p-4 overscroll-contain"
        >
          <motion.div
            key="modal-panel"
            variants={modalPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={WINDOW_TRANSITION}
            className={`w-full rounded-xl border shadow-2xl ${
              large
                ? 'max-w-[740px] max-h-[88vh] flex flex-col overflow-hidden p-0'
                : 'max-w-[440px] p-5 sm:p-6 max-h-[90vh] overflow-y-auto overscroll-contain thin-scrollbar'
            }`}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div
              className={`flex items-center justify-between gap-3 ${
                large ? 'px-6 py-4 border-b' : 'mb-4'
              }`}
              style={large ? { borderColor: 'var(--border-color)' } : undefined}
            >
              <div>
                <h2 className="font-display text-base font-semibold">{title}</h2>
                {subtitle && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t.common.closeWindow}
                className="w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ============================================================================
   1. ACCOUNT MODAL
   ============================================================================ */
interface AccountModalProps {
  open: boolean;
  user: User | null;
  authRevision?: number;
  pendingCount: number;
  isSyncing: boolean;
  onClose: () => void;
  onRefreshAccount?: () => Promise<{
    emailVerified: boolean;
    email: string | null;
    requiresRelogin?: boolean;
  } | null>;
  onManualSync: () => void;
  onLogout: () => void;
  onRequestDeleteAccount?: () => void;
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
  onSubmitFeedback?: (type: 'bug' | 'idea', text: string) => Promise<void>;
  myTickets?: UserFeedbackTicketSummary[];
  loadingTickets?: boolean;
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  open,
  user,
  authRevision = 0,
  pendingCount,
  isSyncing,
  onClose,
  onRefreshAccount,
  onManualSync,
  onLogout,
  onRequestDeleteAccount,
  isAdmin = false,
  onOpenAdminPanel,
  onSubmitFeedback,
  myTickets = [],
  loadingTickets = false,
  onToast,
}) => {
  const { lang, setLang, t } = useI18n();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [binding, setBinding] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [bindMessage, setBindMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'idea'>('bug');
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [uidCopied, setUidCopied] = useState(false);

  const runRefreshStatus = async (manual = false) => {
    if (!user || !onRefreshAccount || checkingStatus) return;
    setCheckingStatus(true);
    try {
      const res = await onRefreshAccount();
      if (res?.requiresRelogin) {
        setBindMessage({
          type: 'success',
          text: t.account.reloginMsg,
        });
      } else if (manual) {
        if (res?.emailVerified && !isSyntheticLoginEmail(res.email)) {
          onToast(t.account.emailConfirmedToast, 'success');
        } else {
          onToast(t.account.emailPendingToast, 'info');
        }
      }
    } catch (err) {
      if (manual) {
        onToast(getHumanFirebaseAuthError(err), 'error');
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (open) {
      setBindMessage(null);
      setNewEmail('');
      setCurrentPassword('');
      setShowChangeEmail(false);
      setFeedbackOpen(false);
      setFeedbackText('');
      setUidCopied(false);
      if (user && onRefreshAccount) {
        void runRefreshStatus(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !user || !onRefreshAccount) return;
    if (user.emailVerified && !isSyntheticLoginEmail(user.email)) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        void runRefreshStatus(false);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, authRevision]);

  void authRevision;
  const hasSyntheticLogin = user ? isSyntheticLoginEmail(user.email) : false;
  const loginShown =
    user?.email && user.email.endsWith('@notebook.app')
      ? user.email.replace('@notebook.app', '')
      : user?.email || '—';

  const handleBindEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || binding) return;
    setBinding(true);
    setBindMessage(null);

    try {
      const res = await bindRealEmailToUser(user, newEmail, currentPassword);
      setBindMessage({
        type: 'success',
        text: t.account.bindMailSentMsg(res.email),
      });
      setNewEmail('');
      setCurrentPassword('');
      onToast(t.account.bindMailSentToast, 'success');
    } catch (err) {
      const msg =
        err instanceof Error && !('code' in err)
          ? err.message
          : getHumanFirebaseAuthError(err);
      setBindMessage({ type: 'error', text: msg });
    } finally {
      setBinding(false);
    }
  };

  const handleResendVerify = async () => {
    if (!user) return;
    try {
      await resendVerificationForUser(user);
      onToast(t.account.verifySentToast(user.email || ''), 'success');
    } catch (err) {
      onToast(getHumanFirebaseAuthError(err), 'error');
    }
  };

  const handleSendReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetForEmail(user.email);
      onToast(t.account.resetSentToast(user.email), 'success');
    } catch (err) {
      onToast(getHumanFirebaseAuthError(err), 'error');
    }
  };

  const languageOptions: Array<{ code: AppLang; label: string }> = [
    { code: 'kk', label: 'Қазақша' },
    { code: 'ru', label: 'Русский' },
    { code: 'en', label: 'English' },
  ];

  return (
    <ModalWrapper open={open} onClose={onClose} title={t.account.title}>
      {user ? (
        <div className="space-y-4">
          <div
            className="divide-y rounded-lg border px-3.5 text-[13px]"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="py-2.5 flex justify-between gap-3" style={{ borderColor: 'var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t.account.name}</span>
              <span className="font-medium text-right break-all">{getUserDisplayLabel(user)}</span>
            </div>
            <div className="py-2.5 flex justify-between gap-3" style={{ borderColor: 'var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t.account.login}</span>
              <span className="font-medium text-right break-all">{loginShown}</span>
            </div>
            <div className="py-2.5 flex justify-between gap-3 items-center" style={{ borderColor: 'var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t.account.uidLabel}</span>
              <div className="inline-flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-[11.5px] truncate max-w-[175px]" title={user.uid}>
                  {user.uid}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(user.uid).catch(() => {});
                    setUidCopied(true);
                    onToast(t.account.uidCopiedToast, 'info');
                    setTimeout(() => setUidCopied(false), 1800);
                  }}
                  aria-label={t.account.copyUidAria}
                  title={t.account.copyUidAria}
                  className="p-1 rounded border hover:bg-[var(--bg-hover)] shrink-0"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: uidCopied ? 'var(--success-text)' : 'var(--text-secondary)',
                  }}
                >
                  {uidCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="py-2.5 flex justify-between gap-3 items-center" style={{ borderColor: 'var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t.account.email}</span>
              <div className="inline-flex items-center gap-1.5">
                {hasSyntheticLogin ? (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium"
                    style={{ color: 'var(--warning-text)' }}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t.account.notLinked}</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium"
                    style={{ color: user.emailVerified ? 'var(--success-text)' : 'var(--warning-text)' }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{user.emailVerified ? t.account.verified : t.account.pendingVerify}</span>
                  </span>
                )}
                {(hasSyntheticLogin || !user.emailVerified) && onRefreshAccount && (
                  <button
                    type="button"
                    onClick={() => void runRefreshStatus(true)}
                    disabled={checkingStatus}
                    title={t.account.checkStatusTitle}
                    aria-label={t.account.checkStatusAria}
                    className="p-1 rounded border hover:bg-[var(--bg-hover)] disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <RefreshCw className={`w-3 h-3 ${checkingStatus ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>
            <div className="py-2.5 flex justify-between gap-3 items-center" style={{ borderColor: 'var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t.account.syncLabel}</span>
              <span
                className="font-medium tabular-nums"
                style={{
                  color: pendingCount > 0 ? 'var(--warning-text)' : 'var(--success-text)',
                }}
              >
                {pendingCount > 0 ? t.account.syncPendingCount(pendingCount) : t.account.synced}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onManualSync}
            disabled={isSyncing}
            className="w-full py-2 px-3.5 rounded-lg border text-[13px] font-medium flex items-center justify-center gap-2 transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-60"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t.account.syncing : t.account.syncNow}</span>
          </button>

          <div
            className="p-3.5 rounded-lg border space-y-3"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <Mail className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                <span>{hasSyntheticLogin ? t.account.bindEmailTitle : t.account.manageEmailTitle}</span>
              </div>
              {!hasSyntheticLogin && (
                <button
                  type="button"
                  onClick={() => setShowChangeEmail((v) => !v)}
                  className="text-xs hover:underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {showChangeEmail ? t.common.hide : t.common.update}
                </button>
              )}
            </div>

            {hasSyntheticLogin ? (
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {t.account.bindEmailDesc}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {!user.emailVerified && (
                  <button
                    type="button"
                    onClick={handleResendVerify}
                    className="px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-[var(--bg-hover)]"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    {t.account.resendVerify}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSendReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-[var(--bg-hover)]"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{t.account.resetPassword}</span>
                </button>
              </div>
            )}

            <AnimatePresence initial={false}>
              {bindMessage && (
                <motion.div
                  key="bind-message"
                  variants={collapseVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={FAST_TRANSITION}
                  className="overflow-hidden"
                >
                  <div
                    className="p-2.5 rounded-md border text-xs leading-relaxed"
                    style={{
                      backgroundColor:
                        bindMessage.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                      borderColor:
                        bindMessage.type === 'success'
                          ? 'var(--success-border)'
                          : 'var(--danger-border)',
                      color:
                        bindMessage.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
                    }}
                  >
                    {bindMessage.text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {(hasSyntheticLogin || showChangeEmail) && (
                <motion.form
                  key="bind-email-form"
                  variants={collapseVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={FAST_TRANSITION}
                  onSubmit={handleBindEmail}
                  className="-mx-1 px-1 overflow-hidden"
                >
                <div className="pt-1 pb-0.5 space-y-2.5">
                <div>
                  <label
                    htmlFor="bindEmailInput"
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t.account.newEmailLabel}
                  </label>
                  <input
                    id="bindEmailInput"
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 rounded-md border text-[13px] outline-none"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="bindCurrentPasswordInput"
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t.account.currentPasswordLabel}
                  </label>
                  <input
                    id="bindCurrentPasswordInput"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t.account.currentPasswordPlaceholder}
                    className="w-full px-3 py-2 rounded-md border text-[13px] outline-none"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={binding}
                  className="w-full py-2 px-4 rounded-md text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)',
                  }}
                >
                  {binding ? t.account.sending : t.account.bindEmailBtn}
                </button>
                </div>
              </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t.account.localModeDesc}
          </p>
        </div>
      )}

      {user && isAdmin && onOpenAdminPanel && (
        <div
          className="mt-4 p-3.5 rounded-lg border flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--success-text)' }} />
              <span>{t.account.adminTitle}</span>
            </div>
            <p className="text-[11.5px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
              {t.account.openAdminPanelDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAdminPanel}
            className="px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
            }}
          >
            {t.account.openAdminPanelBtn}
          </button>
        </div>
      )}

      {onSubmitFeedback && (
        <div
          className="mt-4 rounded-lg border p-3"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => setFeedbackOpen((v) => !v)}
            aria-expanded={feedbackOpen}
            className="w-full flex items-center justify-between gap-2 text-left text-[13px] font-medium"
          >
            <span className="inline-flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />
              <span>{t.account.feedbackBtn}</span>
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {feedbackOpen ? t.common.hide : '▾'}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {feedbackOpen && (
              <motion.form
                key="feedback-form"
                variants={collapseVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={FAST_TRANSITION}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const clean = feedbackText.trim();
                  if (!clean || sendingFeedback) return;
                  setSendingFeedback(true);
                  try {
                    await onSubmitFeedback(feedbackType, clean);
                    setFeedbackText('');
                    setFeedbackOpen(false);
                  } finally {
                    setSendingFeedback(false);
                  }
                }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2.5">
                  <div className="text-[11.5px]" style={{ color: 'var(--text-secondary)' }}>
                    {t.account.feedbackTitle}
                  </div>
                  <div
                    className="grid grid-cols-2 gap-1 p-1 rounded-md border"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    {(['bug', 'idea'] as const).map((tp) => {
                      const active = feedbackType === tp;
                      return (
                        <button
                          key={tp}
                          type="button"
                          onClick={() => setFeedbackType(tp)}
                          aria-pressed={active}
                          className="py-1 px-2 rounded text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
                            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          {tp === 'bug' ? t.account.feedbackTypeBug : t.account.feedbackTypeIdea}
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    required
                    rows={3}
                    maxLength={1200}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={t.account.feedbackPlaceholder}
                    className="w-full px-3 py-2 rounded-md border text-[13px] outline-none resize-y"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sendingFeedback || !feedbackText.trim()}
                    className="w-full py-2 px-3 rounded-md text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--btn-primary-bg)',
                      color: 'var(--btn-primary-text)',
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingFeedback ? t.account.feedbackSendingBtn : t.account.feedbackSendBtn}</span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {t.account.myTicketsTitle}
            </div>
            {loadingTickets ? (
              <div className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                {t.common.loading}
              </div>
            ) : myTickets.length === 0 ? (
              <div className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                {t.account.myTicketsEmpty}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto thin-scrollbar pr-0.5">
                {myTickets.map((tk) => (
                  <div
                    key={tk.id}
                    className="p-2.5 rounded-md border text-xs space-y-1.5"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5">
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
                        {tk.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded border text-[10px]"
                            style={{
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {t.adminPanel.ticketTags[tag]}
                          </span>
                        ))}
                      </div>
                      <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {formatDateTime(tk.createdAt, lang)}
                      </span>
                    </div>
                    <p className="text-[12px] leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {tk.text}
                    </p>
                    {tk.adminReply && (
                      <div
                        className="p-2 rounded border text-[11.5px] leading-snug"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--success-border)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span className="font-semibold" style={{ color: 'var(--success-text)' }}>
                          {t.account.myTicketsReplyPrefix}{' '}
                        </span>
                        <span>{tk.adminReply}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Language switcher */}
      <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          <Globe className="w-3.5 h-3.5" />
          <span>{t.account.languageLabel}</span>
        </div>
        <div
          role="group"
          aria-label={t.account.languageLabel}
          className="grid grid-cols-3 gap-1 p-1 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-color)',
          }}
        >
          {languageOptions.map((opt) => {
            const active = lang === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                aria-pressed={active}
                onClick={() => setLang(opt.code)}
                className="py-1.5 px-2 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Author Instagram link */}
      <div className="mt-3">
        <a
          href={AUTHOR_INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-3.5 rounded-lg border text-[13px] flex items-center justify-between gap-3 transition-colors hover:bg-[var(--bg-hover)]"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>{t.account.authorLabel}</span>
          <span className="inline-flex items-center gap-1.5 font-medium font-mono text-xs">
            <span>{AUTHOR_INSTAGRAM_HANDLE}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </span>
        </a>
      </div>

      <div className="mt-3">
        <PWAInstallButton variant="modal" />
      </div>

      {user && onRequestDeleteAccount && (
        <div
          className="mt-4 p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--danger-bg)',
            borderColor: 'var(--danger-border)',
          }}
        >
          <div className="min-w-0">
            <div
              className="text-xs font-semibold flex items-center gap-1.5"
              style={{ color: 'var(--danger-text)' }}
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{t.account.deleteAccountTitle}</span>
            </div>
            <p className="text-[11.5px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {t.account.deleteAccountDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={onRequestDeleteAccount}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium shrink-0 transition-colors hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--danger-border)',
              color: 'var(--danger-text)',
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.account.deleteAccountBtn}</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          type="button"
          onClick={onLogout}
          className="px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors"
          style={{
            backgroundColor: user ? 'var(--bg-elevated)' : 'var(--btn-primary-bg)',
            color: user ? 'var(--text-primary)' : 'var(--btn-primary-text)',
          }}
        >
          {user ? t.account.logout : t.account.loginAction}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          {t.common.close}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ============================================================================
   1B. DELETE ACCOUNT MODAL (3-STAGE ANTI-ACCIDENT CONFIRMATION)
   ============================================================================ */
interface DeleteAccountModalProps {
  open: boolean;
  user: User | null;
  contactsCount: number;
  onClose: () => void;
  onExportBackup: () => void;
  onConfirmDelete: (currentPassword: string) => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  open,
  user,
  contactsCount,
  onClose,
  onExportBackup,
  onConfirmDelete,
}) => {
  const { lang, t } = useI18n();
  const [step, setStep] = useState<DeleteAccountStep>(1);
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [typedKeyword, setTypedKeyword] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const goToStep = (nextStep: DeleteAccountStep) => {
    setStepDirection(getStepDirection(step, nextStep));
    setStep(nextStep);
  };

  useEffect(() => {
    if (open) {
      setStep(1);
      setStepDirection(1);
      setAcknowledged(false);
      setTypedKeyword('');
      setPassword('');
      setShowPassword(false);
      setDeleting(false);
      setErrorMsg('');
    }
  }, [open]);

  if (!user) return null;

  const confirmKeyword = getDeleteConfirmKeyword(lang);
  const loginShown =
    user.email && user.email.endsWith('@notebook.app')
      ? user.email.replace('@notebook.app', '')
      : user.email || getUserDisplayLabel(user);

  const canStep1 = canAdvanceDeleteStep1(acknowledged);
  const canStep2 = canAdvanceDeleteStep2(typedKeyword, lang);
  const canStep3 = canSubmitDeleteStep3(password, deleting);

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleting) return;
    if (!password) {
      setErrorMsg(t.deleteAccount.emptyPasswordError);
      return;
    }

    setDeleting(true);
    setErrorMsg('');
    try {
      await onConfirmDelete(password);
    } catch (err) {
      const msg =
        err instanceof Error && !('code' in err)
          ? err.message
          : getHumanFirebaseAuthError(err);
      setErrorMsg(msg);
      setDeleting(false);
    }
  };

  return (
    <ModalWrapper
      open={open}
      onClose={() => {
        if (!deleting) onClose();
      }}
      title={t.deleteAccount.modalTitle}
      subtitle={t.deleteAccount.stepCounter(step, 3)}
    >
      {/* 3-step segmented indicator */}
      <div className="grid grid-cols-3 gap-1.5 mb-4" aria-hidden="true">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="h-1.5 rounded-full transition-colors"
            style={{
              backgroundColor:
                idx <= step ? 'var(--danger-text)' : 'var(--bg-elevated)',
              opacity: idx <= step ? (idx === step ? 1 : 0.45) : 1,
            }}
          />
        ))}
      </div>

      {/* Account identity summary */}
      <div
        className="mb-4 px-3 py-2.5 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="min-w-0 truncate">
          <span style={{ color: 'var(--text-secondary)' }}>
            {t.deleteAccount.targetAccountLabel}{' '}
          </span>
          <span className="font-semibold">{getUserDisplayLabel(user)}</span>
          {loginShown && loginShown !== getUserDisplayLabel(user) && (
            <span style={{ color: 'var(--text-muted)' }}> ({loginShown})</span>
          )}
        </div>
        <span className="tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>
          {t.deleteAccount.contactsCountWarning(contactsCount)}
        </span>
      </div>

      <div className="relative -mx-1 px-1 py-0.5 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={stepDirection}>
          {step === 1 && (
            <motion.div
              key="del-step-1"
              custom={stepDirection}
              variants={stepSlideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FAST_TRANSITION}
              className="space-y-4"
            >
              <div
                className="p-3.5 rounded-lg border space-y-2"
                style={{
                  backgroundColor: 'var(--danger-bg)',
                  borderColor: 'var(--danger-border)',
                }}
              >
                <h3 className="text-[13px] font-semibold" style={{ color: 'var(--danger-text)' }}>
                  {t.deleteAccount.step1Heading}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {t.deleteAccount.step1Warning}
                </p>
              </div>

              <div
                className="p-3 rounded-lg border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {t.deleteAccount.backupHint}
                </p>
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-[var(--bg-hover)] transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.deleteAccount.backupBtn}</span>
                </button>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-red-600 cursor-pointer shrink-0"
                />
                <span className="text-[13px] leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {t.deleteAccount.step1Checkbox}
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  disabled={!canStep1}
                  onClick={() => goToStep(getNextDeleteStep(1))}
                  className="px-4 py-2 rounded-md text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-45 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)',
                  }}
                >
                  {t.deleteAccount.nextBtn}
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.form
              key="del-step-2"
              custom={stepDirection}
              variants={stepSlideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FAST_TRANSITION}
              onSubmit={(e) => {
                e.preventDefault();
                if (canStep2) {
                  setErrorMsg('');
                  goToStep(getNextDeleteStep(2));
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <h3 className="text-[13.5px] font-semibold">{t.deleteAccount.step2Heading}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {t.deleteAccount.step2Instruction(confirmKeyword)}
                </p>
                <div
                  className="inline-block px-2.5 py-1 rounded border font-mono text-xs font-semibold tracking-wider select-all"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--danger-text)',
                  }}
                >
                  {confirmKeyword}
                </div>
              </div>

              <div>
                <input
                  id="deleteAccountKeywordInput"
                  type="text"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  value={typedKeyword}
                  onChange={(e) => setTypedKeyword(e.target.value)}
                  placeholder={t.deleteAccount.step2Placeholder(confirmKeyword)}
                  aria-label={t.deleteAccount.step2Heading}
                  className="w-full px-3 py-2 rounded-md border text-sm outline-none font-mono"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: canStep2 ? 'var(--danger-border)' : 'var(--border-color)',
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => goToStep(getPrevDeleteStep(2))}
                  className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  {t.deleteAccount.backBtn}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={!canStep2}
                    className="px-4 py-2 rounded-md text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-45 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--btn-primary-bg)',
                      color: 'var(--btn-primary-text)',
                    }}
                  >
                    {t.deleteAccount.nextBtn}
                  </button>
                </div>
              </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form
              key="del-step-3"
              custom={stepDirection}
              variants={stepSlideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FAST_TRANSITION}
              onSubmit={handleFinalSubmit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <h3 className="text-[13.5px] font-semibold" style={{ color: 'var(--danger-text)' }}>
                  {t.deleteAccount.step3Heading}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {t.deleteAccount.step3Instruction}
                </p>
              </div>

              <AnimatePresence initial={false}>
                {errorMsg && (
                  <motion.div
                    key="del-error"
                    variants={collapseVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={FAST_TRANSITION}
                    className="overflow-hidden"
                  >
                    <div
                      role="alert"
                      className="p-2.5 rounded-md border text-xs leading-relaxed break-words"
                      style={{
                        backgroundColor: 'var(--danger-bg)',
                        borderColor: 'var(--danger-border)',
                        color: 'var(--danger-text)',
                      }}
                    >
                      {errorMsg}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label
                  htmlFor="deleteAccountPasswordInput"
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t.deleteAccount.passwordLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id="deleteAccountPasswordInput"
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder={t.deleteAccount.passwordPlaceholder}
                    className="w-full pl-3 pr-10 py-2 rounded-md border text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? t.deleteAccount.hidePassword : t.deleteAccount.showPassword
                    }
                    aria-pressed={showPassword}
                    className="absolute right-1.5 w-7 h-7 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setErrorMsg('');
                    setPassword('');
                    goToStep(getPrevDeleteStep(3));
                  }}
                  className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)] disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  {t.deleteAccount.backBtn}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)] disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={!canStep3}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deleting ? t.deleteAccount.deletingBtn : t.deleteAccount.confirmDeleteBtn}</span>
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </ModalWrapper>
  );
};

/* ============================================================================
   2. ADD PERSON MODAL
   ============================================================================ */
interface AddPersonModalProps {
  open: boolean;
  defaultGroups?: string[];
  onClose: () => void;
  onCreate: (name: string, subtitle: string, colorId: string, group: string) => void;
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  open,
  defaultGroups,
  onClose,
  onCreate,
}) => {
  const { lang, t } = useI18n();
  const groupOptions =
    defaultGroups && defaultGroups.length > 0 ? defaultGroups : DEFAULT_GROUPS;
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [group, setGroup] = useState(groupOptions[0] || 'Друзья');
  const [colorId, setColorId] = useState('violet');

  useEffect(() => {
    if (open) {
      setName('');
      setSubtitle('');
      setGroup(groupOptions[0] || 'Друзья');
      setColorId('violet');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <ModalWrapper open={open} onClose={onClose} title={t.modals.newContactTitle}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onCreate(name.trim(), subtitle.trim(), colorId, group);
        }}
        className="space-y-3.5"
      >
        <div>
          <label
            htmlFor="newPersonNameInput"
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t.modals.nameReq}
          </label>
          <input
            id="newPersonNameInput"
            type="text"
            required
            maxLength={40}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.modals.namePlaceholder}
            className="w-full px-3 py-2 rounded-md border text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="newPersonNoteInput"
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t.modals.noteLabel}
          </label>
          <input
            id="newPersonNoteInput"
            type="text"
            maxLength={80}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder={t.modals.notePlaceholder}
            className="w-full px-3 py-2 rounded-md border text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="newPersonGroupSelect"
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t.modals.groupLabel}
          </label>
          <select
            id="newPersonGroupSelect"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full px-3 py-2 rounded-md border text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          >
            <option value="">{t.groups.none}</option>
            {groupOptions.map((g) => (
              <option key={g} value={g}>
                {translateGroupLabel(g, lang)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span
            className="block text-xs font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t.modals.colorLabel}
          </span>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-label={t.modals.colorAria(c.id)}
                onClick={() => setColorId(c.id)}
                className={`w-7 h-7 rounded-md border transition-transform ${
                  colorId === c.id ? 'ring-2 ring-[var(--text-primary)] scale-105' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.bg }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md text-[13px] font-medium hover:opacity-90"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
            }}
          >
            {t.common.create}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

/* ============================================================================
   3. ADD COLUMN MODAL
   ============================================================================ */
interface AddColumnModalProps {
  open: boolean;
  defaultSections?: UiDefaultSection[];
  onClose: () => void;
  onCreate: (title: string, icon: string) => void;
}

export const AddColumnModal: React.FC<AddColumnModalProps> = ({
  open,
  defaultSections,
  onClose,
  onCreate,
}) => {
  const { t } = useI18n();
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
    }
  }, [open]);

  return (
    <ModalWrapper open={open} onClose={onClose} title={t.modals.newSectionTitle}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onCreate(title.trim(), '');
        }}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="newColumnTitleInput"
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t.modals.sectionNameReq}
          </label>
          <input
            id="newColumnTitleInput"
            type="text"
            required
            maxLength={40}
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.modals.sectionPlaceholder}
            className="w-full px-3 py-2 rounded-md border text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          />
        </div>

        {defaultSections && defaultSections.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {t.modals.defaultSectionsSuggestLabel}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {defaultSections.map((sec) => (
                <button
                  key={`${sec.title}-${sec.icon}`}
                  type="button"
                  onClick={() => onCreate(sec.title, sec.icon)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium hover:bg-[var(--bg-hover)] transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>{sec.icon}</span>
                  <span>{sec.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md text-[13px] font-medium hover:opacity-90"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
            }}
          >
            {t.common.add}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

/* ============================================================================
   4. ADD MEETING / INTERACTION MODAL
   ============================================================================ */
interface AddMeetingModalProps {
  open: boolean;
  personName: string;
  onClose: () => void;
  onCreate: (date: string, type: MeetingType, summary: string) => void;
}

export const AddMeetingModal: React.FC<AddMeetingModalProps> = ({
  open,
  personName,
  onClose,
  onCreate,
}) => {
  const { t } = useI18n();
  const [date, setDate] = useState(getTodayInputDate());
  const [type, setType] = useState<MeetingType>('meeting');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (open) {
      setDate(getTodayInputDate());
      setType('meeting');
      setSummary('');
    }
  }, [open]);

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={t.modals.recordContactTitle(personName)}
      subtitle={t.modals.recordContactSubtitle}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!summary.trim()) return;
          onCreate(date, type, summary.trim());
        }}
        className="space-y-3.5"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="meetingDateInput"
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t.modals.dateReq}
            </label>
            <input
              id="meetingDateInput"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-md border text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="meetingTypeSelect"
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t.modals.formatLabel}
            </label>
            <select
              id="meetingTypeSelect"
              value={type}
              onChange={(e) => setType(e.target.value as MeetingType)}
              className="w-full px-3 py-2 rounded-md border text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
              }}
            >
              <option value="meeting">{t.meetings.types.meeting}</option>
              <option value="call">{t.meetings.types.call}</option>
              <option value="message">{t.meetings.types.message}</option>
              <option value="other">{t.meetings.types.other}</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="meetingSummaryInput"
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t.modals.summaryReq}
          </label>
          <textarea
            id="meetingSummaryInput"
            required
            autoFocus
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={t.modals.summaryPlaceholder}
            className="w-full px-3 py-2 rounded-md border text-sm outline-none resize-y"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md text-[13px] font-medium hover:opacity-90"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
            }}
          >
            {t.common.save}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

/* ============================================================================
   5. ANALYZER SETTINGS MODAL
   ============================================================================ */
interface ApiSettingsModalProps {
  open: boolean;
  mode: AnalyzerPreferenceMode;
  sharedAiEnabled: boolean;
  serverKeyConfigured: boolean;
  onClose: () => void;
  onSaveMode: (mode: AnalyzerPreferenceMode) => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  open,
  mode,
  sharedAiEnabled,
  serverKeyConfigured,
  onClose,
  onSaveMode,
}) => {
  const { t } = useI18n();
  const [selectedMode, setSelectedMode] = useState<AnalyzerPreferenceMode>(mode);

  useEffect(() => {
    if (open) setSelectedMode(mode);
  }, [open, mode]);

  const statusText = !sharedAiEnabled
    ? t.modals.analyzerStatusDisabled
    : serverKeyConfigured
    ? t.modals.analyzerStatusReady
    : t.modals.analyzerStatusNoKey;

  const statusColor =
    sharedAiEnabled && serverKeyConfigured ? 'var(--success-text)' : 'var(--warning-text)';

  return (
    <ModalWrapper open={open} onClose={onClose} title={t.modals.apiTitle}>
      <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        {t.modals.apiDesc}
      </p>

      <div
        className="mb-4 px-3 py-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-color)',
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>{t.modals.analyzerStatusLabel}</span>
        <span className="font-medium text-right" style={{ color: statusColor }}>
          {statusText}
        </span>
      </div>

      <div className="mb-4 space-y-2">
        <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {t.modals.analyzerModeLabel}
        </div>
        <div role="radiogroup" aria-label={t.modals.analyzerModeLabel} className="space-y-2">
          <button
            type="button"
            role="radio"
            aria-checked={selectedMode === 'auto'}
            onClick={() => setSelectedMode('auto')}
            className="w-full text-left p-3 rounded-lg border transition-colors"
            style={{
              backgroundColor:
                selectedMode === 'auto' ? 'var(--bg-elevated)' : 'var(--bg-input)',
              borderColor:
                selectedMode === 'auto' ? 'var(--border-hover)' : 'var(--border-color)',
            }}
          >
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{t.modals.analyzerModeAuto}</span>
            </div>
            <p className="text-[11.5px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {t.modals.analyzerModeAutoDesc}
            </p>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={selectedMode === 'local'}
            onClick={() => setSelectedMode('local')}
            className="w-full text-left p-3 rounded-lg border transition-colors"
            style={{
              backgroundColor:
                selectedMode === 'local' ? 'var(--bg-elevated)' : 'var(--bg-input)',
              borderColor:
                selectedMode === 'local' ? 'var(--border-hover)' : 'var(--border-color)',
            }}
          >
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <Cpu className="w-4 h-4 shrink-0" />
              <span>{t.modals.analyzerModeLocal}</span>
            </div>
            <p className="text-[11.5px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {t.modals.analyzerModeLocalDesc}
            </p>
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          {t.common.cancel}
        </button>
        <button
          type="button"
          onClick={() => onSaveMode(selectedMode)}
          className="px-4 py-2 rounded-md text-[13px] font-medium hover:opacity-90"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
          }}
        >
          {t.common.save}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ============================================================================
   6. CONFIRM MODAL
   ============================================================================ */
interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  onClose,
  onConfirm,
}) => {
  const { t } = useI18n();
  return (
    <ModalWrapper open={open} onClose={onClose} title={title}>
      <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          {t.common.cancel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="px-4 py-2 rounded-md text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
        >
          {t.common.delete}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ============================================================================
   7. SUMMARY DOSSIER MODAL
   ============================================================================ */
interface SummaryModalProps {
  open: boolean;
  mode: 'single' | 'all';
  activePersonName: string;
  isLoading: boolean;
  data: DossierData | null;
  onClose: () => void;
  onSwitchMode: (mode: 'single' | 'all') => void;
  onRefresh: () => void;
  onCopy: () => void;
  onDownloadTxt: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  open,
  mode,
  activePersonName,
  isLoading,
  data,
  onClose,
  onSwitchMode,
  onRefresh,
  onCopy,
  onDownloadTxt,
}) => {
  const { t } = useI18n();
  const blocks = data
    ? [
        { title: data.block1Title, text: data.block1Text },
        { title: data.block2Title, text: data.block2Text },
        { title: data.block3Title, text: data.block3Text },
        { title: data.block4Title, text: data.block4Text },
        { title: data.block5Title, text: data.block5Text },
        { title: data.block6Title, text: data.block6Text },
      ].filter((b) => b.title && b.text)
    : [];

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      large
      title={t.modals.summaryTitle}
      subtitle={
        isLoading
          ? t.modals.summaryLoadingSub
          : data?.engineUsed
          ? t.modals.summaryEngineSub(data.engineUsed)
          : undefined
      }
    >
      <div
        className="flex flex-wrap gap-1.5 px-6 py-2.5 border-b"
        style={{
          backgroundColor: 'var(--bg-app)',
          borderColor: 'var(--border-color)',
        }}
      >
        <button
          type="button"
          onClick={() => mode !== 'single' && onSwitchMode('single')}
          className="relative px-3 py-1 rounded-md text-xs font-medium transition-colors"
          style={{
            color: mode === 'single' ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          {mode === 'single' && (
            <motion.span
              layoutId="summaryModeTab"
              transition={TAB_SPRING_TRANSITION}
              className="absolute inset-0 rounded-md"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            />
          )}
          <span className="relative z-10">
            {activePersonName ? activePersonName : t.modals.selectedContactFallback}
          </span>
        </button>
        <button
          type="button"
          onClick={() => mode !== 'all' && onSwitchMode('all')}
          className="relative px-3 py-1 rounded-md text-xs font-medium transition-colors"
          style={{
            color: mode === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          {mode === 'all' && (
            <motion.span
              layoutId="summaryModeTab"
              transition={TAB_SPRING_TRANSITION}
              className="absolute inset-0 rounded-md"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            />
          )}
          <span className="relative z-10">{t.modals.allContacts}</span>
        </button>
      </div>

      <div className="px-6 py-5 overflow-y-auto overscroll-contain thin-scrollbar flex-1">
        {isLoading ? (
          <motion.div
            key="summary-loading"
            variants={windowEnterVariants}
            initial="initial"
            animate="animate"
            transition={FAST_TRANSITION}
            className="py-12 text-center flex flex-col items-center gap-3"
          >
            <div className="w-6 h-6 rounded-full border-2 border-zinc-500/30 border-t-zinc-400 animate-spin" />
            <div className="text-sm font-medium">{t.modals.buildingSummary}</div>
          </motion.div>
        ) : data ? (
          <motion.div
            key={`summary-${mode}-${data.reportTitle}`}
            variants={windowEnterVariants}
            initial="initial"
            animate="animate"
            transition={FAST_TRANSITION}
          >
            <h3 className="font-display text-base font-semibold mb-4">{data.reportTitle}</h3>
            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {blocks.map((b) => (
                <div
                  key={b.title}
                  className="py-3.5 first:pt-0 last:pb-0"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div className="text-[13px] font-semibold mb-1">
                    {b.title}
                  </div>
                  <div
                    className="text-[13.5px] leading-relaxed whitespace-pre-line"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {b.text}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </div>

      <div
        className="px-6 py-3 border-t flex flex-wrap items-center justify-between gap-2"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="px-3.5 py-1.5 rounded-md text-[13px] font-medium hover:opacity-90"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
            }}
          >
            {t.modals.copyBtn}
          </button>
          <button
            type="button"
            onClick={onDownloadTxt}
            className="px-3.5 py-1.5 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            {t.modals.downloadTxt}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3.5 py-1.5 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            {t.modals.refreshBtn}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          {t.common.close}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ============================================================================
   8. GREETING / FIRST MESSAGE GENERATOR MODAL
   ============================================================================ */
interface GreetingModalProps {
  open: boolean;
  person: Person | null;
  canUseAi: boolean;
  onClose: () => void;
  onGenerateAi: (occasion: GreetingOccasion, tone: GreetingTone) => Promise<string>;
  onCopy: (text: string) => void;
}

export const GreetingModal: React.FC<GreetingModalProps> = ({
  open,
  person,
  canUseAi,
  onClose,
  onGenerateAi,
  onCopy,
}) => {
  const { lang, t } = useI18n();
  const [occasion, setOccasion] = useState<GreetingOccasion>('birthday');
  const [tone, setTone] = useState<GreetingTone>('warm');
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open || !person) return;
    setDraft(buildLocalGreeting({ person, occasion, tone, lang }));
  }, [open, person, occasion, tone, lang]);

  if (!person) return null;

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const text = await onGenerateAi(occasion, tone);
      if (text.trim()) setDraft(text.trim());
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={t.modals.greetModalTitle(person.name)}
    >
      <div className="space-y-3.5">
        <div>
          <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {t.modals.greetOccasionLabel}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['birthday', 'reconnect', 'invite'] as const).map((occ) => {
              const active = occasion === occ;
              return (
                <button
                  key={occ}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setOccasion(occ)}
                  className="px-2 py-1.5 rounded-md border text-xs font-medium transition-colors"
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
                  {t.modals.greetOccasions[occ]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {t.modals.greetToneLabel}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['warm', 'friendly', 'formal'] as const).map((tn) => {
              const active = tone === tn;
              return (
                <button
                  key={tn}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTone(tn)}
                  className="px-2 py-1.5 rounded-md border text-xs font-medium transition-colors"
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
                  {t.modals.greetTones[tn]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label
              htmlFor="greetingResultTextarea"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t.modals.greetResultLabel}
            </label>
            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-medium hover:bg-[var(--bg-hover)] disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              {canUseAi ? <Sparkles className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
              <span>{generating ? t.modals.greetGeneratingBtn : t.modals.greetGenerateBtn}</span>
            </button>
          </div>
          <textarea
            id="greetingResultTextarea"
            rows={5}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full px-3 py-2 rounded-md border text-[13px] leading-relaxed outline-none resize-y"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            {t.common.close}
          </button>
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={() => onCopy(draft)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
            }}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{t.common.copy}</span>
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

/* ============================================================================
   9. PWA SHARE TARGET MODAL
   ============================================================================ */
interface ShareTargetModalProps {
  open: boolean;
  people: Person[];
  initialText: string;
  suggestedNewName: string;
  onClose: () => void;
  onSubmit: (targetPersonId: string | 'new', newName: string, text: string) => void;
}

export const ShareTargetModal: React.FC<ShareTargetModalProps> = ({
  open,
  people,
  initialText,
  suggestedNewName,
  onClose,
  onSubmit,
}) => {
  const { t } = useI18n();
  const [targetId, setTargetId] = useState<string>('new');
  const [newName, setNewName] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (!open) return;
    setText(initialText);
    setNewName(suggestedNewName || '');
    setTargetId(people[0]?.id || 'new');
  }, [open, initialText, suggestedNewName, people]);

  return (
    <ModalWrapper open={open} onClose={onClose} title={t.modals.shareModalTitle}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          if (targetId === 'new' && !newName.trim()) return;
          onSubmit(targetId, newName.trim(), text.trim());
        }}
        className="space-y-3.5"
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {t.modals.shareModalDesc}
        </p>

        <div>
          <label
            htmlFor="shareTargetSelect"
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t.modals.shareTargetSelectLabel}
          </label>
          <select
            id="shareTargetSelect"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full px-3 py-2 rounded-md border text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="new">{t.modals.shareNewContactOption}</option>
          </select>
        </div>

        {targetId === 'new' && (
          <div>
            <label
              htmlFor="shareNewContactNameInput"
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t.modals.nameReq}
            </label>
            <input
              id="shareNewContactNameInput"
              type="text"
              required
              maxLength={40}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t.modals.namePlaceholder}
              className="w-full px-3 py-2 rounded-md border text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
              }}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="shareTextArea"
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t.modals.shareTextLabel}
          </label>
          <textarea
            id="shareTextArea"
            rows={4}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 rounded-md border text-[13px] leading-relaxed outline-none resize-y"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={!text.trim() || (targetId === 'new' && !newName.trim())}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t.modals.shareAnalyzeBtn}</span>
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
