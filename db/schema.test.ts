import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

// Peut-on recréer la base à partir des fichiers du dépôt, sur une base vide ?
//
// C'est la question du jour d'un incident, et celle du montage d'un projet de
// test. La réponse était non : db/schema.sql appelait my_business_id() avant de
// la définir, et cinq migrations refusaient de redéfinir la vue publique. Rien
// ne s'en apercevait, parce que la production avait été construite migration
// par migration et que personne n'était jamais reparti de zéro.
//
// Ce test rejoue le montage complet. Il tourne sur PGlite — un vrai PostgreSQL,
// sans les schémas propres à Supabase, qu'on recrée au minimum ci-dessous.

const DB = join(__dirname);

/** L'ordre dans lequel un projet neuf doit être monté. */
const ORDRE = [
  "schema.sql",
  "migrate-2026-1-enums.sql",
  "migrate-2026-2-schema.sql",
  "migrate-2026-3-admin.sql",
  "migrate-2026-4-numero.sql",
  "migrate-2026-5-stock.sql",
  "migrate-2026-5b-correctif-stock.sql",
  "migrate-2026-6-gestion.sql",
  "migrate-2026-7-support.sql",
  "migrate-2026-8-abonnement.sql",
  "migrate-2026-9-vitrine-accueil.sql",
  "migrate-2026-10-vitrine-produits.sql",
];

/** Tables volontairement réservées à la console (clé de service). */
const SERVICE_SEUL = ["app_errors", "platform_settings", "security_audit_logs"];

let db: PGlite;
const erreurs: string[] = [];

beforeAll(async () => {
  db = new PGlite();
  // Ce que Supabase fournit et que PGlite n'a pas : les comptes et le stockage.
  await db.exec(`
    create schema if not exists auth;
    create table auth.users (id uuid primary key default gen_random_uuid());
    create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    create role authenticated; create role anon; create role service_role;

    create schema if not exists storage;
    create table storage.buckets (id text primary key, name text, public boolean default false);
    create table storage.objects (id uuid primary key default gen_random_uuid(),
      bucket_id text references storage.buckets(id), name text, owner uuid);
    alter table storage.objects enable row level security;
  `);

  for (const fichier of ORDRE) {
    // pgcrypto n'est pas empaquetée dans PGlite ; gen_random_uuid() y est native.
    const sql = readFileSync(join(DB, fichier), "utf8").replace(/create extension if not exists "pgcrypto";/, "");
    try {
      await db.exec(sql);
    } catch (e) {
      erreurs.push(`${fichier} : ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}, 120_000);

const rows = <T>(sql: string) => db.query<T>(sql).then((r) => r.rows);

describe("montage d'une base à partir de zéro", () => {
  it("passe les douze fichiers sans erreur", () => {
    expect(erreurs).toEqual([]);
  });

  it("aboutit à la version de base attendue", async () => {
    const [v] = await rows<{ v: string }>(`select value->>'migration' as v from platform_settings where key='db_version'`);
    expect(v?.v).toBe("10");
  });

  it("crée les tables dont l'application se sert", async () => {
    const noms = (await rows<{ relname: string }>(
      `select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
       where n.nspname='public' and c.relkind='r'`,
    )).map((r) => r.relname);
    for (const t of ["businesses", "products", "orders", "expenses", "subscription_payments", "purchases"]) {
      expect(noms, `table ${t}`).toContain(t);
    }
  });

  it("isole les marchands les uns des autres", async () => {
    // Le même contrôle que db/verifier-rls.sql, joué sur une base neuve.
    const nus = await rows<{ table_name: string; nb_regles: number }>(
      readFileSync(join(DB, "verifier-rls.sql"), "utf8"),
    );
    const inattendues = nus.map((r) => r.table_name).filter((t) => !SERVICE_SEUL.includes(t));
    expect(inattendues, "tables sans isolation entre marchands").toEqual([]);
  });

  it("expose la vitrine publique sans les coordonnées bancaires du marchand", async () => {
    const colonnes = (await rows<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema='public' and table_name='public_businesses'`,
    )).map((r) => r.column_name);
    expect(colonnes).toContain("slug");
    expect(colonnes).toContain("logo_url");
    for (const secret of ["moncash_number", "natcash_number", "usdt_address", "bank_account"]) {
      expect(colonnes, `« ${secret} » ne doit pas sortir sur la vitrine`).not.toContain(secret);
    }
  });
});
