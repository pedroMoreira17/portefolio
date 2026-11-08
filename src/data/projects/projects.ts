import type { Accent, Localized } from '../types';
import holyvestor1920 from '../../assets/projects/holyvestor-landing-1920.webp';
import holyvestor960 from '../../assets/projects/holyvestor-landing-960.webp';
import rhsuite1920 from '../../assets/projects/rhsuite-landing-1920.webp';
import rhsuite960 from '../../assets/projects/rhsuite-landing-960.webp';
import easyshop1440 from '../../assets/projects/easyshop-brand-1440.webp';
import easyshop960 from '../../assets/projects/easyshop-brand-960.webp';

export interface ProjectScreenshot {
  src: string;
  srcSet: string;
  alt: Localized;
  /** CSS object-position used when the frame crops (narrow screens). */
  focus: string;
}

export interface StackGroup {
  label: Localized;
  /** Technology names stay as-is; descriptive items can be localized. */
  items: (string | Localized)[];
}

export interface Project {
  id: string;
  number: string;
  name: string;
  /** `null` = not confirmed yet (rendered as a placeholder). */
  year: string | null;
  context: Localized;
  category: Localized;
  /** `null` = not confirmed yet (rendered as a placeholder). */
  role: Localized | null;
  description: Localized<string[]>;
  stack: StackGroup[];
  features: Localized<string[]>;
  note?: Localized;
  visual: 'holyvestor' | 'rhsuite' | 'easyshop';
  /** Real screenshot; when absent a generative composition is shown instead. */
  screenshot?: ProjectScreenshot;
  accent: Accent;
}

