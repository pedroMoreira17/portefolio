import type { Localized } from '../types';

export interface SkillDomain {
  id: string;
  index: string;
  title: Localized;
  meta: Localized;
  items: string[];
}

export const skillDomains: SkillDomain[] = [
  {
    id: 'software',
    index: '01',
    title: { en: 'Software Engineering', pt: 'Engenharia de Software' },
    meta: { en: 'Languages · frameworks · APIs', pt: 'Linguagens · frameworks · APIs' },
    items: ['TypeScript', 'JavaScript', 'Python', 'Java', 'PHP', 'Node.js', 'Angular', 'React', 'Next.js', 'FastAPI', 'Spring Boot', 'REST APIs'],
  },
  {
    id: 'ai',
    index: '02',
    title: { en: 'Artificial Intelligence & Data', pt: 'Inteligência Artificial & Dados' },
    meta: { en: 'Models · pipelines · retrieval', pt: 'Modelos · pipelines · recuperação' },
    items: ['Machine Learning', 'PyTorch', 'LightGBM', 'Scikit-learn', 'TensorFlow', 'LangChain', 'OpenAI API', 'LLM integrations', 'RAG architectures', 'Pandas', 'NumPy', 'SciPy'],
  },
  {
    id: 'frontend',
    index: '03',
    title: { en: 'Frontend & Mobile', pt: 'Frontend & Mobile' },
    meta: { en: 'Interfaces · native · visualisation', pt: 'Interfaces · nativo · visualização' },
    items: ['React', 'Angular', 'React Native', 'TypeScript', 'Expo', 'Vite', 'HTML5', 'CSS / SCSS', 'Recharts'],
  },
  {
    id: 'backend',
    index: '04',
    title: { en: 'Backend & Architecture', pt: 'Backend & Arquitetura' },
    meta: { en: 'Services · data · security', pt: 'Serviços · dados · segurança' },
    items: ['Java', 'PL/SQL', 'Node.js', 'Spring Boot', 'PostgreSQL', 'Microservices', 'Oracle', 'RabbitMQ', 'FastAPI', 'Hapi.js', 'MySQL', 'MongoDB', 'JWT', 'OAuth2', 'Domain-Driven Design', 'Layered architecture'],
  },
  {
    id: 'devops',
    index: '05',
    title: { en: 'DevOps & Infrastructure', pt: 'DevOps & Infraestrutura' },
    meta: { en: 'Pipelines · containers · servers', pt: 'Pipelines · contentores · servidores' },
    items: ['Docker', 'CI/CD', 'GitHub Actions', 'Docker Compose', 'Jenkins', 'Linux', 'Bitbucket', 'Nx', 'Caddy', 'VPS deployment', 'PostgreSQL administration'],
  },
  {
    id: 'quality',
    index: '06',
    title: { en: 'Quality & Engineering Practices', pt: 'Qualidade & Práticas de Engenharia' },
    meta: { en: 'Testing · analysis · performance', pt: 'Testes · análise · desempenho' },
    items: ['Playwright', 'Vitest', 'Jest', 'Testing Library', 'SonarQube', 'JMeter', 'Unit testing', 'E2E testing', 'Accessibility testing', 'Code quality'],
  },
];
