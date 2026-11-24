import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, ArrowLeft, BookUser, Sun, Moon } from 'lucide-react';
import {
  getHumanFirebaseAuthError,
  loginWithLoginOrEmail,
  registerWithLoginOrEmail,
  sendPasswordResetForEmail,
} from '../services/firebase';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from '../utils/LanguageContext';
import {
  FAST_TRANSITION,
  TAB_SPRING_TRANSITION,
  WINDOW_TRANSITION,
  collapseVariants,
  getAuthModeDirection,
  getDirectionalSlideVariants,
  modalPanelVariants,
} from '../utils/motionPresets';

const authSlideVariants = getDirectionalSlideVariants(16);

interface AuthScreenProps {
  initialError?: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onContinueGuest: () => void;
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

type AuthViewMode = 'login' | 'register' | 'forgot';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialError = '',
  theme,
  onToggleTheme,
  onContinueGuest,
  onToast,
}) => {
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthViewMode>('login');
  const [modeDirection, setModeDirection] = useState<1 | -1>(1);
  const [displayName, setDisplayName] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState(initialError);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (nextMode: AuthViewMode) => {
    setModeDirection(getAuthModeDirection(mode, nextMode));
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
        onToast(t.auth.accountCreatedToast(finalName), 'success');
      } else {
        await loginWithLoginOrEmail(rawLogin, password);
        onToast(t.auth.signedInToast, 'success');
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
      setResetSuccessMsg(t.auth.resetSentMessage(cleanEmail));
      onToast(t.auth.resetSentToast, 'success');
    } catch (err) {
      if (err instanceof Error && !('code' in err)) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(getHumanFirebaseAuthError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        variants={modalPanelVariants}
        initial="initial"
        animate="animate"
        transition={WINDOW_TRANSITION}
        className="w-full max-w-[400px] rounded-xl p-6 sm:p-7 border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="mb-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <BookUser className="w-5 h-5 shrink-0" style={{ color: 'var(--text-secondary)' }} />
              <span
                className="font-display text-sm font-semibold tracking-tight truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t.auth.brand}
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? t.sidebar.lightTheme : t.sidebar.darkTheme}
              title={theme === 'dark' ? t.sidebar.lightTheme : t.sidebar.darkTheme}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium shrink-0 transition-colors hover:bg-[var(--bg-hover)]"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? t.sidebar.lightTheme : t.sidebar.darkTheme}</span>
            </button>
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight">
            {mode === 'forgot'
              ? t.auth.titleForgot
              : mode === 'register'
              ? t.auth.titleRegister
              : t.auth.titleLogin}
          </h1>
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'forgot' ? t.auth.subForgot : t.auth.subSync}
          </p>
        </div>

        <AnimatePresence initial={false}>
          {mode !== 'forgot' && (
            <motion.div
              key="auth-tabs"
              variants={collapseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FAST_TRANSITION}
              className="overflow-hidden"
            >
              <div className="pb-4">
                <div
                  className="grid grid-cols-2 gap-1 p-1 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="relative py-1.5 px-3 rounded-md text-[13px] font-medium transition-colors"
                    style={{
                      color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {mode === 'login' && (
                      <motion.span
                        layoutId="authModeTab"
                        transition={TAB_SPRING_TRANSITION}
                        className="absolute inset-0 rounded-md"
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                      />
                    )}
                    <span className="relative z-10">{t.auth.tabLogin}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="relative py-1.5 px-3 rounded-md text-[13px] font-medium transition-colors"
                    style={{
                      color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {mode === 'register' && (
                      <motion.span
                        layoutId="authModeTab"
                        transition={TAB_SPRING_TRANSITION}
                        className="absolute inset-0 rounded-md"
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                      />
                    )}
                    <span className="relative z-10">{t.auth.tabRegister}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {errorMsg && (
            <motion.div
              key="auth-error"
              variants={collapseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FAST_TRANSITION}
              className="overflow-hidden"
            >
              <div className="pb-3.5">
                <div
                  className="p-3 rounded-lg text-[12.5px] leading-relaxed border break-words"
                  role="alert"
                  style={{
                    backgroundColor: 'var(--danger-bg)',
                    borderColor: 'var(--danger-border)',
                    color: 'var(--danger-text)',
                  }}
                >
                  {errorMsg}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {resetSuccessMsg && (
            <motion.div
              key="auth-reset-success"
              variants={collapseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FAST_TRANSITION}
              className="overflow-hidden"
            >
              <div className="pb-3.5">
                <div
                  className="p-3 rounded-lg text-[12.5px] leading-relaxed border"
                  role="status"
                  style={{
                    backgroundColor: 'var(--success-bg)',
                    borderColor: 'var(--success-border)',
                    color: 'var(--success-text)',
                  }}
                >
                  {resetSuccessMsg}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative -mx-1 px-1 py-0.5 overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={modeDirection}>
            {mode === 'forgot' ? (
              <motion.form
                key="auth-form-forgot"
                custom={modeDirection}
                variants={authSlideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={FAST_TRANSITION}
                onSubmit={handleForgotSubmit}
                className="space-y-3.5"
              >
            <div>
              <label
                htmlFor="resetEmailInput"
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t.auth.emailResetLabel}
              </label>
              <input
                id="resetEmailInput"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder={t.auth.emailResetPlaceholder}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{
                backgroundColor: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
              }}
            >
              <KeyRound className="w-4 h-4" />
              <span>{submitting ? t.auth.sending : t.auth.sendLink}</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full py-2 px-4 rounded-lg text-[13px] font-medium border flex items-center justify-center gap-2 transition-colors hover:bg-[var(--bg-hover)]"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.auth.backToLogin}</span>
            </button>
              </motion.form>
            ) : (
              <motion.form
                key={`auth-form-${mode}`}
                custom={modeDirection}
                variants={authSlideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={FAST_TRANSITION}
                onSubmit={handleAuthSubmit}
                className="space-y-3.5"
              >
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="authDisplayNameInput"
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t.auth.nameLabel}
                </label>
                <input
                  id="authDisplayNameInput"
                  type="text"
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t.auth.namePlaceholder}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
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
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t.auth.loginLabel}
              </label>
              <input
                id="authLoginInput"
                type="text"
                required
                autoComplete="username"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder={t.auth.loginPlaceholder}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="authPasswordInput"
                  className="block text-xs font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t.auth.passwordLabel}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (loginInput.includes('@')) setResetEmail(loginInput.trim());
                      switchMode('forgot');
                    }}
                    className="text-xs hover:underline"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t.auth.forgotQuestion}
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
                  placeholder={t.auth.passwordPlaceholder}
                  className="w-full pl-3 pr-10 py-2 rounded-lg border text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 w-7 h-7 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 rounded-lg text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{
                backgroundColor: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
              }}
            >
              {submitting
                ? mode === 'register'
                  ? t.auth.submittingRegister
                  : t.auth.submittingLogin
                : mode === 'register'
                ? t.auth.createAccount
                : t.auth.signIn}
            </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2.5 my-4 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
          <span>{t.common.or}</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
        </div>

        <button
          type="button"
          onClick={onContinueGuest}
          className="w-full py-2 px-4 rounded-lg text-[12.5px] font-medium border transition-colors hover:bg-[var(--bg-hover)]"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          {t.auth.continueGuest}
        </button>
      </motion.div>
    </div>
  );
};
