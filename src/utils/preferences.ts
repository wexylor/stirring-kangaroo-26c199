export type AppLang = 'kk' | 'ru' | 'en';
export type AppTheme = 'dark' | 'light';

export const AUTHOR_INSTAGRAM_HANDLE = 'inst:wexylor';
export const AUTHOR_INSTAGRAM_URL = 'https://www.instagram.com/wexylor/';

export function normalizeLangCode(raw: string | null | undefined): AppLang | null {
  if (!raw) return null;
  const code = String(raw).trim().toLowerCase().split(/[-_]/)[0];
  if (code === 'kk' || code === 'kaz') return 'kk';
  if (code === 'ru' || code === 'rus') return 'ru';
  if (code === 'en' || code === 'eng') return 'en';
  return null;
}

export function detectDeviceLanguage(
  savedLang?: string | null,
  navigatorLanguages?: readonly string[]
): AppLang {
  const explicit = normalizeLangCode(savedLang);
  if (explicit) return explicit;

  const list =
    navigatorLanguages && navigatorLanguages.length > 0
      ? navigatorLanguages
      : typeof navigator !== 'undefined'
      ? navigator.languages && navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language]
      : [];

  for (const tag of list) {
    const matched = normalizeLangCode(tag);
    if (matched) return matched;
  }

  return 'en';
}

export function detectDeviceTheme(
  savedTheme?: string | null,
  prefersLight?: boolean,
  prefersDark?: boolean
): AppTheme {
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  if (typeof prefersLight === 'boolean' || typeof prefersDark === 'boolean') {
    if (prefersLight) return 'light';
    if (prefersDark) return 'dark';
    return 'dark';
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }

  return 'dark';
}
