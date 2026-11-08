import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ui } from '../data/translations/ui';
import type { Lang } from '../data/types';

import { I18nContext, type I18nValue } from './I18nContext';

const STORAGE_KEY = 'pm-lang';

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'pt') return stored;
  } catch {
    /* storage unavailable */
  }
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (fromUrl === 'pt' || fromUrl === 'en') return fromUrl;
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    const t = ui[lang];
    document.documentElement.lang = lang === 'pt' ? 'pt-PT' : 'en';
    document.title = t.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description);
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({ lang, t: ui[lang], setLang, l: (v) => v[lang] }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
