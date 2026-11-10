import { createContext, useContext, useState, type ReactNode } from 'react';
import { loadLanguage, saveLanguage, setLanguage, type Language } from '../i18n/i18n';

interface LanguageState {
  lang: Language;
  change: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageState>({ lang: 'en', change: () => {} });

/** Holds the English / Français choice, remembers it on this device and redraws the app when it changes. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = loadLanguage();
    setLanguage(saved);
    if (typeof document !== 'undefined') document.documentElement.lang = saved === 'fr' ? 'fr-CA' : 'en-CA';
    return saved;
  });
  const change = (next: Language) => {
    setLanguage(next); // before redrawing, so every t() call uses the new language
    saveLanguage(next);
    document.documentElement.lang = next === 'fr' ? 'fr-CA' : 'en-CA';
    setLang(next);
  };
  return <LanguageContext.Provider value={{ lang, change }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
