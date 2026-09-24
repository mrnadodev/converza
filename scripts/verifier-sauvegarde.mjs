// Vérifie qu'une sauvegarde est vraiment restaurable.
//
//   node scripts/verifier-sauvegarde.mjs chemin/vers/converza_....sql.gz
//
// Le dump est rejoué sur une base PostgreSQL vide et jetable (PGlite), puis on
// compte ce qui s'y trouve. Aucune connexion réseau, aucun mot de passe, et
// rien n'est touché ni sur la production ni sur le staging.
//
// Une sauvegarde qu'on n'a jamais restaurée n'est pas une sauvegarde : c'est
// un fichier. C'est cet outil qui fait la différence.

import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { PGlite } from "@electric-sql/pglite";

const chemin = process.argv[2];
if (!chemin) {
  console.error("Indiquez le fichier : node scripts/verifier-sauvegarde.mjs <dump.sql.gz>");
  process.exit(1);
}

const brut = readFileSync(chemin);
const sql = (chemin.endsWith(".gz") ? gunzipSync(brut) : brut).toString("utf8");
console.log(`${chemin}\n  ${brut.length} octets compressés, ${sql.length} une fois décompressé\n`);

const db = new PGlite();
// Supabase fournit ces schémas et rôles ; une base nue ne les a pas.
await db.exec(`
  create schema if not exists auth;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
    if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
    if not exists (select 1 from pg_roles where rolname='supabase_auth_admin') then create role supabase_auth_admin; end if;
  end $$;
`);

// Le dump est rejoué instruction par instruction : une base nue refuse
// forcément quelques lignes propres à Supabase (extensions, propriétaires,
// commentaires système). On les compte au lieu de s'arrêter à la première.
const instructions = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--") && !s.startsWith("\\"));

let passees = 0;
const refus = new Map();
for (const inst of instructions) {
  try {
    await db.exec(inst + ";");
    passees++;
  } catch (e) {
    const motif = String(e.message).split("\n")[0].slice(0, 80);
    refus.set(motif, (refus.get(motif) ?? 0) + 1);
  }
}
console.log(`instructions : ${passees} passées, ${instructions.length - passees} refusées`);
if (refus.size > 0) {
  console.log("refus (normaux sur une base nue) :");
  for (const [m, n] of [...refus].sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`  ×${n}  ${m}`);
}

const q = (s) => db.query(s).then((r) => r.rows);
const tables = await q(`select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
                        where n.nspname='public' and c.relkind='r' order by c.relname`);
console.log(`\ntables restaurées : ${tables.length}`);

let total = 0;
const lignes = [];
for (const { relname } of tables) {
  const [{ n }] = await q(`select count(*)::int as n from "public"."${relname}"`);
  total += n;
  if (n > 0) lignes.push([n, relname]);
}
lignes.sort((a, b) => b[0] - a[0]);
console.log("contenu :");
for (const [n, t] of lignes) console.log(`  ${String(n).padStart(6)}  ${t}`);
console.log(`  ${String(total).padStart(6)}  TOTAL`);

// La preuve qui compte : les vraies boutiques sont-elles là ?
try {
  const b = await q(`select name, slug from businesses order by created_at`);
  console.log(`\nboutiques retrouvées (${b.length}) :`);
  for (const x of b) console.log(`  · ${x.name} — /b/${x.slug}`);
} catch {
  console.log("\nLa table businesses n'a pas été restaurée.");
}

const verdict = total > 0 && tables.length > 10;
console.log(`\n${verdict ? "CETTE SAUVEGARDE EST RESTAURABLE" : "PROBLÈME : la restauration n'a pas produit de données"}`);
process.exit(verdict ? 0 : 1);
