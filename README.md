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
2. Dans **SQL Editor**, exécute `db/schema.sql` puis `db/seed.sql`.
3. Copie l'URL et la clé anon dans `.env.local`.
4. Remplace progressivement les `demo*` par des requêtes Supabase
   (voir `lib/supabase/server.ts`).

### Base existante : migration obligatoire

Une base créée avant l'ajout du pipeline à 7 étapes doit être migrée. **Sans
cela, l'app ne fonctionne pas.** Dans le SQL Editor de Supabase, exécute les deux
fichiers **dans deux requêtes séparées** :

1. `db/migrate-2026-1-enums.sql`
2. `db/migrate-2026-2-schema.sql`

Les coller ensemble échoue avec `ERROR 55P04: unsafe use of new value`. L'éditeur
enveloppe tout le script dans une seule transaction, et Postgres refuse d'utiliser
une valeur d'enum dans la transaction qui vient de la créer.

Les deux fichiers sont **autonomes et rejouables**. Le second rattrape en tête
toutes les migrations de 2025 (`theme`, `verticals`, `delivery`, `subscription`,
`payment-methods`, `storage`, `onboarding`, `team`) : pas besoin de savoir
lesquelles ont été jouées sur la base.

La migration apporte :

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

## Tests

```bash
npm test
```

Couvre les helpers critiques : génération de liens `wa.me` (`lib/whatsapp.ts`)
et calculs d'argent en centimes (`lib/money.ts`).

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
