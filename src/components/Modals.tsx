import React, { useEffect, useState } from 'react';
import type { User } from '@firebase/auth';
import { X, Mail, RefreshCw, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';
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
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        className={`w-full rounded-[22px] border shadow-2xl animate-pop-in ${
          large
            ? 'max-w-[780px] max-h-[90vh] flex flex-col overflow-hidden p-0'
            : 'max-w-[470px] p-6 max-h-[90vh] overflow-y-auto'
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
          style={
            large
              ? {
                  borderColor: 'var(--border-color)',
                  background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.12), transparent)',
                }
              : undefined
          }
        >
          <div>
            <h2 className="font-display text-lg font-bold">{title}</h2>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно"
            className="w-8 h-8 rounded-xl inline-flex items-center justify-center transition-colors hover:opacity-80"
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
   1. ACCOUNT MODAL (EMAIL BINDING, PASSWORD RESET, MANUAL SYNC, LOGOUT)
   ============================================================================ */
interface AccountModalProps {
  open: boolean;
  user: User | null;
  pendingCount: number;
  isSyncing: boolean;
  onClose: () => void;
  onManualSync: () => void;
  onLogout: () => void;
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  open,
  user,
  pendingCount,
  isSyncing,
  onClose,
  onManualSync,
  onLogout,
  onToast,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [binding, setBinding] = useState(false);
  const [bindMessage, setBindMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [showChangeEmail, setShowChangeEmail] = useState(false);

  useEffect(() => {
    if (open) {
      setBindMessage(null);
      setNewEmail('');
      setCurrentPassword('');
      setShowChangeEmail(false);
    }
  }, [open]);

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
        text: `На адрес ${res.email} отправлено письмо с подтверждением! Откройте ссылку в письме, чтобы завершить привязку почты — после этого вы сможете входить по этому Email и восстанавливать пароль.`,
      });
      setNewEmail('');
      setCurrentPassword('');
      onToast('Письмо для привязки Email отправлено', 'success');
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
      onToast(`Письмо подтверждения отправлено на ${user.email}`, 'success');
    } catch (err) {
      onToast(getHumanFirebaseAuthError(err), 'error');
    }
  };

  const handleSendReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetForEmail(user.email);
      onToast(`Ссылка для смены пароля отправлена на ${user.email}`, 'success');
    } catch (err) {
      onToast(getHumanFirebaseAuthError(err), 'error');
    }
  };

  return (
    <ModalWrapper open={open} onClose={onClose} title="👤 Личный аккаунт и почта">
      {user ? (
        <div className="space-y-4">
          <div
            className="p-3.5 rounded-xl border space-y-2 text-[13px]"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex justify-between gap-3">
              <span style={{ color: 'var(--text-secondary)' }}>Имя пользователя:</span>
              <strong className="text-right break-all">{getUserDisplayLabel(user)}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span style={{ color: 'var(--text-secondary)' }}>Текущий логин / вход:</span>
              <strong className="text-right break-all">{loginShown}</strong>
            </div>
            <div className="flex justify-between gap-3 items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Статус почты:</span>
              {hasSyntheticLogin ? (
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold"
                  style={{ color: 'var(--warning-text)' }}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Не привязана</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold"
                  style={{ color: user.emailVerified ? 'var(--success-text)' : 'var(--warning-text)' }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{user.emailVerified ? 'Подтверждена' : 'Ожидает подтверждения'}</span>
                </span>
              )}
            </div>
            <div className="flex justify-between gap-3 items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Облачная синхронизация:</span>
              <strong
                style={{
                  color: pendingCount > 0 ? 'var(--warning-text)' : 'var(--success-text)',
                }}
              >
                {pendingCount > 0
                  ? `Несинхронизировано: ${pendingCount}`
                  : 'Все изменения сохранены'}
              </strong>
            </div>
          </div>

          {/* Manual sync action */}
          <button
            type="button"
            onClick={onManualSync}
            disabled={isSyncing}
            className="w-full py-2 px-3.5 rounded-xl border text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors hover:brightness-110 disabled:opacity-60"
            style={{
              backgroundColor: pendingCount > 0 ? 'var(--warning-bg)' : 'var(--bg-elevated)',
              borderColor: pendingCount > 0 ? 'var(--warning-border)' : 'var(--border-color)',
              color: pendingCount > 0 ? 'var(--warning-text)' : 'var(--text-primary)',
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Синхронизация...' : 'Синхронизировать сейчас'}</span>
          </button>

          {/* Email binding / verification / reset section */}
          <div
            className="p-3.5 rounded-xl border space-y-3"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[13px] font-bold">
                <Mail className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
                <span>
                  {hasSyntheticLogin
                    ? 'Привязка почты (для восстановления пароля)'
                    : 'Управление привязанным Email'}
                </span>
              </div>
              {!hasSyntheticLogin && (
                <button
                  type="button"
                  onClick={() => setShowChangeEmail((v) => !v)}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: 'var(--accent-text)' }}
                >
                  {showChangeEmail ? 'Скрыть' : 'Изменить Email'}
                </button>
              )}
            </div>

            {hasSyntheticLogin ? (
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Вы вошли по короткому логину без почты. Привяжите реальный Email — тогда при потере пароля вы сможете восстановить доступ через «Забыли пароль?».
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {!user.emailVerified && (
                  <button
                    type="button"
                    onClick={handleResendVerify}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    Отправить подтверждение повторно
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSendReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Отправить письмо смены пароля</span>
                </button>
              </div>
            )}

            {bindMessage && (
              <div
                className="p-2.5 rounded-lg border text-xs leading-relaxed"
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
                    className="block text-xs font-semibold mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Новый реальный Email *
                  </label>
                  <input
                    id="bindEmailInput"
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border text-[13px] outline-none"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="bindCurrentPasswordInput"
                    className="block text-xs font-semibold mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Текущий пароль (для подтверждения) *
                  </label>
                  <input
                    id="bindCurrentPasswordInput"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Введите ваш пароль"
                    className="w-full px-3 py-2 rounded-xl border text-[13px] outline-none"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={binding}
                  className="w-full py-2 px-4 rounded-xl text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  {binding ? 'Отправка подтверждения...' : 'Привязать Email'}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className="p-3.5 rounded-xl border text-[13px]"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex justify-between gap-2">
              <span style={{ color: 'var(--text-secondary)' }}>Режим работы:</span>
              <strong>Гостевой (только это устройство)</strong>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Сейчас записи сохраняются только в браузере этого устройства. Войдите или создайте аккаунт, чтобы синхронизировать блокнот между ноутбуком и телефоном и привязать Email для восстановления пароля.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-5">
        <button
          type="button"
          onClick={onLogout}
          className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)' }}
        >
          {user ? '🚪 Выйти / Сменить аккаунт' : '🔐 Войти или создать аккаунт'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border text-[13px] font-semibold"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          Закрыть
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
    <ModalWrapper open={open} onClose={onClose} title="Новый человек в блокноте">
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
            className="block text-xs font-semibold mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Имя или прозвище *
          </label>
          <input
            id="newPersonNameInput"
            type="text"
            required
            maxLength={40}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Максим, Катя (дизайнер)..."
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="newPersonNoteInput"
            className="block text-xs font-semibold mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Краткая пометка (кто это)
          </label>
          <input
            id="newPersonNoteInput"
            type="text"
            maxLength={80}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Например: Коллега из отдела разработки"
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="newPersonGroupSelect"
            className="block text-xs font-semibold mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Группа / тег контакта
          </label>
          <select
            id="newPersonGroupSelect"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          >
            <option value="">Без группы</option>
            {DEFAULT_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span
            className="block text-xs font-semibold mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Цвет значка вкладки
          </span>
          <div className="flex gap-2.5 flex-wrap">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-label={`Цвет ${c.id}`}
                onClick={() => setColorId(c.id)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  colorId === c.id ? 'scale-110 border-white ring-2 ring-violet-500' : 'border-transparent'
                }`}
                style={{ background: c.bg }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border text-[13px] font-semibold"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Создать вкладку
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
  const [icon, setIcon] = useState('📌');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (open) {
      setIcon('📌');
      setTitle('');
    }
  }, [open]);

  return (
    <ModalWrapper open={open} onClose={onClose} title="Новая колонка характеристик">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onCreate(title.trim(), icon.trim() || '📌');
        }}
        className="space-y-4"
      >
        <div className="flex gap-2.5">
          <div className="w-20">
            <label
              htmlFor="newColumnIconInput"
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Иконка
            </label>
            <input
              id="newColumnIconInput"
              type="text"
              maxLength={4}
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-2 py-2.5 rounded-xl border text-center text-lg outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
              }}
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="newColumnTitleInput"
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Название колонки *
            </label>
            <input
              id="newColumnTitleInput"
              type="text"
              required
              maxLength={40}
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Идеи подарков, Семья..."
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
              }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border text-[13px] font-semibold"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Добавить колонку
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
      title={`Записать контакт: ${personName}`}
      subtitle="Обновляет таймлайн общения и сбрасывает счётчик «Давно не общались»"
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
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Дата *
            </label>
            <input
              id="meetingDateInput"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="meetingTypeSelect"
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Формат
            </label>
            <select
              id="meetingTypeSelect"
              value={type}
              onChange={(e) => setType(e.target.value as MeetingType)}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
              }}
            >
              <option value="meeting">☕ Встреча</option>
              <option value="call">📞 Звонок</option>
              <option value="message">💬 Переписка</option>
              <option value="other">📌 Событие</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="meetingSummaryInput"
            className="block text-xs font-semibold mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Краткий итог общения *
          </label>
          <textarea
            id="meetingSummaryInput"
            required
            autoFocus
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Например: Пили кофе, обсуждали поездку в Японию и новые проекты..."
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-y"
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
            className="px-4 py-2 rounded-xl border text-[13px] font-semibold"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Сохранить в таймлайн
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
  const [val, setVal] = useState(currentKey);

  useEffect(() => {
    if (open) setVal(currentKey);
  }, [open, currentKey]);

  return (
    <ModalWrapper open={open} onClose={onClose} title="⚙️ Настройки ИИ-анализатора">
      <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        Блокнот оснащён <strong>двойным движком</strong>: он работает через Google Gemini API (когда указан ключ), а без ключа, при таймауте или офлайн автоматически переключается на встроенный семантический парсер с уведомлением.
      </p>

      <div className="mb-4">
        <label
          htmlFor="apiKeyInput"
          className="block text-xs font-semibold mb-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          Пользовательский Gemini API Key (необязательно)
        </label>
        <input
          id="apiKeyInput"
          type="password"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="AIzaSy..."
          className="w-full px-3 py-2.5 rounded-xl border text-sm font-mono outline-none"
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
          className="px-4 py-2 rounded-xl border text-[13px] font-semibold"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          Очистить ключ
        </button>
        <button
          type="button"
          onClick={() => onSaveKey(val.trim())}
          className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: 'var(--accent-gradient)' }}
        >
          Сохранить
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
  return (
    <ModalWrapper open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border text-[13px] font-semibold"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)' }}
        >
          Удалить
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
  const blocks = data
    ? [
        { icon: '🧠', title: data.block1Title, text: data.block1Text },
        { icon: '🤝', title: data.block2Title, text: data.block2Text },
        { icon: '🚫', title: data.block3Title, text: data.block3Text },
        { icon: '🎁', title: data.block4Title, text: data.block4Text },
        { icon: '❓', title: data.block5Title, text: data.block5Text },
        { icon: '💬', title: data.block6Title, text: data.block6Text },
      ].filter((b) => b.title && b.text)
    : [];

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      large
      title="📋 ИИ-Досье и аналитика"
      subtitle={
        isLoading
          ? 'ИИ синтезирует психологический портрет, точки контакта и сценарии...'
          : `Движок синтеза: ${data?.engineUsed || 'Умный ИИ'}`
      }
    >
      <div
        className="flex flex-wrap gap-2 px-6 py-3 border-b"
        style={{
          backgroundColor: 'var(--bg-app)',
          borderColor: 'var(--border-color)',
        }}
      >
        <button
          type="button"
          onClick={() => mode !== 'single' && onSwitchMode('single')}
          className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
            mode === 'single' ? 'shadow-sm' : ''
          }`}
          style={{
            backgroundColor: mode === 'single' ? 'var(--bg-surface)' : 'transparent',
            color: mode === 'single' ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          {activePersonName
            ? `По выбранному человеку (${activePersonName})`
            : 'По выбранному человеку'}
        </button>
        <button
          type="button"
          onClick={() => mode !== 'all' && onSwitchMode('all')}
          className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
            mode === 'all' ? 'shadow-sm' : ''
          }`}
          style={{
            backgroundColor: mode === 'all' ? 'var(--bg-surface)' : 'transparent',
            color: mode === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          Общая сводка по всем людям
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-3.5">
        {isLoading ? (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full border-3 border-violet-500/25 border-t-violet-500 animate-spin" />
            <div className="font-bold text-base">Собираю глубокое ИИ-досье...</div>
            <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Анализирую связи между фактами, привычками и пробелами в карточке
            </div>
          </div>
        ) : data ? (
          <>
            <h3 className="font-display text-lg font-bold">{data.reportTitle}</h3>
            {blocks.map((b) => (
              <div
                key={b.title}
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center gap-2 text-[13px] font-bold mb-1.5">
                  <span>{b.icon}</span>
                  <span>{b.title}</span>
                </div>
                <div
                  className="text-[13.5px] leading-relaxed whitespace-pre-line"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {b.text}
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>

      <div
        className="px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-2"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: 'var(--accent-gradient)' }}
          >
            📋 Скопировать всё
          </button>
          <button
            type="button"
            onClick={onDownloadTxt}
            className="px-4 py-2 rounded-xl border text-[13px] font-semibold"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            💾 Скачать .txt
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl border text-[13px] font-semibold"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            🔄 Пересобрать ИИ
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border text-[13px] font-semibold"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          Закрыть
        </button>
      </div>
    </ModalWrapper>
  );
};
