# Publica o portefólio em https://pedro-moreira.dev.
# Faz o build, envia o dist/ para o servidor (alias SSH "holyvestor") e troca ~/sites/pedro-moreira.dev de uma vez.
# O Caddy do holyvestor já serve essa pasta (Caddyfile do repo appInvestimento): não é preciso reiniciar nada.
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

  $tar = Join-Path $env:TEMP "$site.tar"
  Write-Host '== empacotar'
  tar -cf $tar -C "$raiz\dist" .
  if ($LASTEXITCODE -ne 0) { throw 'PARADO: tar falhou.' }

  Write-Host "== enviar para $Servidor"
  scp -q $tar "${Servidor}:$site.tar"
  if ($LASTEXITCODE -ne 0) { throw 'PARADO: o envio (scp) falhou.' }

  # Troca atómica: o Caddy monta ~/sites (a pasta-mãe), por isso vê a pasta nova logo após o mv.
  $remoto = @"
set -eu
root=`$HOME/sites; new=`$root/.$site.new; old=`$root/.$site.old
mkdir -p "`$root"
rm -rf "`$new" "`$old"; mkdir "`$new"
tar -xf "`$HOME/$site.tar" -C "`$new"
test -f "`$new/index.html"
chmod -R a+rX "`$new"
if [ -d "`$root/$site" ]; then mv "`$root/$site" "`$old"; fi
mv "`$new" "`$root/$site"
rm -rf "`$old" "`$HOME/$site.tar"
echo "no servidor: `$(du -sh "`$root/$site" | cut -f1) em `$root/$site"
"@
  Write-Host '== instalar'
  ($remoto -replace "`r", '') | ssh $Servidor 'bash -s'
  if ($LASTEXITCODE -ne 0) { throw 'PARADO: a instalação no servidor falhou (o site antigo continua no ar).' }
  Remove-Item $tar -ErrorAction SilentlyContinue

  Write-Host '== verificar'
  try {
    $r = Invoke-WebRequest "https://$site/" -UseBasicParsing -TimeoutSec 20
    Write-Host "https://$site/ -> $($r.StatusCode)"
  } catch {
    Write-Warning "https://$site/ ainda não responde ($($_.Exception.Message)). DNS ou Caddy por configurar?"
  }
  Write-Host "PUBLICADO: $site"
} finally {
  Pop-Location
}
