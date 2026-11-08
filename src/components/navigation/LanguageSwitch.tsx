import { useI18n } from '../../hooks/useI18n';
import type { Lang } from '../../data/types';

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'pt', label: 'PT' },
];

export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label={t.a11y.language}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className={lang === o.value ? 'is-active' : undefined}
          aria-pressed={lang === o.value}
          lang={o.value === 'pt' ? 'pt-PT' : 'en'}
          onClick={() => setLang(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
