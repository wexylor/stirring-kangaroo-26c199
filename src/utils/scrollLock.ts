import { useEffect, useId } from 'react';

export interface ScrollLockDomAdapter {
  isLocked: () => boolean;
  applyLock: () => void;
  releaseLock: () => void;
}

export function createScrollLockManager(adapter: {
  onLock: () => void;
  onUnlock: () => void;
}) {
  const activeTokens = new Set<string>();

  return {
    acquire(token: string) {
      if (!token || activeTokens.has(token)) return;
      const wasEmpty = activeTokens.size === 0;
      activeTokens.add(token);
      if (wasEmpty) {
        adapter.onLock();
      }
    },
    release(token: string) {
      if (!token || !activeTokens.has(token)) return;
      activeTokens.delete(token);
      if (activeTokens.size === 0) {
        adapter.onUnlock();
      }
    },
    isLocked() {
      return activeTokens.size > 0;
    },
    count() {
      return activeTokens.size;
    },
  };
}

interface SavedBodyStyles {
  htmlOverflow: string;
  bodyOverflow: string;
  htmlOverscroll: string;
  bodyOverscroll: string;
  bodyPaddingRight: string;
}

let savedStyles: SavedBodyStyles | null = null;

function applyDocumentScrollLock() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const html = document.documentElement;
  const body = document.body;
  if (!html || !body) return;

  savedStyles = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: body.style.overflow,
    htmlOverscroll: html.style.overscrollBehavior,
    bodyOverscroll: body.style.overscrollBehavior,
    bodyPaddingRight: body.style.paddingRight,
  };

  const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
  if (scrollbarWidth > 0) {
    const computedPaddingRight = parseFloat(window.getComputedStyle(body).paddingRight || '0') || 0;
    body.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;
  }

  html.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
  html.style.overscrollBehavior = 'none';
  body.style.overscrollBehavior = 'none';
}

function releaseDocumentScrollLock() {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  const body = document.body;
  if (!html || !body) return;

  if (savedStyles) {
    html.style.overflow = savedStyles.htmlOverflow;
    body.style.overflow = savedStyles.bodyOverflow;
    html.style.overscrollBehavior = savedStyles.htmlOverscroll;
    body.style.overscrollBehavior = savedStyles.bodyOverscroll;
    body.style.paddingRight = savedStyles.bodyPaddingRight;
    savedStyles = null;
  } else {
    html.style.overflow = '';
    body.style.overflow = '';
    html.style.overscrollBehavior = '';
    body.style.overscrollBehavior = '';
    body.style.paddingRight = '';
  }
}

const documentScrollLockManager = createScrollLockManager({
  onLock: applyDocumentScrollLock,
  onUnlock: releaseDocumentScrollLock,
});

export function isDocumentScrollLocked(): boolean {
  return documentScrollLockManager.isLocked();
}

export function useScrollLock(active: boolean) {
  const token = useId();

  useEffect(() => {
    if (!active) {
      documentScrollLockManager.release(token);
      return;
    }
    documentScrollLockManager.acquire(token);
    return () => {
      documentScrollLockManager.release(token);
    };
  }, [active, token]);
}
