# Publica o portefólio em https://pedro-moreira.dev.
# Faz o build, envia o dist/ e o deploy\pedro-moreira.dev.caddy para o servidor (alias SSH "holyvestor") e:
#  - troca ~/sites/pedro-moreira.dev de uma vez (o site antigo fica no ar até ao último instante);
#  - se o .caddy mudou, põe-no em ~/sites/pedro-moreira.dev.caddy, valida e recarrega o Caddy (sem reiniciar).
# O Caddy é o do servidor (stack do holyvestor), que importa ~/sites/*.caddy; o holyvestor não conhece este site.
# Correr com o OpenSSH do Windows (ssh-agent com a chave), p. ex.:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\publicar.ps1
param(
  [string]$Servidor = 'holyvestor',
  [switch]$SemBuild
)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$site = 'pedro-moreira.dev'

Push-Location $raiz
try {
  if (-not $SemBuild) {
    Write-Host '== build'
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'PARADO: o build falhou.' }
  }
  if (-not (Test-Path "$raiz\dist\index.html")) { throw 'PARADO: dist\index.html não existe.' }
  if (-not (Test-Path "$raiz\deploy\$site.caddy")) { throw "PARADO: deploy\$site.caddy não existe." }

  Write-Host '== empacotar'
  $pacote = Join-Path $env:TEMP "$site-publicar"
  if (Test-Path $pacote) { Remove-Item -Recurse -Force $pacote }
  New-Item -ItemType Directory -Force "$pacote\site" | Out-Null
  Copy-Item -Recurse "$raiz\dist\*" "$pacote\site"
  # Fins de linha LF, como o Caddy e o cmp do servidor esperam.
  $conf = [IO.File]::ReadAllText("$raiz\deploy\$site.caddy") -replace "`r", ''
  [IO.File]::WriteAllText("$pacote\$site.caddy", $conf, (New-Object Text.UTF8Encoding $false))
  $tar = Join-Path $env:TEMP "$site.tar"
  tar -cf $tar -C $pacote .
  if ($LASTEXITCODE -ne 0) { throw 'PARADO: tar falhou.' }

  Write-Host "== enviar para $Servidor"
  scp -q $tar "${Servidor}:$site.tar"
  if ($LASTEXITCODE -ne 0) { throw 'PARADO: o envio (scp) falhou.' }

  $remoto = @"
set -eu
root=`$HOME/sites; tmp=`$root/.$site.tmp; old=`$root/.$site.old; conf=`$root/$site.caddy
mkdir -p "`$root"
rm -rf "`$tmp" "`$old"; mkdir "`$tmp"
tar -xf "`$HOME/$site.tar" -C "`$tmp"
rm -f "`$HOME/$site.tar"
test -f "`$tmp/site/index.html"
chmod -R a+rX "`$tmp"

# Ficheiros do site: troca atomica (o Caddy monta ~/sites, a pasta-mae, e ve a pasta nova logo apos o mv).
if [ -d "`$root/$site" ]; then mv "`$root/$site" "`$old"; fi
mv "`$tmp/site" "`$root/$site"
rm -rf "`$old"
echo "site: `$(du -sh "`$root/$site" | cut -f1) em `$root/$site"

# Configuracao do Caddy: so se mudou; validada antes de recarregar, e reposta se for invalida.
if cmp -s "`$tmp/$site.caddy" "`$conf"; then
  echo "caddy: configuracao sem mudancas"
else
  if [ -f "`$conf" ]; then cp -p "`$conf" "`$conf.anterior"; fi
  cp "`$tmp/$site.caddy" "`$conf"; chmod a+r "`$conf"
  cd "`$HOME/holyvestor"
  if docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile < /dev/null > "`$tmp/validate.log" 2>&1; then
    docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile < /dev/null
    rm -f "`$conf.anterior"
    echo "caddy: configuracao nova carregada (sem reiniciar)"
  else
    tail -n 8 "`$tmp/validate.log"
    if [ -f "`$conf.anterior" ]; then mv "`$conf.anterior" "`$conf"; else rm -f "`$conf"; fi
    rm -rf "`$tmp"
    echo "PARADO: o .caddy novo e invalido; ficou a configuracao anterior."
    exit 1
  fi
fi
rm -rf "`$tmp"
"@
  Write-Host '== instalar'
  ($remoto -replace "`r", '') | ssh $Servidor 'bash -s'
  if ($LASTEXITCODE -ne 0) { throw 'PARADO: a instalação no servidor falhou (ver acima).' }
  Remove-Item $tar, $pacote -Recurse -ErrorAction SilentlyContinue

  Write-Host '== verificar'
  # O PowerShell 5.1 nem sempre ativa o TLS 1.2 por omissão.
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
  try {
    $r = Invoke-WebRequest "https://$site/" -UseBasicParsing -TimeoutSec 30
    Write-Host "https://$site/ -> $($r.StatusCode)"
  } catch {
    Write-Warning "https://$site/ ainda não responde ($($_.Exception.Message)). O certificado pode demorar um minuto na primeira vez; o Caddy do servidor já tem o import de ~/sites/*.caddy?"
  }
  Write-Host "PUBLICADO: $site"
} finally {
  Pop-Location
}
