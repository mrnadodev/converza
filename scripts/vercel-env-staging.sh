#!/usr/bin/env bash
# ============================================================
# CONVERZA — séparer les variables Vercel : Production ≠ Preview
#
# Aujourd'hui quatre variables couvrent « Production and Preview » : toute
# preview écrit donc dans la base des vrais marchands. Créées en « Sensitive »,
# leur portée est figée — il faut les supprimer et les recréer.
#
# Ce script ne devine rien : il lit les valeurs de production dans .env.local
# et celles du staging dans .env.staging, puis affiche ce qu'il va faire et
# attend votre accord.
#
#   1. npx vercel login && npx vercel link     (une seule fois)
#   2. remplir .env.staging (voir le modèle affiché si le fichier manque)
#   3. bash scripts/vercel-env-staging.sh
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."   # racine du dépôt : .env.local et .env.staging y vivent

PROD=".env.local"
STAGING=".env.staging"
# Seules les clés propres au projet Supabase changent d'un environnement à
# l'autre. ADMIN_EMAILS n'en est pas une : la même adresse doit ouvrir la
# console des deux côtés, donc on la laisse sur « Production and Preview ».
VARS=(NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY)

lire() { # lire <fichier> <clé>
  sed -n "s/^$2=//p" "$1" | head -1 | sed 's/^["'"'"']//; s/["'"'"']$//' | tr -d '\r'
}

if [ ! -f "$STAGING" ]; then
  cat <<MODELE
Le fichier $STAGING manque. Créez-le à la racine du dépôt, avec les valeurs
du projet Supabase de STAGING (Settings → API) :

NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

Puis relancez ce script.
MODELE
  exit 1
fi

[ -f "$PROD" ] || { echo "Introuvable : $PROD (valeurs de production)"; exit 1; }
[ -d ".vercel" ] || { echo "Projet non lié. Lancez d'abord : npx vercel link"; exit 1; }

# Rien ne commence tant qu'une seule valeur manque : supprimer une variable de
# production sans pouvoir la recréer laisserait le prochain déploiement à nu.
manquant=0
for v in "${VARS[@]}"; do
  p=$(lire "$PROD" "$v"); s=$(lire "$STAGING" "$v")
  [ -n "$p" ] || { echo "MANQUE  $v dans $PROD"; manquant=1; }
  [ -n "$s" ] || { echo "MANQUE  $v dans $STAGING"; manquant=1; }
done
[ "$manquant" -eq 0 ] || { echo; echo "Rien n'a été touché."; exit 1; }

echo "Valeurs trouvées (longueurs, pas les secrets) :"
for v in "${VARS[@]}"; do
  printf '  %-32s production %3d car.  staging %3d car.\n' \
    "$v" "$(lire "$PROD" "$v" | wc -c)" "$(lire "$STAGING" "$v" | wc -c)"
done

if [ "$(lire "$PROD" NEXT_PUBLIC_SUPABASE_URL)" = "$(lire "$STAGING" NEXT_PUBLIC_SUPABASE_URL)" ]; then
  echo
  echo "ARRÊT : le staging pointe sur la MÊME base que la production."
  echo "Vérifiez $STAGING — sinon les previews continueront d'écrire chez vos marchands."
  exit 1
fi

cat <<PLAN

Ce script va, pour chacune des trois clés Supabase :
  1. la supprimer de tous les environnements Vercel
  2. la recréer sur Production seule, avec la valeur de $PROD
  3. la créer sur Preview seule, avec la valeur de $STAGING
Les deux nouvelles seront « --no-sensitive », donc modifiables plus tard.

NE DÉPLOYEZ RIEN avant la fin du script.
Ne sont PAS touchées, et c'est voulu :
  · NEXT_PUBLIC_SITE_URL et INVITE_SECRET — déjà sur Production seule
  · ADMIN_EMAILS — même valeur des deux côtés, rien à séparer

PLAN
read -r -p "Continuer ? (tapez oui) " reponse
[ "$reponse" = "oui" ] || { echo "Abandon. Rien n'a été touché."; exit 1; }

for v in "${VARS[@]}"; do
  echo
  echo "── $v"
  npx vercel env rm "$v" --yes 2>/dev/null || echo "   (rien à supprimer)"
  npx vercel env add "$v" production --value "$(lire "$PROD" "$v")" --no-sensitive --yes
  npx vercel env add "$v" preview    --value "$(lire "$STAGING" "$v")" --no-sensitive --yes
done

echo
echo "Terminé. État final :"
npx vercel env ls
cat <<SUITE

À vérifier avant de considérer le staging opérationnel :
  · chaque variable apparaît DEUX fois — une Production, une Preview
  · NEXT_PUBLIC_SITE_URL et INVITE_SECRET restent sur Production seule
  · ADMIN_EMAILS reste sur « Production and Preview »
  · créez un compte sur une URL de preview, puis confirmez que la ligne
    est dans businesses du STAGING et ABSENTE de la production
SUITE
