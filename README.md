# CONVERZA

**WhatsApp Sales & Customer Management pou biznis an Ayiti.**
Jere kliyan, kòmand ak katalòg ou nan yon sèl kote — bileng Kreyòl / Fransè, mobile-first.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS** — PWA installable
- **Supabase** — Postgres, Auth, Storage (free tier)
- **Vercel** — hébergement (free tier)
- Cœur produit : liens **`wa.me`** pré-remplis (aucune API WhatsApp payante)

## Démarrer

```bash
npm install
cp .env.local.example .env.local   # remplis avec ton projet Supabase
npm run dev
```

Ouvre http://localhost:3000 — le tableau de bord (Tablo debò) s'affiche avec les
données de démo (`lib/demo.ts`), même sans Supabase configuré.

## Base de données

1. Crée un projet sur [supabase.com](https://supabase.com) (gratuit).
2. Dans **SQL Editor**, exécute `db/schema.sql`, puis **toutes les migrations
   dans l'ordre** (voir la liste ci-dessous). `schema.sql` seul donne une base
   incomplète : il s'arrête avant le stock, la caisse et le support.
3. `db/seed.sql` si tu veux des données d'exemple.
4. Copie l'URL et la clé anon dans `.env.local`.

### Ordre des migrations

Chaque fichier est **autonome et rejouable** : on peut les relancer sans risque,
et sans savoir lesquels ont déjà été joués. À exécuter **une requête par
fichier** dans l'éditeur SQL.

| # | Fichier | Apporte |
| --- | --- | --- |
| 1 | `db/migrate-2026-1-enums.sql` | Statuts du Kanban, moyens de paiement |
| 2 | `db/migrate-2026-2-schema.sql` | Vue `public_businesses`, code de livraison, permissions d'agent, audit |
| 3 | `db/migrate-2026-3-admin.sql` | Agrégats `admin_business_stats` de la console |
| 4 | `db/migrate-2026-4-numero.sql` | Changement de numéro WhatsApp, pièces justificatives, verrou du plan |
| 5 | `db/migrate-2026-5-stock.sql` | Stock tenu par la base, journal des mouvements |
| 5b | `db/migrate-2026-5b-correctif-stock.sql` | **Obligatoire après la 5** : sans elle, toute commande confirmée échoue |
| 6 | `db/migrate-2026-6-gestion.sql` | Prix d'achat, encaissements, dépenses, fournisseurs, livraison |
| 7 | `db/migrate-2026-7-support.sql` | Suspension de compte, journal des erreurs techniques |
| 8 | `db/migrate-2026-8-abonnement.sql` | La vitrine retombe en Gratis à l'échéance (3 jours de tolérance) |
| 9 | `db/migrate-2026-9-vitrine-accueil.sql` | Un marchand peut refuser d'être présenté sur la page d'accueil |

La console `/admin` → **Sécurité** indique en permanence quelles migrations
manquent sur la base connectée.

### Base existante : migration obligatoire

Une base créée avant l'ajout du pipeline à 7 étapes doit être migrée. **Sans
cela, l'app ne fonctionne pas.** Dans le SQL Editor de Supabase, exécute les
migrations listées plus haut, dans l'ordre, **une requête par fichier**.

Les coller ensemble échoue avec `ERROR 55P04: unsafe use of new value`. L'éditeur
enveloppe tout le script dans une seule transaction, et Postgres refuse d'utiliser
une valeur d'enum dans la transaction qui vient de la créer.

La migration 2 rattrape en tête toutes les migrations de 2025 (`theme`,
`verticals`, `delivery`, `subscription`, `payment-methods`, `storage`,
`onboarding`, `team`) : pas besoin de savoir lesquelles ont été jouées.

Les migrations 1 et 2 apportent :

- les statuts du Kanban et les moyens de paiement manquants dans les enums ;
- `public_businesses`, la vue que la vitrine interroge à la place de la table ;
- `orders.security_code` et `orders.source` (code de livraison, attribution pub) ;
- `members.agent_profile`, qui porte les permissions des agents ;
- `platform_settings` et `security_audit_logs` ;
- `admin_business_stats`, les agrégats du tableau de bord super-admin.

### Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Connexion client et serveur. Absentes, l'app tourne en mode démo. |
| `SUPABASE_SERVICE_ROLE_KEY` | Panneau `/admin`, commandes de la vitrine publique, journal d'audit. Secrète. |
| `ADMIN_EMAILS` | Seule source du statut super-admin. |
| `INVITE_SECRET` | Signature des liens d'invitation d'agent. |
| `NEXT_PUBLIC_SITE_URL` | Domaine public utilisé dans les liens de vitrine et les messages WhatsApp. |

## Sauvegardes

Tout le commerce des marchands tient dans une seule base Postgres. Deux
protections, qui ne se remplacent pas.

### 1. La sauvegarde continue de Supabase (indispensable)

À activer dans le tableau de bord Supabase (*Database → Backups*). C'est la
seule protection qui permette de revenir à l'état exact d'avant une fausse
manipulation SQL, et la seule qui reprenne les comptes d'authentification, les
politiques de sécurité et les déclencheurs. Aucun script ne peut la remplacer.

### 2. L'export de l'application (complément)

```bash
npm run backup                    # → backups/<date>/
npm run backup -- --with-files    # + les images et les pièces jointes
npm run backup -- --out D:/sauve  # ailleurs qu'en local
```

Chaque table devient un fichier JSON, avec un `manifeste.json` qui compte les
lignes et inventorie les fichiers stockés. Utile pour retrouver une ligne
supprimée, récupérer le catalogue d'un marchand, ou remplir une préproduction.

Le dossier `backups/` est exclu du dépôt : **il contient les données des
marchands, y compris des pièces d'identité.** Ne le mets pas dans un partage
public, et supprime les exports dont tu n'as plus besoin.

## Base de préproduction

Aujourd'hui chaque migration part directement en production. Un second projet
Supabase, gratuit, supprime ce risque :

1. crée un nouveau projet Supabase (par exemple `converza-preprod`) ;
2. exécute-y `db/schema.sql` puis les huit migrations, dans l'ordre ;
3. écris ses clés dans `.env.preprod` (exclu du dépôt) ;
4. remplis-la avec une sauvegarde :

```bash
node scripts/restore.mjs backups/<date> --env .env.preprod        # simulation
node scripts/restore.mjs backups/<date> --env .env.preprod --yes  # écriture
```

Le script **refuse d'écrire dans la base de `.env.local`**, il simule par
défaut, et il ignore une table qui contient déjà des lignes. Les encaissements
et les mouvements de stock ne sont pas réécrits : la base les recalcule à partir
des commandes, les réécrire doublerait les lignes. Les comptes de connexion ne
sont pas repris — crée-les depuis `/enskri`.

Ensuite, toute nouvelle migration se joue d'abord là, puis en production.

## Export comptable

Écran **Kès → Livre journal** : un fichier CSV des opérations de la période
choisie, une ligne par mouvement — vente, encaissement, dépense, achat — avec
date, référence, tiers, entrée, sortie, moyen de paiement et devise.

La vente et son encaissement sont deux lignes distinctes : la première dit ce
qui a été vendu, la seconde ce qui est réellement rentré. Pour un achat, seule
la part payée apparaît en sortie de caisse ; le reste est une dette
fournisseur, qui n'appartient pas au journal.

Le fichier s'ouvre dans Excel, LibreOffice ou Google Sheets (point-virgule,
UTF-8 avec BOM, dates ISO). Il est réservé aux membres autorisés à voir les
chiffres du commerce, vérifié côté serveur sur l'adhésion en base et non sur un
cookie.

