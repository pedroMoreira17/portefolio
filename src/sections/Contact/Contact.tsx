import { useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight, Download } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { useGsapContext } from '../../hooks/useGsapContext';
import { contactChannels } from '../../data/contact';
import { SplitWords } from '../../components/typography/SplitWords';
import { revealFadeOnly, revealFadeUp, revealSplitHeadlines } from '../../animations/transitions/reveal';
import './Contact.scss';

interface Props {
  reducedMotion: boolean;
}

export function Contact({ reducedMotion }: Props) {
  const { t, lang } = useI18n();
  const rootRef = useRef<HTMLElement>(null);

  useGsapContext(
    rootRef,
    (_ctx, root) => {
      if (reducedMotion) {
        revealFadeOnly(root, '[data-reveal], [data-split], .channel');
        return;
      }
      revealSplitHeadlines(root, 'top 75%');
      revealFadeUp(root);
      gsap.from('.channel', {
        opacity: 0,
        y: 30,
        duration: 1,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.contact__channels', start: 'top 88%', toggleActions: 'play none none reverse' },
      });
    },
    [reducedMotion, lang],
  );

  return (
    <section id="contact" ref={rootRef} className="contact" aria-labelledby="contact-title">
      <div className="contact__inner container">
        <p className="mono section-label" data-reveal>
          05 — {t.contact.label}
        </p>
        <h2 id="contact-title" className="contact__title serif" data-split>
          <span className="contact__title-line">
            <SplitWords text={t.contact.titleA} />
          </span>
          <em className="contact__title-line">
            <SplitWords text={t.contact.titleB} />
          </em>
        </h2>
        <p className="contact__lead" data-reveal>
          {t.contact.lead}
        </p>

        <ul className="contact__channels">
          {contactChannels.map((c) => {
            const pending = !c.href;
            const content = (
              <>
                <span className="channel__label mono">{c.label}</span>
                <span className="channel__value">
                  {pending ? <span className="placeholder">{t.contact.pending}</span> : c.display ?? t.contact.download}
                </span>
                <span className="channel__icon" aria-hidden="true">
                  {c.download ? <Download size={22} strokeWidth={1} /> : <ArrowUpRight size={24} strokeWidth={1} />}
                </span>
              </>
            );
            return (
              <li key={c.id}>
                {pending ? (
                  <div className="channel is-pending" aria-disabled="true">
                    {content}
                  </div>
                ) : (
                  <a
                    className="channel"
                    href={c.href!}
                    target={c.href!.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    {...(c.download ? { download: 'Pedro-Moreira-CV.pdf' } : {})}
                  >
                    {content}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="footer container">
        <p className="mono">Pedro Moreira © 2026</p>
        <p className="mono">{t.contact.footerRole}</p>
      </footer>
    </section>
  );
}
