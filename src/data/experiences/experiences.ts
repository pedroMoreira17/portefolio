import type { Accent, Localized } from '../types';

export interface JourneyEntry {
  id: string;
  kind: 'work' | 'education';
  /** Large display marker on the timeline. */
  marker: string;
  /** Human-readable period. `null` = not confirmed yet (rendered as a placeholder). */
  period: Localized | null;
  organization: string;
  role: Localized;
  description: Localized;
  focus: Localized<string[]>;
  focusLabel: Localized;
  tech: string[];
  accent: Accent;
  note?: Localized;
  /** Ongoing role: shown as "Now" with a live node on the timeline. */
  current?: boolean;
}

/** Written oldest → newest for readability. Sources: the brief and the CV; nothing inferred. */
const chronological: JourneyEntry[] = [
  {
    id: 'bsc',
    kind: 'education',
    marker: 'B.Sc.',
    period: { en: 'Feb 2021 — Jul 2024', pt: 'Fev. 2021 — Jul. 2024' },
    organization: 'Instituto Superior de Engenharia do Porto — ISEP',
    role: { en: 'Bachelor of Systems Engineering', pt: 'Licenciatura em Engenharia de Sistemas' },
    description: {
      en: 'Bachelor of Systems Engineering at the Instituto Superior de Engenharia do Porto.',
      pt: 'Licenciatura em Engenharia de Sistemas no Instituto Superior de Engenharia do Porto.',
    },
    focusLabel: { en: 'Degree', pt: 'Grau' },
    focus: { en: ['Bachelor (B.Sc.)'], pt: ['Licenciatura'] },
    tech: [],
    accent: 'blue',
  },
  {
    id: 'ml-intern',
    kind: 'work',
    marker: '2024',
    period: { en: 'Feb 2024 — Jul 2024', pt: 'Fev. 2024 — Jul. 2024' },
    organization: 'Sysnovare Innovative Solutions, S.A.',
    role: { en: 'Machine Learning Engineer Intern', pt: 'Estagiário — Machine Learning Engineer' },
    description: {
      en: 'Worked on machine learning and artificial intelligence solutions, gaining practical experience in data processing, model development and AI-related engineering.',
      pt: 'Trabalho em soluções de machine learning e inteligência artificial, com experiência prática em processamento de dados, desenvolvimento de modelos e engenharia associada a IA.',
    },
    focusLabel: { en: 'Areas', pt: 'Áreas' },
    focus: {
      en: ['Data processing', 'Model development', 'NLP & Transformers', 'LLM integrations'],
      pt: ['Processamento de dados', 'Desenvolvimento de modelos', 'NLP & Transformers', 'Integrações com LLM'],
    },
    tech: ['Python', 'Machine Learning', 'NLP', 'Transformers', 'BERT', 'Hugging Face', 'PyTorch', 'Scikit-learn', 'LangChain', 'LLM integrations'],
    accent: 'cyan',
  },
  {
    id: 'msc',
    kind: 'education',
    marker: 'M.Sc.',
    period: { en: 'Feb 2024 — Sep 2026', pt: 'Fev. 2024 — Set. 2026' },
    organization: 'Instituto Superior de Engenharia do Porto — ISEP',
    role: { en: "Master's Degree in Software Engineering", pt: 'Mestrado em Engenharia de Software' },
    description: {
      en: "Master's project (Mar — Jul 2024): migrated a monolithic system to microservices using DDD, with RabbitMQ asynchronous communication, Spring Boot services, automated testing and Jenkins CI/CD. Master's thesis (Feb — Sep 2026): rhsuiteOnboarding, a cloud platform developed in collaboration with Sysnovare.",
      pt: 'Projeto de mestrado (mar. — jul. 2024): migração de um sistema monolítico para microsserviços com DDD, comunicação assíncrona com RabbitMQ, serviços Spring Boot, testes automatizados e CI/CD em Jenkins. Dissertação (fev. — set. 2026): rhsuiteOnboarding, uma plataforma cloud desenvolvida em colaboração com a Sysnovare.',
    },
    focusLabel: { en: 'Highlights', pt: 'Destaques' },
    focus: {
      en: ['Monolith → microservices (DDD)', 'rhsuiteOnboarding — thesis'],
      pt: ['Monólito → microsserviços (DDD)', 'rhsuiteOnboarding — dissertação'],
    },
    tech: ['Spring Boot', 'Microservices', 'DDD', 'RabbitMQ', 'Jenkins', 'Angular', 'Node.js', 'PostgreSQL', 'OpenAI API'],
    accent: 'violet',
  },
  {
    id: 'full-stack',
    kind: 'work',
    marker: '2025',
    period: { en: 'Jan 2025 — Present', pt: 'Jan. 2025 — Presente' },
    organization: 'Sysnovare Innovative Solutions, S.A.',
    role: { en: 'Full-Stack Developer', pt: 'Programador Full-Stack' },
    description: {
      en: 'Developing full-stack applications with Node.js, Angular and PL/SQL across frontend, backend, API integrations and database architecture. Implementing automated testing, maintaining Jenkins CI/CD pipelines and delivering a RAG solution with the OpenAI API and LangChain, in agile teams focused on iterative delivery.',
      pt: 'Desenvolvimento de aplicações full-stack com Node.js, Angular e PL/SQL, no frontend, backend, integrações de APIs e arquitetura de bases de dados. Implementação de testes automatizados, manutenção de pipelines CI/CD em Jenkins e desenvolvimento de uma solução RAG com a API da OpenAI e LangChain, em equipas ágeis focadas em entregas iterativas.',
    },
    focusLabel: { en: 'Scope', pt: 'Âmbito' },
    focus: {
      en: ['Full-stack applications', 'Automated testing', 'Jenkins CI/CD pipelines', 'RAG solution (OpenAI + LangChain)', 'Agile delivery'],
      pt: ['Aplicações full-stack', 'Testes automatizados', 'Pipelines CI/CD em Jenkins', 'Solução RAG (OpenAI + LangChain)', 'Entrega ágil'],
    },
    tech: ['TypeScript', 'Node.js', 'Angular', 'React', 'Java', 'Spring Boot', 'PHP', 'PL/SQL', 'PostgreSQL', 'MySQL', 'REST APIs', 'OpenAI API', 'LangChain', 'Jenkins', 'Git', 'CI/CD', 'Automated testing'],
    accent: 'green',
    current: true,
  },
];

/** Display order: most recent first, so the current role is the first thing a reader sees. */
export const journey: JourneyEntry[] = [...chronological].reverse();