export const projects: Project[] = [
  {
    id: 'holyvestor',
    number: '01',
    name: 'HolyVestor',
    year: '2026',
    context: { en: 'Personal project', pt: 'Projeto pessoal' },
    category: {
      en: 'Financial Technology · Artificial Intelligence · Investment Intelligence',
      pt: 'Tecnologia Financeira · Inteligência Artificial · Inteligência de Investimento',
    },
    role: { en: 'End-to-end engineering', pt: 'Engenharia de ponta a ponta' },
    description: {
      en: ['A personal investment intelligence platform that combines financial data, quantitative analysis and machine learning to deliver daily stock and ETF recommendations, portfolio monitoring and curated financial news.'],
      pt: ['Plataforma pessoal de inteligência de investimento que combina dados financeiros, análise quantitativa e machine learning para gerar recomendações diárias de ações e ETF, monitorizar carteiras e agregar notícias financeiras.'],
    },
    stack: [
      { label: { en: 'Backend', pt: 'Backend' }, items: ['Python 3.13', 'FastAPI', 'Uvicorn', 'Pydantic', 'PostgreSQL 18', 'SQLite', 'Pandas', 'NumPy', 'SciPy', 'LightGBM', 'PyJWT', 'Cryptography'] },
      { label: { en: 'Frontend', pt: 'Frontend' }, items: ['React 19', 'TypeScript', 'Vite', 'React Router', 'TanStack React Query', 'Zod', 'Recharts'] },
      { label: { en: 'Mobile', pt: 'Mobile' }, items: ['React Native', 'Expo', 'React Navigation', 'Reanimated', 'React Native SVG', 'Secure Store', 'Local Authentication', 'EAS'] },
      { label: { en: 'Infrastructure', pt: 'Infraestrutura' }, items: ['Docker', 'Docker Compose', 'Caddy', 'VPS deployment', 'Tailscale', 'UptimeRobot', 'Healthchecks.io', 'Git'] },
      { label: { en: 'Data sources & integrations', pt: 'Fontes de dados & integrações' }, items: ['Yahoo Finance', 'SEC EDGAR', 'FINRA', 'FRED', 'Finnhub', 'Tiingo', 'OpenFIGI', 'ESMA FIRDS', 'FDIC', 'Alpaca (development integration)'] },
    ],
    features: {
      en: ['Daily ML-ranked recommendations', 'Portfolio monitoring & insights', '10 financial data integrations', 'Web and native mobile apps'],
      pt: ['Recomendações diárias ordenadas por ML', 'Monitorização de carteiras e insights', '10 integrações de dados financeiros', 'Aplicações web e mobile nativa'],
    },
    note: {
      en: 'Personal project. Not a regulated financial advisory service.',
      pt: 'Projeto pessoal. Não é um serviço regulado de consultoria financeira.',
    },
    visual: 'holyvestor',
    screenshot: {
      src: holyvestor1920,
      srcSet: `${holyvestor960} 960w, ${holyvestor1920} 1920w`,
      alt: { en: 'HolyVestor landing page', pt: 'Página inicial da HolyVestor' },
      focus: '62% 50%',
    },
    accent: 'green',
  },
  {
    id: 'rhsuite',
    number: '02',
    name: 'rhsuiteOnboarding',
    year: '2026',
    context: { en: "Master's thesis · Sysnovare collaboration", pt: 'Dissertação de mestrado · Colaboração Sysnovare' },
    category: {
      en: 'Enterprise Software · Process Automation · Digital Transformation',
      pt: 'Software Empresarial · Automação de Processos · Transformação Digital',
    },
    role: { en: "Software Engineer · Master's thesis", pt: 'Engenheiro de Software · Dissertação' },
    description: {
      en: ['A cloud platform, developed with Sysnovare, that digitises employee onboarding end to end, reducing HR administrative effort by over 90% in the evaluated scenarios.'],
      pt: ['Plataforma cloud, desenvolvida com a Sysnovare, que digitaliza o onboarding de colaboradores de ponta a ponta, reduzindo o esforço administrativo de RH em mais de 90% nos cenários avaliados.'],
    },
    stack: [
      { label: { en: 'Frontend', pt: 'Frontend' }, items: ['Angular 21', 'TypeScript 5.9', 'RxJS', 'SCSS', 'Angular CDK', 'MediaPipe Tasks Vision', 'PDF.js'] },
      { label: { en: 'Backend', pt: 'Backend' }, items: ['Node.js', 'Hapi.js 21', 'PostgreSQL', 'Joi', 'JWT', 'bcryptjs', 'Stripe', 'Nodemailer', 'Gmail OAuth2', 'PDF-lib', 'OpenAI API'] },
      { label: { en: 'Architecture & engineering', pt: 'Arquitetura & engenharia' }, items: ['Multi-tenant architecture', 'Role-based access control', 'Layered architecture', 'Controllers / Services / Repositories / Models', 'Nx', 'Jenkins', 'Bitbucket', 'Docker-independent deployment pipelines', 'SonarQube'] },
      { label: { en: 'Quality & testing', pt: 'Qualidade & testes' }, items: ['Vitest', 'Playwright', 'axe-core', 'Hapi Lab', 'Sinon', 'Apache JMeter'] },
    ],
    features: {
      en: ['Configurable onboarding workflows', 'AI document extraction (OpenAI)', 'Selfie face detection', 'PDF contracts & digital signing', 'Multi-tenant, role-based access'],
      pt: ['Fluxos de onboarding configuráveis', 'Extração de documentos com IA (OpenAI)', 'Deteção facial na selfie', 'Contratos PDF e assinatura digital', 'Multi-tenant com acessos por perfis'],
    },
    visual: 'rhsuite',
    screenshot: {
      src: rhsuite1920,
      srcSet: `${rhsuite960} 960w, ${rhsuite1920} 1920w`,
      alt: { en: 'rhsuiteOnboarding landing page', pt: 'Página inicial do rhsuiteOnboarding' },
      focus: '50% 50%',
    },
    accent: 'violet',
  },
  {
    id: 'easyshop',
    number: '03',
    name: 'EasyShop',
    year: '2024',
    context: { en: 'Academic · product development project', pt: 'Projeto académico · desenvolvimento de produto' },
    category: { en: 'Smart Retail · IoT · Mobile Applications', pt: 'Retalho Inteligente · IoT · Aplicações Móveis' },
    role: {
      en: 'Requirements, solution design · marketing & strategy lead',
      pt: 'Requisitos, design da solução · responsável de marketing e estratégia',
    },
    description: {
      en: ['A smart shopping cart: an adaptable hardware module for supermarket carts paired with a connected mobile app. I led requirements engineering, solution design, marketing and product positioning.'],
      pt: ['Um carrinho de compras inteligente: módulo de hardware adaptável a carrinhos de supermercado, ligado a uma aplicação móvel. Liderei a engenharia de requisitos, o design da solução, o marketing e o posicionamento do produto.'],
    },
    stack: [
      { label: { en: 'Development', pt: 'Desenvolvimento' }, items: ['OutSystems'] },
      { label: { en: 'Engineering', pt: 'Engenharia' }, items: [{ en: 'Requirements engineering', pt: 'Engenharia de requisitos' }, { en: 'Solution design', pt: 'Design da solução' }] },
      { label: { en: 'Project management', pt: 'Gestão de projeto' }, items: ['Microsoft Project'] },
      { label: { en: 'Product', pt: 'Produto' }, items: ['Marketing', { en: 'Strategy', pt: 'Estratégia' }, { en: 'Positioning', pt: 'Posicionamento' }] },
    ],
    features: {
      en: ['Adaptable cart hardware module', 'Connected mobile app', 'Software–hardware integration'],
      pt: ['Módulo de hardware para carrinhos', 'Aplicação móvel ligada', 'Integração software–hardware'],
    },
    visual: 'easyshop',
    screenshot: {
      src: easyshop1440,
      srcSet: `${easyshop960} 960w, ${easyshop1440} 1440w`,
      alt: { en: 'EasyShop brand identity', pt: 'Identidade visual da EasyShop' },
      focus: '50% 50%',
    },
    accent: 'blue',
  },
];
