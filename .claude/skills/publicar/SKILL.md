---
name: publicar
description: Publish the portfolio to production (https://pedro-moreira.dev) with scripts/publicar.ps1, and understand the hosting architecture — static files served by the Caddy container of the HolyVestor stack on the netcup VPS, via ~/sites/*.caddy. Use when asked to publish, deploy, put online, update the live site, roll back, change the Caddy config / headers / domain, or diagnose why the live site is wrong — "publicar", "pôr online", "deploy", "atualizar o site", "voltar atrás", "o site não abre", "certificado", "Caddy".
---

# Publicar o portefólio

Fala com o proprietário em português e explica cada passo em termos simples. Publicar muda o que o mundo vê:
**só publicar quando o proprietário pedir**, e confirmar antes de qualquer passo no servidor que não esteja aqui.

## Arquitetura montada

O portefólio não tem servidor próprio. É uma pasta de ficheiros estáticos servida pelo **Caddy do HolyVestor**, no
mesmo VPS. Os dois projetos estão separados de propósito: o HolyVestor não conhece o portefólio, só aceita «sites
de outros repositórios» numa pasta combinada.

```
Visitante ──HTTPS──► DNS Cloudflare («DNS only»: A @ → IPv4 do VPS; CNAME www → pedro-moreira.dev)
                          │
                          ▼
        VPS netcup (Debian 13) · portas abertas à internet: 80 e 443 · SSH (22) só pelo Tailscale
        ┌──────────────────────────────────────────────────────────────────────────────┐
        │ ~/holyvestor/            stack Docker Compose do HolyVestor (repo appInvestimento) │
        │   contentor caddy (caddy:2)  ◄── único processo a ouvir em 80/443              │
        │     /etc/caddy/Caddyfile     holyvestor.com → reverse_proxy api:8000           │
        │                              última linha: import /srv/sites/*.caddy           │
        │     /srv/sites  (só leitura) ◄── volume: ../sites  =  ~/sites do servidor      │
        │   contentores api, worker, db (PostgreSQL)… nada a ver com o portefólio        │
        │                                                                                │
        │ ~/sites/                 «outros sites», cada um publicado pelo seu repositório│
        │   pedro-moreira.dev/         os ficheiros do site (o dist/ deste repo)         │
        │   pedro-moreira.dev.caddy    bloco do Caddy deste site (deploy/ deste repo)    │
        └──────────────────────────────────────────────────────────────────────────────┘
```

O que cada lado possui:

| Peça | Onde vive | Quem a muda |
| --- | --- | --- |
| Ficheiros do site | `dist/` (gerado) → `~/sites/pedro-moreira.dev/` | este repo, `scripts/publicar.ps1` |
| Bloco do Caddy do site | `deploy/pedro-moreira.dev.caddy` → `~/sites/pedro-moreira.dev.caddy` | este repo, `scripts/publicar.ps1` |
| `import /srv/sites/*.caddy` e o volume `../sites:/srv/sites:ro` | `Caddyfile` e `docker-compose.yml` do HolyVestor (`C:\personalApp`) | repo do HolyVestor, com a skill `deploy-codigo` de lá |
| Certificado HTTPS | volume `caddy-data` do contentor | o Caddy, sozinho (Let's Encrypt, renova sem intervenção) |
| DNS | Cloudflare | o proprietário, à mão |

O que isto implica:
- **Publicar o portefólio não reinicia nem reconstrói nada do HolyVestor.** Trocar ficheiros não toca no Caddy; só
  uma mudança ao `.caddy` faz um `caddy reload` (recarrega a configuração sem cortar ligações).
- **O `.caddy` deste site é carregado dentro do Caddyfile do HolyVestor.** Um erro de sintaxe aqui invalidaria a
  configuração inteira, por isso o script valida primeiro e repõe o ficheiro anterior se a validação falhar: o
  HolyVestor nunca fica com uma configuração inválida carregada.
- Dentro do contentor o caminho é `/srv/sites/...`; no servidor é `~/sites/...`. O `root` no `.caddy` usa o do
  contentor.
- O contentor monta a pasta-mãe (`~/sites`), não a pasta do site. É isso que permite trocar a pasta do site com um
  `mv` e o Caddy ver logo a nova.

## Factos fixos (confirmar se algo parecer diferente)
- Servidor: alias SSH **`holyvestor`** (utilizador `holyvestor`), acessível **só pelo Tailscale**. O `ssh`/`scp` têm
  de ser o OpenSSH do Windows com o ssh-agent e a chave do proprietário: correr pela ferramenta **PowerShell**, não
  pelo Git Bash.
- Domínio: `pedro-moreira.dev`; `www.` redireciona para o domínio sem `www`.
- O que o `.caddy` define: compressão zstd/gzip; cache de um ano e `immutable` para `/assets/*` (o Vite põe uma
  impressão digital no nome de cada ficheiro); `no-cache` para o resto (`index.html`, CV, `og.png`), que assim
  revalida sempre; HSTS, `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`.
- **O script publica a pasta de trabalho tal como está no disco, não um commit.** Alterações por commitar vão para
  produção. Antes de publicar: `git status`, e dizer ao proprietário o que vai (commitado ou não).
- O classificador de permissões do Claude Code pode bloquear a publicação pedida por mim («Production Deploy»).
  Nesse caso não contornar: pedir ao proprietário para correr o comando ou aprovar a regra.

## Publicar: `scripts/publicar.ps1`

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\publicar.ps1
```

Antes de correr:
1. `git status` — saber exatamente o que vai.
2. `npm run lint` sem erros (o build é feito pelo próprio script).
3. Se o hero mudou, regenerar `public/og.png` (skill `portefolio`, «Partilha e SEO»).

O que o script faz, por ordem, parando com `PARADO: ...` à primeira falha:
1. **build** — `npm run build` (`-SemBuild` salta este passo e publica o `dist/` que existir).
2. **empacotar** — junta `dist/` e `deploy/pedro-moreira.dev.caddy` (com fins de linha LF) num `.tar` em `%TEMP%`.
3. **enviar** — `scp` do `.tar` para a pasta pessoal do servidor.
4. **instalar** (um script enviado por stdin para `bash -s`):
   - extrai para `~/sites/.pedro-moreira.dev.tmp` e confirma que há `index.html`;
   - **troca atómica**: a pasta atual passa a `.old`, a nova entra no lugar com `mv`, a `.old` é apagada. O site
     antigo fica no ar até esse instante;
   - **Caddy, só se o `.caddy` mudou**: guarda o anterior, copia o novo, corre `caddy validate` dentro do
     contentor; se passar, `caddy reload`; se falhar, repõe o anterior e pára com
     `PARADO: o .caddy novo e invalido`.
5. **verificar** — pede `https://pedro-moreira.dev/` de fora e mostra o código (200). Acaba com
   `PUBLICADO: pedro-moreira.dev`.

Outro servidor/alias: `-Servidor <alias>`.

### Depois de publicar
- Abrir o site numa janela privada e ver a intro, o scroll e o seletor EN/PT.
- `https://pedro-moreira.dev/og.png`, `/robots.txt` e `/sitemap.xml` respondem 200.
- Se a imagem ou o título de partilha mudaram: o LinkedIn guarda a pré-visualização antiga; o proprietário força a
  atualização no LinkedIn Post Inspector (`https://www.linkedin.com/post-inspector/`).

## Voltar atrás
O servidor **não guarda a versão anterior** (a pasta `.old` é apagada no fim da troca). Voltar atrás é publicar de
novo um estado anterior do repositório:
1. Guardar o trabalho em curso (commit ou `git stash`).
2. `git checkout <commit bom>` (o histórico é a referência: `git log --oneline`).
3. Correr `scripts\publicar.ps1`.
4. Voltar ao ramo (`git checkout main`) e repor o trabalho.

Um `.caddy` inválido não precisa de nada: o script já repôs o anterior. Um `.caddy` válido mas errado (um cabeçalho
mal pensado, por exemplo) corrige-se no ficheiro em `deploy/` e publica-se outra vez.

## Quando corre mal

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| `PARADO: o envio (scp) falhou` | Tailscale desligado no PC, ou ssh-agent sem a chave | Ligar o Tailscale; `ssh holyvestor exit` pela PowerShell para testar; `ssh-add` se pedir chave |
| `PARADO: o build falhou` | erro de TypeScript ou do Vite | Corrigir; `npm run build` local até passar |
| `PARADO: o .caddy novo e invalido` | sintaxe do `deploy/*.caddy` | Ler as 8 linhas do `caddy validate` que o script mostra; corrigir; publicar. A configuração anterior continua ativa |
| O passo «verificar» avisa que o site não responde | primeira publicação (certificado a ser emitido), DNS, ou o Caddy do servidor sem o `import` | Esperar um minuto e tentar; confirmar o DNS na Cloudflare («DNS only», sem proxy); confirmar que o `Caddyfile` do HolyVestor no servidor tem `import /srv/sites/*.caddy` e que o `docker-compose.yml` monta `../sites:/srv/sites:ro` |
| Site publicado mas o browser mostra a versão antiga | cache do próprio browser no `index.html` | Recarregar sem cache; `curl -I https://pedro-moreira.dev/` deve mostrar `Cache-Control: no-cache` |
| HolyVestor com problemas depois de publicar | improvável: só o `caddy reload` é partilhado | `ssh holyvestor` e, em `~/holyvestor`, `docker compose logs --tail 50 caddy`. Não mexer no resto da stack a partir deste repo: é com a skill `deploy-codigo` do HolyVestor |

Ver o estado no servidor (só leitura), pela PowerShell:

```powershell
ssh holyvestor "ls -la ~/sites ~/sites/pedro-moreira.dev | head -30"
ssh holyvestor "cd ~/holyvestor && docker compose ps caddy && docker compose logs --tail 30 caddy"
```

## Limites
- Não alterar `~/holyvestor`, o seu `Caddyfile`, o `docker-compose.yml` nem o `.env` a partir deste repositório.
- Não apagar nada em `~/sites` à mão sem o proprietário confirmar; outros sites podem viver lá.
- Mudar o domínio implica: DNS na Cloudflare, o nome do ficheiro e dos blocos em `deploy/`, a variável `$site` no
  `publicar.ps1`, e os URLs absolutos em `index.html`, `public/robots.txt` e `public/sitemap.xml`.
