// Gera public/og.png (1200×630), a imagem que aparece quando o link do site é partilhado.
// Abre o site num Chrome/Edge sem janela, espera que a intro termine e captura o hero.
//   npm run build && npx vite preview --port 4173   (noutro terminal)
//   node scripts/og-image.mjs [url]
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.argv[2] ?? 'http://localhost:4173/?lang=en';
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og.png');
const browser = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => p && existsSync(p));
if (!browser) throw new Error('Chrome/Edge não encontrado. Definir CHROME_PATH.');

const profile = mkdtempSync(join(tmpdir(), 'og-'));
const child = spawn(browser, [
  '--headless=new',
  '--remote-debugging-port=0', // porta livre escolhida pelo browser (fica escrita no perfil)
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--hide-scrollbars',
  '--ignore-gpu-blocklist',
  '--enable-unsafe-swiftshader',
  '--window-size=1200,630',
  'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let port = 0;

try {
  for (let i = 0; i < 40 && !port; i++) {
    await sleep(250);
    try {
      port = Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split(/\r?\n/)[0]);
    } catch {
      /* o browser ainda está a arrancar */
    }
  }
  if (!port) throw new Error('O browser não abriu a porta de depuração.');
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === 'page');
    } catch {
      /* o browser ainda está a arrancar */
    }
  }
  if (!target) throw new Error('O browser não abriu nenhuma página.');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => ((ws.onopen = res), (ws.onerror = rej)));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id;
      pending.set(n, (msg) => (msg.error ? rej(new Error(`${method}: ${msg.error.message}`)) : res(msg.result)));
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value;

  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });

  // A intro acabou quando a barra de navegação fica visível e o botão "saltar" desaparece.
  let done = false;
  for (let i = 0; i < 80 && !done; i++) {
    await sleep(500);
    done = await evaluate(`!!document.querySelector('main') && !document.body.classList.contains('is-intro') && !document.querySelector('.hero__skip')`);
  }
  if (!done) console.warn('Aviso: a intro não terminou em 40 s; a captura pode ficar incompleta.');
  // Esconde o que não interessa numa imagem estática e deixa as partículas assentar.
  await evaluate(`(() => { const s = document.createElement('style'); s.textContent = '.nav__links, .lang-switch, .hero__hud, .back-to-top { visibility: hidden !important; }'; document.head.append(s); })()`);
  await sleep(2500);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log(`og.png gravado em ${out}`);
} finally {
  // O Chrome no Windows relança-se: o processo que arrancámos não é o browser, e matá-lo deixava o browser vivo a
  // segurar o perfil. Fecha-se pelo protocolo de depuração (ligação ao browser, não à página).
  try {
    const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
    const bws = new WebSocket(webSocketDebuggerUrl);
    await new Promise((res, rej) => ((bws.onopen = res), (bws.onerror = rej)));
    const closed = new Promise((res) => (bws.onclose = res));
    bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
    await Promise.race([closed, sleep(5000)]);
  } catch {
    child.kill();
  }
  await sleep(1000);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 300 });
  } catch {
    console.warn(`Aviso: não foi possível apagar o perfil temporário ${profile}`);
  }
}
process.exit(0);
