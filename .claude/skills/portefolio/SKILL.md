---
name: portefolio
description: How the portfolio site (pedro-moreira.dev) is built and how to change it — React 19 + Vite + TypeScript, WebGL particle portrait (Three.js), GSAP ScrollTrigger + Lenis scroll narrative, EN/PT content in src/data. Use when asked to change content (projects, experience, skills, contacts, CV, texts, translations), the particle engine, animations, sharing metadata / og.png, or to run, build and test the site locally — "portefólio", "portfolio", "mudar texto", "adicionar projeto", "partículas", "retrato", "og image", "correr o site". For publishing to the server use the `publicar` skill.
---

# Portefólio: arquitetura e como mexer

Fala com o proprietário em português. O site é uma única página estática (sem backend): tudo o que se vê vem de
`src/`, e o conteúdo editável está concentrado em `src/data/`. Publicar é outra skill: **`publicar`**.

## Correr e verificar

| Para | Comando |
| --- | --- |
| Desenvolvimento (recarrega sozinho) | `npm run dev` → http://localhost:5173 |
| Build de produção para `dist/` | `npm run build` (corre `tsc -b` e depois o Vite) |
| Servir o build | `npx vite preview --port 4173` |
| Lint | `npm run lint` (oxlint; sem saída = sem problemas) |
| Regenerar a imagem de partilha | `node scripts/og-image.mjs` (ver «Partilha e SEO») |

Não há testes automáticos. Antes de dar uma alteração por feita: `npm run build` e `npm run lint` sem erros, e ver a
página a funcionar (intro até ao fim, scroll até ao contacto, troca EN/PT).

Parâmetros de URL úteis: `?lang=pt` / `?lang=en` força o idioma; `?particles=120000` força o número de partículas.

## Mapa do código

```
index.html                 metadados (título, Open Graph, JSON-LD Person), ponto de entrada
public/                    servido tal e qual: favicon, CV (pedro-moreira-cv.pdf), og.png, robots.txt, sitemap.xml
src/
  main.tsx, App.tsx        arranque; App monta o palco de partículas, a nav e as 5 secções
  sections/                Hero, Expertise, Journey, Projects, Contact (um .tsx + um .scss cada)
  components/
    particle-engine/       motor WebGL do retrato (ver abaixo)
    projects/              bloco de projeto + visuais generativos em canvas 2D (quando não há captura)
    constellation/         «constelações» tipográficas das competências
    navigation/            barra fixa, menu mobile, seletor EN/PT, voltar ao topo
    timeline/, typography/ entrada da timeline; máscaras de revelação por palavra
  animations/
    hero/introTimeline.ts  intro cinematográfica (GSAP timeline)
    scroll/smoothScroll.ts Lenis + bloqueio do scroll durante a intro
    scroll/sceneTriggers.ts ScrollTriggers que escrevem o progresso em sceneState
    transitions/reveal.ts  revelações reutilizáveis ([data-reveal], [data-split])
  data/                    TODO o conteúdo (ver «Mudar conteúdo»)
  i18n/, hooks/            contexto de idioma; useI18n, useGsapContext, useReducedMotion
  styles/                  tokens (cores, tipografia, breakpoints) e base global
scripts/
  publicar.ps1             publica no servidor (skill `publicar`)
  og-image.mjs             gera public/og.png
  prepare-portrait.py      recorta o fundo do retrato
deploy/pedro-moreira.dev.caddy   configuração do Caddy para este site (skill `publicar`)
```

## Como as peças se ligam

A ideia central: **o scroll nunca mexe no React nem anima as partículas diretamente.**

1. `sceneTriggers.ts` cria um ScrollTrigger por transição (hero→expertise, expertise→journey, …). Cada um só escreve
   um número 0..1 em `sceneState` (objeto mutável fora do React, em `particle-engine/sceneState.ts`).
2. `ParticleEngine.ts` lê `sceneState` em cada frame, converte-o em alvos (`deriveUniformTargets`), amortece-os e
   passa-os como *uniforms* ao shader.
3. `shaders.ts` calcula no vertex shader a posição de cada partícula: mistura de quatro alvos por partícula (rosto,
   nuvem/constelação, coluna da timeline, posição inicial), mais dispersão, respiração e o campo do cursor.

Consequências a respeitar:
- Andar para trás no scroll é simétrico de graça; **não** acrescentar tweens que animem uniforms a competir com isto.
- Uma transição nova = um campo novo em `sceneState` + um `track(...)` em `sceneTriggers.ts` + o seu peso em
  `deriveUniformTargets`.
- O número da secção na nav e nos rótulos («02 — Expertise») está escrito à mão em cada secção.

### Motor de partículas (`components/particle-engine/`)
- `quality.ts` escolhe o orçamento pelo dispositivo (22k–120k partículas). `ParticleStage.tsx` carrega o motor em
  *lazy loading* (o Three.js fica num chunk à parte) e cai para `Fallback2D.ts` se não houver WebGL.
