import { createContext } from 'react';
import type { UIStrings } from '../data/translations/ui';
import type { Lang, Localized } from '../data/types';

export interface I18nValue {
  lang: Lang;
  t: UIStrings;
  setLang: (lang: Lang) => void;
  /** Picks the current language from a localized value. */
  l: <T>(value: Localized<T>) => T;
}

export const I18nContext = createContext<I18nValue | null>(null);
