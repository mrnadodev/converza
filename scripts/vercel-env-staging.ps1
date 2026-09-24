# ============================================================
# CONVERZA — séparer les variables Vercel : Production ≠ Preview
#
# Version PowerShell du script du même nom en .sh, pour une machine
# Windows sans WSL.
#
# Trois variables couvrent aujourd'hui « Production and Preview » : toute
# preview écrit donc dans la base des vrais marchands. Créées en « Sensitive »,
# leur portée est figée — il faut les supprimer et les recréer.
#
# Ce script ne devine rien : il lit les valeurs de production dans .env.local
# et celles du staging dans .env.staging, puis affiche ce qu'il va faire et
# attend votre accord.
#
#   1. npx vercel login ; npx vercel link      (une seule fois)
#   2. remplir .env.staging
#   3. powershell -ExecutionPolicy Bypass -File scripts\vercel-env-staging.ps1
# ============================================================

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')   # racine du dépôt

$Prod    = '.env.local'
$Staging = '.env.staging'

# Seules les clés propres au projet Supabase changent d'un environnement à
# l'autre. ADMIN_EMAILS n'en est pas une : la même adresse doit ouvrir la
# console des deux côtés, donc on la laisse sur « Production and Preview ».
$Vars = @('NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY')

function Read-EnvValue {
    param([string]$File, [string]$Key)
    if (-not (Test-Path $File)) { return '' }
    foreach ($line in Get-Content $File) {
        if ($line -match "^\s*$([regex]::Escape($Key))\s*=\s*(.*)$") {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return ''
}

if (-not (Test-Path $Staging)) {
    Write-Host "Le fichier $Staging manque. Créez-le à la racine du dépôt, avec les"
    Write-Host "valeurs du projet Supabase de STAGING (Settings -> API) :"
    Write-Host ''
    Write-Host 'NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co'
    Write-Host 'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...'
    Write-Host 'SUPABASE_SERVICE_ROLE_KEY=eyJ...'
    exit 1
}
if (-not (Test-Path $Prod))     { Write-Host "Introuvable : $Prod (valeurs de production)"; exit 1 }
if (-not (Test-Path '.vercel')) { Write-Host 'Projet non lié. Lancez d''abord : npx vercel link'; exit 1 }

# Rien ne commence tant qu'une seule valeur manque : supprimer une variable de
# production sans pouvoir la recréer laisserait le prochain déploiement à nu.
$manquant = $false
foreach ($v in $Vars) {
    if (-not (Read-EnvValue $Prod $v))    { Write-Host "MANQUE  $v dans $Prod";    $manquant = $true }
    if (-not (Read-EnvValue $Staging $v)) { Write-Host "MANQUE  $v dans $Staging"; $manquant = $true }
}
if ($manquant) { Write-Host ''; Write-Host "Rien n'a été touché."; exit 1 }

Write-Host 'Valeurs trouvées (longueurs, pas les secrets) :'
foreach ($v in $Vars) {
    $p = (Read-EnvValue $Prod $v).Length
    $s = (Read-EnvValue $Staging $v).Length
    Write-Host ("  {0,-32} production {1,4} car.  staging {2,4} car." -f $v, $p, $s)
}

if ((Read-EnvValue $Prod 'NEXT_PUBLIC_SUPABASE_URL') -eq (Read-EnvValue $Staging 'NEXT_PUBLIC_SUPABASE_URL')) {
    Write-Host ''
    Write-Host 'ARRÊT : le staging pointe sur la MÊME base que la production.'
    Write-Host "Vérifiez $Staging — sinon les previews continueront d'écrire chez vos marchands."
    exit 1
}

Write-Host ''
Write-Host 'Ce script va, pour chacune des trois clés Supabase :'
Write-Host "  1. la supprimer de tous les environnements Vercel"
Write-Host "  2. la recréer sur Production seule, avec la valeur de $Prod"
Write-Host "  3. la créer sur Preview seule, avec la valeur de $Staging"
Write-Host "Les deux nouvelles seront « --no-sensitive », donc modifiables plus tard."
Write-Host "Le script est rejouable : relancé, il réécrit simplement les valeurs."
Write-Host ''
Write-Host 'NE DÉPLOYEZ RIEN avant la fin du script.'
Write-Host 'Ne sont PAS touchées, et c''est voulu :'
Write-Host '  . NEXT_PUBLIC_SITE_URL et INVITE_SECRET — déjà sur Production seule'
Write-Host '  . ADMIN_EMAILS — même valeur des deux côtés, rien à séparer'
Write-Host ''

$reponse = Read-Host 'Continuer ? (tapez oui)'
if ($reponse -ne 'oui') { Write-Host "Abandon. Rien n'a été touché."; exit 1 }

# Le CLI Vercel pose des questions sans rapport avec la tâche — notamment
# « Vercel Plugin for Claude Code is not installed. Install it now? » — qui
# bloquent un script au milieu d'une suppression. CI=1 le rend silencieux.
$env:CI = '1'

foreach ($v in $Vars) {
    Write-Host ''
    Write-Host "-- $v"
    # Pas de « 2>$null » ici : sous PowerShell 5.1, rediriger la sortie
    # d'erreur d'un exécutable natif masque justement ses invites, et le
    # script paraît figé sans qu'on sache pourquoi. La variable peut ne plus
    # exister : l'échec de la suppression n'est pas une erreur.
    & npx vercel env rm $v --yes
    & npx vercel env add $v production --value (Read-EnvValue $Prod $v)    --no-sensitive --force --yes
    & npx vercel env add $v preview    --value (Read-EnvValue $Staging $v) --no-sensitive --force --yes
}

Write-Host ''
Write-Host 'Terminé. État final :'
& npx vercel env ls
Write-Host ''
Write-Host 'À vérifier avant de considérer le staging opérationnel :'
Write-Host '  . chaque clé apparaît DEUX fois — une Production, une Preview'
Write-Host '  . NEXT_PUBLIC_SITE_URL et INVITE_SECRET restent sur Production seule'
Write-Host '  . ADMIN_EMAILS reste sur « Production and Preview »'
Write-Host '  . créez un compte sur une URL de preview, puis confirmez que la ligne'
Write-Host '    est dans businesses du STAGING et ABSENTE de la production'
