import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import {
  getHumanFirebaseAuthError,
  loginWithLoginOrEmail,
  registerWithLoginOrEmail,
  sendPasswordResetForEmail,
} from '../services/firebase';

interface AuthScreenProps {
  initialError?: string;
  onContinueGuest: () => void;
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

type AuthViewMode = 'login' | 'register' | 'forgot';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialError = '',
  onContinueGuest,
  onToast,
}) => {
  const [mode, setMode] = useState<AuthViewMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState(initialError);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (nextMode: AuthViewMode) => {
    setMode(nextMode);
    setErrorMsg('');
    setResetSuccessMsg('');
    setShowPassword(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const rawLogin = loginInput.trim();
    if (!rawLogin || !password) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      if (mode === 'register') {
        await registerWithLoginOrEmail(rawLogin, password, displayName);
        const finalName =
          displayName.trim() || (rawLogin.includes('@') ? rawLogin.split('@')[0] : rawLogin);
        onToast(`Аккаунт «${finalName}» создан!`, 'success');
      } else {
        await loginWithLoginOrEmail(rawLogin, password);
        onToast('Добро пожаловать в ваш блокнот!', 'success');
      }
      setPassword('');
      setShowPassword(false);
    } catch (err) {
      setErrorMsg(getHumanFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanEmail = resetEmail.trim();
    if (!cleanEmail) return;

    setSubmitting(true);
    setErrorMsg('');
    setResetSuccessMsg('');

    try {
      await sendPasswordResetForEmail(cleanEmail);
      setResetSuccessMsg(
        `Письмо со ссылкой для сброса пароля отправлено на ${cleanEmail}. Проверьте входящие и папку «Спам».`
      );
      onToast('Письмо для сброса пароля отправлено', 'success');
    } catch (err) {
      if (
        err instanceof Error &&
        !('code' in err)
      ) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(getHumanFirebaseAuthError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <div
        className="w-full max-w-[430px] rounded-[22px] p-6 sm:p-7 border shadow-2xl animate-pop-in"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex flex-col items-center text-center mb-5">
          <div
            className="w-13 h-13 rounded-[15px] text-white flex items-center justify-center text-2xl mb-3 shadow-lg"
            style={{ background: 'var(--accent-gradient)' }}
            aria-hidden="true"
          >
            🧠
          </div>
          <h1 className="text-xl font-bold tracking-tight">Умный блокнот о людях</h1>
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'forgot'
              ? 'Восстановление доступа к вашему облачному блокноту'
              : 'Войдите в свой аккаунт, чтобы открыть личный блокнот на ноутбуке или телефоне'}
          </p>
        </div>

        {mode !== 'forgot' && (
          <div
            className="grid grid-cols-2 gap-1.5 p-1 rounded-xl mb-4"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 px-3 rounded-lg text-[13px] font-semibold transition-all ${
                mode === 'login' ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: mode === 'login' ? 'var(--bg-surface)' : 'transparent',
                color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              Вход в аккаунт
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2 px-3 rounded-lg text-[13px] font-semibold transition-all ${
                mode === 'register' ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: mode === 'register' ? 'var(--bg-surface)' : 'transparent',
                color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              Создать аккаунт
            </button>
          </div>
        )}

        {errorMsg && (
          <div
            className="p-3 rounded-xl text-[12.5px] leading-relaxed mb-3.5 border break-words"
            role="alert"
            style={{
              backgroundColor: 'var(--danger-bg)',
              borderColor: 'var(--danger-border)',
              color: 'var(--danger-text)',
            }}
          >
            {errorMsg}
          </div>
        )}

        {resetSuccessMsg && (
          <div
            className="p-3 rounded-xl text-[12.5px] leading-relaxed mb-3.5 border"
            role="status"
            style={{
              backgroundColor: 'var(--success-bg)',
              borderColor: 'var(--success-border)',
              color: 'var(--success-text)',
            }}
          >
            {resetSuccessMsg}
          </div>
        )}

        {mode === 'forgot' ? (
          <form onSubmit={handleForgotSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="resetEmailInput"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Привязанный Email *
              </label>
              <input
                id="resetEmailInput"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                }}
              />
              <p className="text-[11.5px] mt-1.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                Если вы регистрировались по короткому логину без почты, предварительно привяжите реальный Email в настройках аккаунта.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-60"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <KeyRound className="w-4 h-4" />
              <span>{submitting ? 'Отправка письма...' : 'Отправить ссылку для сброса'}</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full py-2.5 px-4 rounded-xl text-[13px] font-semibold border flex items-center justify-center gap-2 transition-colors"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Вернуться ко входу</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="authDisplayNameInput"
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Ваше имя (как отображать в шапке)
                </label>
                <input
                  id="authDisplayNameInput"
                  type="text"
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Например: Арыс"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                  }}
                />
              </div>
            )}

            <div>
              <label
                htmlFor="authLoginInput"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Логин или Email *
              </label>
              <input
                id="authLoginInput"
                type="text"
                required
                autoComplete="username"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Например: arys или arys@mail.com"
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                }}
              />
              <p className="text-[11.5px] mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
                Можно придумать короткий логин либо указать Email (нужен для восстановления пароля).
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="authPasswordInput"
                  className="block text-xs font-semibold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Пароль *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (loginInput.includes('@')) setResetEmail(loginInput.trim());
                      switchMode('forgot');
                    }}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: 'var(--accent-text)' }}
                  >
                    Забыли пароль?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  id="authPasswordInput"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  aria-pressed={showPassword}
                  title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  className="absolute right-1.5 w-8 h-8 rounded-full inline-flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
              style={{ background: 'var(--accent-gradient)' }}
            >
              {submitting
                ? mode === 'register'
                  ? 'Создаём аккаунт...'
                  : 'Входим...'
                : mode === 'register'
                ? 'Создать мой аккаунт'
                : 'Войти в мой блокнот'}
            </button>
          </form>
        )}

        <div className="flex items-center gap-2.5 my-4 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
          <span>или</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
        </div>

        <button
          type="button"
          onClick={onContinueGuest}
          className="w-full py-2.5 px-4 rounded-xl text-[12.5px] font-semibold border transition-colors hover:brightness-105"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          Продолжить локально на этом устройстве (без облака)
        </button>
      </div>
    </div>
  );
};
