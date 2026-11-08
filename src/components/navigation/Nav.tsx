import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Menu, X } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { scrollToTarget } from '../../animations/scroll/smoothScroll';
import { LanguageSwitch } from './LanguageSwitch';
import './Nav.scss';

const SECTIONS = ['expertise', 'journey', 'projects', 'contact'] as const;
type SectionId = (typeof SECTIONS)[number];

interface Props {
  visible: boolean;
}

export function Nav({ visible }: Props) {
  const { t } = useI18n();
  const [active, setActive] = useState<SectionId | null>(null);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // active-section indicator
  useEffect(() => {
    const triggers = SECTIONS.map((id) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) setActive(id);
          else if (id === 'expertise' && self.direction < 0) setActive(null);
        },
      }),
    );
    return () => triggers.forEach((tr) => tr.kill());
  }, []);

  // mobile menu: escape to close, focus management
  useEffect(() => {
    if (!open) return;
    const toggle = toggleRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && overlayRef.current) {
        const focusables = overlayRef.current.querySelectorAll<HTMLElement>('a, button');
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    overlayRef.current?.querySelector<HTMLElement>('a')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      toggle?.focus();
    };
  }, [open]);

  const go = (e: MouseEvent, target: string) => {
    e.preventDefault();
    setOpen(false);
    scrollToTarget(target);
  };

  const links = SECTIONS.map((id, i) => ({ id, label: t.nav[id], index: `0${i + 2}` }));

  return (
    <>
      <header className={`nav ${visible ? 'is-visible' : ''} ${open ? 'is-open' : ''}`}>
        <a href="#hero" className="nav__mark" onClick={(e) => go(e, '#hero')}>
          <span className="nav__mark-square" aria-hidden="true" />
          <span>Pedro Moreira</span>
        </a>

        <nav className="nav__links" aria-label={t.a11y.nav}>
          <ul>
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className={active === link.id ? 'is-active' : undefined}
                  aria-current={active === link.id ? 'true' : undefined}
                  onClick={(e) => go(e, `#${link.id}`)}
                >
                  <span className="nav__index" aria-hidden="true">{link.index}</span>
                  <span className="nav__label">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav__end">
          <LanguageSwitch />
          <button
            ref={toggleRef}
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.a11y.menuClose : t.a11y.menuOpen}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} strokeWidth={1.25} /> : <Menu size={20} strokeWidth={1.25} />}
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        ref={overlayRef}
        className={`menu-overlay ${open ? 'is-open' : ''}`}
        aria-hidden={!open}
        inert={!open}
      >
        <ul>
          {links.map((link) => (
            <li key={link.id}>
              <a href={`#${link.id}`} onClick={(e) => go(e, `#${link.id}`)}>
                <span className="mono">{link.index}</span>
                <span className="serif">{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="menu-overlay__foot mono">Pedro Moreira © 2026</div>
      </div>
    </>
  );
}
