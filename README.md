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