- `sampler.ts` (num Web Worker, via `loadParticles.ts`) transforma `src/assets/portrait/portrait.webp` em partículas:
  densidade pela luminância + arestas Sobel, profundidade por um modelo elipsoidal da cabeça.
- `ParticleEngine.ts`: um único *draw call*; governador de FPS que reduz partículas e resolução abaixo de ~42 fps;
  paralaxe com o rato; campo de força do cursor/toque (`uPointer`, `uPointerForce`).
- Afinar o efeito do cursor: em `shaders.ts`, secção «pointer field» (`0.11` = raio², `0.2` = empurrão,
  `0.35` = avanço para a câmara); em `ParticleEngine.ts`, a força em repouso (`0.28`) e o decaimento da energia.
- `prefers-reduced-motion`: retrato estático, sem pin horizontal nem animações de scroll. Qualquer animação nova tem
  de sair cedo quando `reducedMotion` é verdadeiro (ver o padrão em qualquer secção).

### Idioma
`I18nProvider.tsx` decide o idioma inicial por esta ordem: `?lang=` no URL → escolha guardada (`localStorage`
`pm-lang`) → idiomas do browser → inglês. Trocar no seletor guarda a escolha e tira o `?lang=` do URL.
Textos de interface: `src/data/translations/ui.ts` (objeto `en` define a forma; `pt` tem de ter as mesmas chaves, o
TypeScript obriga). Conteúdo: campos `Localized` (`{ en, pt }`) nos ficheiros de dados, lidos com `l(...)`.

## Mudar conteúdo

| O quê | Onde |
| --- | --- |
| Projetos (texto, stack, funcionalidades, links, captura) | `src/data/projects/projects.ts` |
| Percurso (experiência e formação) | `src/data/experiences/experiences.ts` (escrito do mais antigo para o mais recente) |
| Competências | `src/data/skills/skills.ts` |
| Contactos | `src/data/contact.ts` |
| CV | substituir `public/pedro-moreira-cv.pdf` (mesmo nome) |
| Textos de interface, título e descrição da página | `src/data/translations/ui.ts` |
| Retrato | `python scripts/prepare-portrait.py foto.png src/assets/portrait/portrait.webp` (precisa de `opencv-python pillow numpy`) |

Regras do conteúdo:
- **Nada inventado.** Os dados vêm do CV e do que o proprietário disse. O que não está confirmado fica `null` e o
  site mostra um *placeholder* tracejado em vez de um valor adivinhado.
- Sempre EN e PT (português de Portugal) ao mesmo tempo.
- Links de projeto: campo `links` (`kind: 'live' | 'repo' | 'caseStudy'`, `href`, `display` opcional). Sem `links`
  não aparece botão. Não pôr links para repositórios privados.
- Captura de projeto: WebP em `src/assets/projects/` em duas larguras (960 e 1920), campo `screenshot`. Sem
  `screenshot` aparece a composição generativa de `components/projects/visuals.ts`.
- A cor de destaque de cada projeto/entrada é um dos `Accent` de `src/data/types.ts` (tokens `--c-*`).

## Partilha e SEO
- `index.html` tem os metadados fixos (Open Graph, cartão do Twitter, `canonical`, JSON-LD `Person`). São estáticos
  e em inglês porque os *crawlers* de pré-visualização não correm JavaScript; o título e a descrição que o visitante
  vê mudam com o idioma em `I18nProvider.tsx`. Se mudar o cargo/descrição, mudar nos dois sítios.
- `public/og.png` (1200×630) é uma captura real do hero. Regenerar quando o hero mudar:
  1. `npm run build` e `npx vite preview --port 4173` (deixar a correr);
  2. `node scripts/og-image.mjs` (precisa de Node 22+ e de Chrome ou Edge; aceita outro URL como argumento).
  O script abre um browser sem janela num perfil temporário, espera pelo fim da intro, esconde a nav e o HUD e
  fecha o browser pelo protocolo de depuração.
- Os URLs absolutos (`https://pedro-moreira.dev/...`) estão em `index.html`, `public/robots.txt` e
  `public/sitemap.xml`. Se o domínio mudar, mudar nos três.

## Armadilhas conhecidas
- `vite.config.ts` usa `base: './'`: os caminhos dos ficheiros são relativos. Links para `public/` escrevem-se
  `./ficheiro` (como o CV em `contact.ts`), não `/ficheiro`.
- Depois de mudar a altura da página (texto novo, idioma), os ScrollTriggers têm de ser remedidos; `App.tsx` já faz
  `ScrollTrigger.refresh()` na troca de idioma e quando as fontes carregam.
- No Windows, o Chrome sem janela relança-se: matar o processo que se arrancou não fecha o browser e o perfil
  temporário fica bloqueado. Por isso o `og-image.mjs` usa porta de depuração livre (`--remote-debugging-port=0`) e
  fecha com `Browser.close`.
- Commits: só quando o proprietário pede. As mensagens do histórico são em português.
