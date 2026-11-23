import type { AppLang } from './preferences';

export type DeleteAccountStep = 1 | 2 | 3;

export function getDeleteConfirmKeyword(lang: AppLang): string {
  if (lang === 'kk') return 'ЖОЮ';
  if (lang === 'en') return 'DELETE';
  return 'УДАЛИТЬ';
}

export function matchesDeleteConfirmKeyword(input: string, lang: AppLang): boolean {
  const clean = String(input || '').trim().toLocaleUpperCase();
  if (!clean) return false;
  const localized = getDeleteConfirmKeyword(lang).toLocaleUpperCase();
  // Accept either the currently active language keyword or the universal "DELETE"
  return clean === localized || clean === 'DELETE';
}

export function canAdvanceDeleteStep1(acknowledged: boolean): boolean {
  return Boolean(acknowledged);
}

export function canAdvanceDeleteStep2(typedInput: string, lang: AppLang): boolean {
  return matchesDeleteConfirmKeyword(typedInput, lang);
}

export function canSubmitDeleteStep3(password: string, isDeleting: boolean): boolean {
  return Boolean(password && password.length > 0 && !isDeleting);
}

export function getNextDeleteStep(current: DeleteAccountStep): DeleteAccountStep {
  if (current === 1) return 2;
  if (current === 2) return 3;
  return 3;
}

export function getPrevDeleteStep(current: DeleteAccountStep): DeleteAccountStep {
  if (current === 3) return 2;
  if (current === 2) return 1;
  return 1;
}
