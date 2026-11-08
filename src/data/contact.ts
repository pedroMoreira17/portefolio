/**
 * Contact channels. Set `href` to enable a link; while `href` is null the item is
 * rendered as a clearly marked placeholder (never as a broken link).
 *
 * To add the CV: drop the PDF in /public (e.g. /public/pedro-moreira-cv.pdf)
 * and set `href: '/pedro-moreira-cv.pdf'`.
 */
export interface ContactChannel {
  id: 'linkedin' | 'github' | 'email' | 'cv';
  label: string;
  href: string | null;
  display: string | null;
  download?: boolean;
}

export const contactChannels: ContactChannel[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/-pedromoreira-/',
    display: 'in/-pedromoreira-',
  },
  { id: 'github', label: 'GitHub', href: 'https://github.com/pedroMoreira17', display: 'pedroMoreira17' },
  { id: 'email', label: 'Email', href: 'mailto:pedro.moreira177@gmail.com', display: 'pedro.moreira177@gmail.com' },
  { id: 'cv', label: 'CV', href: './pedro-moreira-cv.pdf', display: null, download: true },
];
