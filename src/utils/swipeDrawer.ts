export const MOBILE_BREAKPOINT_PX = 1024;
export const OPEN_SWIPE_MIN_DISTANCE_PX = 56;
export const OPEN_SWIPE_FLICK_DISTANCE_PX = 34;
export const CLOSE_SWIPE_MIN_DISTANCE_PX = 48;
export const CLOSE_SWIPE_FLICK_DISTANCE_PX = 30;
export const SWIPE_FLICK_VELOCITY_PX_PER_MS = 0.35;
export const SWIPE_DEADZONE_PX = 10;

export type DrawerSwipeMode = 'open' | 'close';

export interface DrawerSwipeSession {
  startX: number;
  startY: number;
  startTime: number;
  mode: DrawerSwipeMode;
  cancelled: boolean;
  lockedHorizontal: boolean;
}

export function isMobileViewportWidth(width: number): boolean {
  return width < MOBILE_BREAKPOINT_PX;
}

export function createSwipeSession(params: {
  clientX: number;
  clientY: number;
  now: number;
  isMobileViewport: boolean;
  isDrawerOpen: boolean;
  hasBlockingOverlay: boolean;
  ignoreTarget: boolean;
}): DrawerSwipeSession | null {
  if (!params.isMobileViewport) return null;

  if (params.isDrawerOpen) {
    if (params.ignoreTarget) return null;
    return {
      startX: params.clientX,
      startY: params.clientY,
      startTime: params.now,
      mode: 'close',
      cancelled: false,
      lockedHorizontal: false,
    };
  }

  if (params.hasBlockingOverlay || params.ignoreTarget) return null;
  return {
    startX: params.clientX,
    startY: params.clientY,
    startTime: params.now,
    mode: 'open',
    cancelled: false,
    lockedHorizontal: false,
  };
}

export function evaluateSwipeMove(
  session: DrawerSwipeSession,
  params: { clientX: number; clientY: number }
): 'pending' | 'open' | 'close' | 'cancel' {
  if (session.cancelled) return 'cancel';

  const dx = params.clientX - session.startX;
  const dy = params.clientY - session.startY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (!session.lockedHorizontal) {
    if (Math.hypot(dx, dy) < SWIPE_DEADZONE_PX) {
      return 'pending';
    }

    if (absY >= absX * 0.95) {
      session.cancelled = true;
      return 'cancel';
    }

    // Wrong direction immediately cancels so user isn't fighting vertical or opposite drags
    if (session.mode === 'open' && dx <= 0) {
      session.cancelled = true;
      return 'cancel';
    }
    if (session.mode === 'close' && dx >= 0) {
      session.cancelled = true;
      return 'cancel';
    }

    session.lockedHorizontal = true;
  }

  if (session.mode === 'open') {
    if (dx >= OPEN_SWIPE_MIN_DISTANCE_PX && dx > absY * 1.35) {
      return 'open';
    }
    return 'pending';
  }

  if (dx <= -CLOSE_SWIPE_MIN_DISTANCE_PX && absX > absY * 1.25) {
    return 'close';
  }
  return 'pending';
}

export function evaluateSwipeEnd(
  session: DrawerSwipeSession,
  params: { clientX: number; clientY: number; now: number }
): 'open' | 'close' | 'none' {
  if (session.cancelled) return 'none';

  const dx = params.clientX - session.startX;
  const dy = params.clientY - session.startY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const elapsedMs = Math.max(1, params.now - session.startTime);
  const velocityX = dx / elapsedMs;

  if (session.mode === 'open') {
    if (
      (dx >= OPEN_SWIPE_MIN_DISTANCE_PX ||
        (dx >= OPEN_SWIPE_FLICK_DISTANCE_PX && velocityX >= SWIPE_FLICK_VELOCITY_PX_PER_MS)) &&
      dx > absY * 1.35
    ) {
      return 'open';
    }
    return 'none';
  }

  if (
    (dx <= -CLOSE_SWIPE_MIN_DISTANCE_PX ||
      (dx <= -CLOSE_SWIPE_FLICK_DISTANCE_PX && velocityX <= -SWIPE_FLICK_VELOCITY_PX_PER_MS)) &&
    absX > absY * 1.25
  ) {
    return 'close';
  }
  return 'none';
}

export function shouldIgnoreSwipeTarget(target: EventTarget | null): boolean {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return false;

  if (
    target.closest(
      'input, textarea, select, option, [contenteditable="true"], [data-no-drawer-swipe="true"]'
    )
  ) {
    return true;
  }

  if (typeof window === 'undefined') return false;

  let el: Element | null = target;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el.scrollWidth > el.clientWidth + 2) {
      const style = window.getComputedStyle(el);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
        return true;
      }
    }
    el = el.parentElement;
  }

  return false;
}
