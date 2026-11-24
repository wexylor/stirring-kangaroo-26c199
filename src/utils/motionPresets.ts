import type { Transition, Variants } from 'motion/react';

export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const WINDOW_TRANSITION: Transition = {
  duration: 0.2,
  ease: EASE_OUT_EXPO,
};

export const FAST_TRANSITION: Transition = {
  duration: 0.16,
  ease: EASE_OUT_EXPO,
};

export const DRAWER_TRANSITION: Transition = {
  duration: 0.24,
  ease: EASE_OUT_EXPO,
};

export const TAB_SPRING_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 460,
  damping: 36,
  mass: 0.8,
};

export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalPanelVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 6 },
};

export const drawerLeftVariants: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
};

export const windowSwapVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export const windowEnterVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
};

export const fadeEnterVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const containerOrchestratorVariants: Variants = {
  initial: {},
  animate: {},
  exit: {},
};

export const collapseVariants: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

export const toastVariants: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: 24, scale: 0.97 },
};

export function getStepDirection(prevStep: number, nextStep: number): 1 | -1 {
  return nextStep >= prevStep ? 1 : -1;
}

export function getDirectionalSlideVariants(distance = 18): Variants {
  return {
    initial: (direction: number) => ({
      opacity: 0,
      x: direction >= 0 ? distance : -distance,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction >= 0 ? -distance : distance,
    }),
  };
}

export type AuthModeOrder = 'login' | 'register' | 'forgot';

const AUTH_MODE_INDEX: Record<AuthModeOrder, number> = {
  login: 0,
  register: 1,
  forgot: 2,
};

export function getAuthModeDirection(prev: AuthModeOrder, next: AuthModeOrder): 1 | -1 {
  return AUTH_MODE_INDEX[next] >= AUTH_MODE_INDEX[prev] ? 1 : -1;
}
