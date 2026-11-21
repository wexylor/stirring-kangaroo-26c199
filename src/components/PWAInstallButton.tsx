import React, { useState } from 'react';
import { Check, Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useI18n } from '../utils/LanguageContext';
import { useOnlineStatus, usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'modal';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'sidebar',
}) => {
  const { t } = useI18n();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'modal') {
      return (
        <div
          className="w-full py-2 px-3 rounded-lg border text-xs flex items-center justify-between gap-2"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-color)',
            color: 'var(--success-text)',
          }}
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>{t.pwa.installedBadge}</span>
          </span>
        </div>
      );
    }
    return null;
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      await install();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={t.pwa.installTitle}
        className={
          variant === 'modal'
            ? 'w-full py-2 px-3.5 rounded-lg border text-[13px] font-medium flex items-center justify-center gap-2 transition-colors hover:bg-[var(--bg-hover)]'
            : 'w-full py-1.5 px-2.5 rounded-md border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors hover:bg-[var(--bg-hover)]'
        }
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        {isIOS ? (
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Download className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{t.pwa.installBtn}</span>
      </button>

      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.pwa.iosGuideTitle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIOSGuide(false);
          }}
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4"
        >
          <div
            className="w-full max-w-sm rounded-xl border p-5 shadow-2xl space-y-3.5 animate-pop-in"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold">{t.pwa.iosGuideTitle}</h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label={t.common.close}
                className="w-7 h-7 rounded-md inline-flex items-center justify-center hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-2.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-start gap-2">
                <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  1.
                </span>
                <span className="inline-flex flex-wrap items-center gap-1">
                  <span>{t.pwa.iosStep1}</span>
                  <Share className="w-3.5 h-3.5 inline" style={{ color: 'var(--text-primary)' }} />
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  2.
                </span>
                <span>{t.pwa.iosStep2}</span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 rounded-md text-[13px] font-medium hover:opacity-90"
              style={{
                backgroundColor: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
              }}
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const { t } = useI18n();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="px-4 py-1.5 border-b text-xs font-medium flex items-center justify-center gap-2"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--warning-border)',
        color: 'var(--warning-text)',
      }}
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>{t.pwa.offlineBanner}</span>
    </div>
  );
};
