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
} from 'lucide-react';
import type { DossierData, MeetingType } from '../types/notebook';
import { AVATAR_COLORS, DEFAULT_GROUPS } from '../data/sampleData';
import {
  bindRealEmailToUser,
  getHumanFirebaseAuthError,
  getUserDisplayLabel,
  isSyntheticLoginEmail,
  resendVerificationForUser,
  sendPasswordResetForEmail,
} from '../services/firebase';
import { getTodayInputDate } from '../utils/storage';
import {
  AUTHOR_INSTAGRAM_HANDLE,
  AUTHOR_INSTAGRAM_URL,
  type AppLang,
} from '../utils/preferences';
import { useI18n } from '../utils/LanguageContext';
import { translateGroupLabel } from '../utils/i18n';
import { PWAInstallButton } from './PWAInstallButton';

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4"
    >
      <div
        className={`w-full rounded-xl border shadow-2xl animate-pop-in ${
          large
            ? 'max-w-[740px] max-h-[88vh] flex flex-col overflow-hidden p-0'
            : 'max-w-[440px] p-5 sm:p-6 max-h-[90vh] overflow-y-auto'
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
      </div>
    </div>
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

            {bindMessage && (
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
            )}

            {(hasSyntheticLogin || showChangeEmail) && (
              <form onSubmit={handleBindEmail} className="space-y-2.5 pt-1">
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
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t.account.localModeDesc}
          </p>
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

      <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          type="button"
          onClick={onLogout}
          className="px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors"
          style={{
            backgroundColor: user ? 'var(--danger-bg)' : 'var(--btn-primary-bg)',
            color: user ? 'var(--danger-text)' : 'var(--btn-primary-text)',
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
   2. ADD PERSON MODAL
   ============================================================================ */
interface AddPersonModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, subtitle: string, colorId: string, group: string) => void;
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({ open, onClose, onCreate }) => {
  const { lang, t } = useI18n();
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [group, setGroup] = useState('Друзья');
  const [colorId, setColorId] = useState('violet');

  useEffect(() => {
    if (open) {
      setName('');
      setSubtitle('');
      setGroup('Друзья');
      setColorId('violet');
    }
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
            {DEFAULT_GROUPS.map((g) => (
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
  onClose: () => void;
  onCreate: (title: string, icon: string) => void;
}

export const AddColumnModal: React.FC<AddColumnModalProps> = ({ open, onClose, onCreate }) => {
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
   5. API SETTINGS MODAL
   ============================================================================ */
interface ApiSettingsModalProps {
  open: boolean;
  currentKey: string;
  onClose: () => void;
  onSaveKey: (val: string) => void;
  onClearKey: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  open,
  currentKey,
  onClose,
  onSaveKey,
  onClearKey,
}) => {
  const { t } = useI18n();
  const [val, setVal] = useState(currentKey);

  useEffect(() => {
    if (open) setVal(currentKey);
  }, [open, currentKey]);

  return (
    <ModalWrapper open={open} onClose={onClose} title={t.modals.apiTitle}>
      <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        {t.modals.apiDesc}
      </p>

      <div className="mb-4">
        <label
          htmlFor="apiKeyInput"
          className="block text-xs font-medium mb-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t.modals.apiKeyLabel}
        </label>
        <input
          id="apiKeyInput"
          type="password"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="AIzaSy..."
          className="w-full px-3 py-2 rounded-md border text-sm font-mono outline-none"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-color)',
          }}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setVal('');
            onClearKey();
          }}
          className="px-3.5 py-2 rounded-md border text-[13px] font-medium hover:bg-[var(--bg-hover)]"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          {t.common.clear}
        </button>
        <button
          type="button"
          onClick={() => onSaveKey(val.trim())}
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
          className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
          style={{
            backgroundColor: mode === 'single' ? 'var(--bg-surface)' : 'transparent',
            color: mode === 'single' ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          {activePersonName ? activePersonName : t.modals.selectedContactFallback}
        </button>
        <button
          type="button"
          onClick={() => mode !== 'all' && onSwitchMode('all')}
          className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
          style={{
            backgroundColor: mode === 'all' ? 'var(--bg-surface)' : 'transparent',
            color: mode === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          {t.modals.allContacts}
        </button>
      </div>

      <div className="px-6 py-5 overflow-y-auto flex-1">
        {isLoading ? (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-zinc-500/30 border-t-zinc-400 animate-spin" />
            <div className="text-sm font-medium">{t.modals.buildingSummary}</div>
          </div>
        ) : data ? (
          <div>
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
          </div>
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
