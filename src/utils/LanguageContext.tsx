import React, { createContext, useContext } from 'react';
import type { AppLang } from './preferences';
import { getTranslations, type Translations } from './i18n';

interface LanguageContextValue {
  lang: AppLang;
  setLang: (next: AppLang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ru',
  setLang: () => {},
  t: getTranslations('ru'),
});

export const LanguageProvider: React.FC<{
  lang: AppLang;
  onChangeLang: (next: AppLang) => void;
  children: React.ReactNode;
}> = ({ lang, onChangeLang, children }) => {
  const value: LanguageContextValue = {
    lang,
    setLang: onChangeLang,
    t: getTranslations(lang),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useI18n(): LanguageContextValue {
  return useContext(LanguageContext);
}
