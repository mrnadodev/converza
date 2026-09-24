# Sauvegarde automatique de la base

## Pourquoi ce dossier n'est qu'un modèle

Le dépôt CONVERZA est **public**. Ses artefacts GitHub Actions et ses journaux
d'exécution le sont donc aussi. Un export de la base contient les noms, les
téléphones, les clients et les commandes des marchands : il n'a rien à faire
ici, ni le mot de passe de la base.

La sauvegarde tourne donc dans un **dépôt privé séparé**, qui contient à la
fois le workflow, le secret, et les dumps.

## Mise en place, une seule fois

1. **Créez un dépôt privé** sur GitHub, par exemple `converza-sauvegardes`.
   Cochez bien « Private ».

2. **Récupérez le mot de passe de la base** : dashboard Supabase → projet de
   production → Settings → Database. Si vous ne le connaissez plus, la même
   page permet de le réinitialiser.

   Le workflow ne demande **que le mot de passe**, pas une chaîne complète.
   Le serveur, le port et l'utilisateur sont écrits en clair en haut du
   fichier — ce ne sont pas des secrets, et les laisser lisibles évite de
   deviner quand quelque chose ne va pas.

   C'est délibéré : une chaîne « postgresql://user:motdepasse@serveur/base »
   se casse dès que le mot de passe contient `@`, `:`, `/`, `#` ou `%`, et
   l'erreur renvoyée par PostgreSQL ne dit jamais que c'est la cause.

   **Mieux : n'utilisez pas le mot de passe `postgres`.** Il permet de tout
   lire *et* de tout détruire. Lancez `db/role-sauvegarde.sql` dans l'éditeur
   SQL : il crée un compte `sauvegarde` en lecture seule. Remplacez alors
   `PGUSER` en haut du workflow par `sauvegarde.<reference>` et mettez le mot
   de passe de ce compte dans le secret.

3. **Enregistrez-le comme secret** dans le dépôt privé : Settings → Secrets and
   variables → Actions → New repository secret.
   Nom : `SUPABASE_DB_PASSWORD`. Valeur : le mot de passe, rien d'autre —
   ni `postgresql://`, ni `@`, ni nom de serveur.

4. **Copiez `sauvegarde.yml`** dans le dépôt privé, à l'emplacement
   `.github/workflows/sauvegarde.yml`, puis poussez.

5. **Lancez-la à la main une première fois** : onglet Actions → « Sauvegarde
   CONVERZA » → Run workflow. N'attendez pas la nuit pour découvrir qu'un
   réglage manque.

## Ce que ça vous donne, et ce que ça ne remplace pas

| | Portée |
|---|---|
| Sauvegardes quotidiennes Supabase (incluses au plan Pro) | 7 jours, chez Supabase |
| Ce workflow | toutes les 6 h, 60 versions (~15 jours), **hors de Supabase** |
| PITR (payant) | n'importe quelle minute des 7 derniers jours |

Le workflow protège de ce que les sauvegardes Supabase ne couvrent pas : la
perte d'accès au compte Supabase, une suppression de projet, une facture
impayée. Et il réduit la perte maximale de 24 h à 6 h.

Il ne remplace pas le PITR. Avec un dump de 6 h, une erreur commise à 12h30 ne
se rattrape qu'en revenant à 07h00 — les commandes de la matinée sont perdues.
Le jour où le chiffre d'affaires le justifie, activez le PITR.

## Restaurer

Sur un projet Supabase VIDE (jamais sur celui qui tourne) :

```bash
gunzip -c converza_2026-09-24_07h00.sql.gz > restauration.sql
psql "$SUPABASE_DB_URL_DU_PROJET_VIDE" -f restauration.sql
```

Faites cet essai **une fois, sur le staging**, avant d'en avoir besoin. Une
sauvegarde qu'on n'a jamais restaurée n'est pas une sauvegarde : c'est un
fichier.
