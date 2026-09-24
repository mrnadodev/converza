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

2. **Récupérez la chaîne de connexion** : dashboard Supabase → projet de
   production → Settings → Database → « Connection string » → onglet **URI**.
   Elle ressemble à :

   ```
   postgresql://postgres.<reference>:<mot-de-passe>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```

   Si vous ne connaissez plus le mot de passe, la même page permet de le
   réinitialiser. Attention : le réinitialiser casse toute autre connexion
   directe qui l'utiliserait.

   **Prenez bien la bonne des trois chaînes proposées.** C'est ce qui fait
   échouer la plupart des premières tentatives :

   | Choix | Port | Convient ? |
   |---|---|---|
   | Direct connection | 5432 | non — adresse IPv6, les serveurs GitHub sont en IPv4 |
   | **Session pooler** | 5432 | **oui** — c'est celle-là |
   | Transaction pooler | 6543 | non — `pg_dump` ne fonctionne pas en mode transaction |

   La bonne contient `pooler.supabase.com` et se termine par `:5432/postgres`.

3. **Enregistrez-la comme secret** dans le dépôt privé : Settings → Secrets and
   variables → Actions → New repository secret.
   Nom : `SUPABASE_DB_URL`. Valeur : la chaîne complète.

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