## Pages légales et pièces d'identité

Deux pages publiques, en français, créole et anglais :

- `/kondisyon` — conditions d'utilisation ;
- `/konfidansyalite` — politique de confidentialité.

Elles décrivent **ce que le code fait réellement** : ce qui est public (la
vitrine), ce qui ne l'est jamais (comptes de paiement, prix d'achat, clients,
commandes), et combien de temps chaque donnée est gardée. Quand le
comportement du logiciel change, ces textes changent avec lui
(`lib/i18n/legal.ts`).

Le nom, l'e-mail et le WhatsApp affichés en bas de ces pages se saisissent dans
la console, **Abonnements → Mentions légales et contact**. Tant qu'ils sont
vides, les pages disent qu'aucun contact n'est publié plutôt que d'en inventer
un.

### Pièces d'identité

Une demande de changement de numéro s'accompagne d'une pièce d'identité. Elle
est supprimée dès que la demande est tranchée ou annulée. Deux cas échappent à
cette règle et sont rattrapés par un script :

```bash
node scripts/purge-verification.mjs         # état des lieux
node scripts/purge-verification.mjs --yes   # supprime
```

Il supprime les envois abandonnés de plus de sept jours (un marchand qui dépose
sa pièce puis quitte le formulaire) et les pièces des demandes laissées sans
décision depuis plus de trente jours. À lancer une fois par semaine.

## Contrôles automatiques

`.github/workflows/ci.yml` rejoue à chaque poussée ce qui ne tournait jusqu'ici
que sur un poste : `tsc`, les tests et le build de production. Aucun secret
n'est nécessaire — le build passe en mode démo sans clés Supabase.

## Tests

```bash
npm test
```

Couvre ce qui se paie cher à casser : calculs d'argent en centimes, liens
`wa.me`, permissions des agents, plan réellement dû à l'échéance, périodes de
caisse, diagnostic des comptes marchands, ordre de réécriture des sauvegardes, et
la présence de chaque texte dans les trois langues.

Les migrations SQL, elles, se vérifient sur un Postgres local (PGlite) : chaque
fichier est rejoué deux fois, et les droits sont contrôlés en se faisant passer
pour un compte connecté.

## Structure

```
app/            # écrans (App Router) — page.tsx = Tablo debò
components/      # UI partagée (BottomNav…)
lib/            # whatsapp.ts, money.ts, types.ts, supabase/, demo.ts
db/             # schema.sql (tables + RLS), seed.sql (démo Ti Kòk Boutik)
*.dc.html       # maquettes des 7 écrans (design canvas)
```

## Maquettes

Les 7 écrans du MVP (#0 vitrine + 6 écrans app) sont dans les fichiers `*.dc.html`
et publiés comme design canvas. Ils servent de référence visuelle pour l'implémentation.
