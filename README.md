# Pedro Moreira — Cinematic Portfolio

Portefólio em React 19 + TypeScript + Vite. O retrato é reconstruído em tempo real
a partir da fotografia, com dezenas de milhares de partículas quadradas renderizadas em WebGL (Three.js).
O scroll (GSAP ScrollTrigger + Lenis) transforma o rosto numa constelação de competências,
depois numa coluna (timeline) e, no fim, volta a formar o rosto no contacto.

## Correr localmente

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build de produção em dist/
npm run preview   # serve o build
```

Requer Node 20+.

## O que falta preencher (placeholders visíveis no site)

Todos os placeholders estão assinalados no site com uma moldura tracejada e ficam
concentrados nestes ficheiros de dados:

| O quê | Ficheiro |
|---|---|
| (nada pendente) | |

Contactos em `src/data/contact.ts`. Para atualizar o CV, substituir `public/pedro-moreira-cv.pdf`.

A HolyVestor e o rhsuiteOnboarding usam capturas reais (`src/assets/projects/`, campo `screenshot` em `projects.ts`).
O EasyShop usa uma composição generativa. Para lhe dar uma captura, basta acrescentar o campo `screenshot`.

## Arquitetura

```
src/
  components/
    particle-engine/   motor de partículas (WebGL), worker de amostragem, fallback 2D
    navigation/        barra fixa, menu mobile, seletor EN/PT
    constellation/     “constelações” tipográficas das competências
    timeline/          entrada da timeline
    projects/          showcase + visuais generativos (canvas 2D)
    typography/        máscaras de revelação por palavra
  sections/            Hero, Expertise, Journey, Projects, Contact
  animations/
    hero/              timeline cinematográfica de entrada (4 fases)
    scroll/            Lenis + ScrollTriggers que alimentam o estado da cena
    transitions/       revelações reutilizáveis
  data/                conteúdo (experiência, projetos, competências, contacto, traduções)
  i18n/ hooks/ styles/ utils/
scripts/prepare-portrait.py   pré-processamento do retrato (recorte do fundo)
```

### Motor de partículas

- **Amostragem** (`sampler.ts`, num Web Worker): luminância normalizada pelo histograma do retrato,
  densidade ∝ brilho^γ + termo de arestas Sobel (olhos, sobrancelhas, barba), malha de “píxeis”,
  profundidade por modelo elipsoidal da cabeça, ~4 % de sub-píxeis RGB.
- **Render**: um único draw call; todo o movimento é calculado no vertex shader a partir de
  uniforms (formação, dispersão escalonada, constelação, coluna, respiração).
- **Estado**: os ScrollTriggers só reportam progresso para `sceneState`; o motor deriva e amortece
  os uniforms. O scroll para trás é simétrico e não provoca re-renders do React.
- **Desempenho**: o número de partículas depende do dispositivo (22k–120k). Um governador de FPS
  reduz partículas e resolução se o dispositivo não aguentar ~45 fps. O Three.js é carregado
  em lazy loading (chunk separado) e os recursos são libertados no unmount.
- **Acessibilidade**: com `prefers-reduced-motion` o retrato é estático, sem pin horizontal nem
  animações de scroll. Sem WebGL, há fallback para canvas 2D. HTML semântico, skip link,
  navegação por teclado e qualquer tecla salta a intro.

### Debug

`?particles=120000` força o número de partículas. `?lang=pt` abre em português.

### Regenerar o retrato

```bash
pip install opencv-python pillow numpy
python3 scripts/prepare-portrait.py foto.png src/assets/portrait/portrait.webp
```
