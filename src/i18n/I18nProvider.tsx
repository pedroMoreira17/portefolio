import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ui } from '../data/translations/ui';
import type { Lang } from '../data/types';

import { I18nContext, type I18nValue } from './I18nContext';

const STORAGE_KEY = 'pm-lang';

/** An explicit link (?lang=) wins, then the visitor's own choice, then the browser's languages. */
function initialLang(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (fromUrl === 'pt' || fromUrl === 'en') return fromUrl;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'pt') return stored;
  } catch {
    /* storage unavailable */
  }
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of preferred) {
    const base = tag?.toLowerCase().split('-')[0];
    if (base === 'pt' || base === 'en') return base;
  }
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
    // a stale ?lang= would override this choice on the next reload
    const url = new URL(window.location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.delete('lang');
      history.replaceState(history.state, '', url);
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
