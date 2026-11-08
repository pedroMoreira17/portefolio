import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { scrollToTarget } from '../../animations/scroll/smoothScroll';
import './BackToTop.scss';

interface Props {
  enabled: boolean;
}

/** Floating dark-silver control, shown once the visitor has left the hero. */
export function BackToTop({ enabled }: Props) {
  const { t } = useI18n();
  const [past, setPast] = useState(false);

  useEffect(() => {
    const check = () => setPast(window.scrollY > window.innerHeight * 0.9);
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);

  const visible = enabled && past;

  return (
    <button
      type="button"
      className={`back-to-top ${visible ? 'is-visible' : ''}`}
      onClick={() => scrollToTarget(0)}
      aria-label={t.contact.backToTop}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <span className="back-to-top__label">{t.contact.backToTop}</span>
      <ArrowUp size={16} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
