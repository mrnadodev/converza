// Réécriture d'une sauvegarde dans une base CONVERZA — destinée à remplir une
// base de PRÉPRODUCTION, pas à réparer la production.
//
//   node scripts/restore.mjs backups/2026-09-19T02-47-24 --env .env.preprod
//   ... --yes                     écrit vraiment (sans ce drapeau : simulation)
//   ... --only businesses,products  se limite à certaines tables
//   ... --with-derived            réécrit aussi les tables recalculées (déconseillé)
//
// Trois garde-fous, parce qu'une erreur ici détruit le travail de marchands :
//   1. simulation par défaut ;
//   2. refus si la cible est la base de .env.local (la production) ;
//   3. refus si une table visée contient déjà des lignes, sauf --force.
//
// Les encaissements et les mouvements de stock sont recalculés par la base à
// partir des commandes : les réécrire doublerait les lignes. Ils sont donc
// exclus par défaut.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { TABLE_NAMES, derivedTables, restoreOrder } from "./tables.mjs";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const dir = args[0] && !args[0].startsWith("--") ? args[0] : null;
if (!dir) {
  console.error("Usage : node scripts/restore.mjs <dossier de sauvegarde> --env .env.preprod [--yes]");
  process.exit(1);
}
if (!fs.existsSync(path.join(dir, "manifeste.json"))) {
  console.error(`${dir} ne contient pas de manifeste.json : ce n'est pas une sauvegarde.`);
  process.exit(1);
}

const readEnv = (file) =>
  fs.existsSync(file)
    ? Object.fromEntries(
        fs
          .readFileSync(file, "utf8")
          .split(/\r?\n/)
          .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
          .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
      )
    : {};

const envFile = value("--env", ".env.preprod");
const target = readEnv(path.join(process.cwd(), envFile));
const url = target.NEXT_PUBLIC_SUPABASE_URL;
const key = target.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(`${envFile} doit contenir NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY de la base CIBLE.`);
  process.exit(1);
}

// Garde-fou 2 : jamais la base de production.
const prod = readEnv(path.join(process.cwd(), ".env.local")).NEXT_PUBLIC_SUPABASE_URL;
if (prod && new URL(url).host === new URL(prod).host) {
  console.error("REFUS : la cible est la base de .env.local, c'est-à-dire la production.");
  console.error("Cet outil remplit une préproduction. Pour la production, passe par la restauration de Supabase.");
  process.exit(1);
}

/** Coupe un appel qui ne répond pas : une mauvaise adresse doit se voir vite. */
const withTimeout = (ms) => (input, init) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer));
};

const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifeste.json"), "utf8"));
const asked = value("--only", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const excluded = flag("--with-derived") ? [] : derivedTables();
const unknown = asked.filter((t) => !TABLE_NAMES.includes(t));
if (unknown.length) {
  console.error(`Table inconnue : ${unknown.join(", ")}`);
  process.exit(1);
}

const wanted = (asked.length ? asked : TABLE_NAMES)
  .filter((t) => !excluded.includes(t))
  .filter((t) => fs.existsSync(path.join(dir, `${t}.json`)));
const order = restoreOrder(wanted);

const db = createClient(url, key, { auth: { persistSession: false }, global: { fetch: withTimeout(20_000) } });
const write = flag("--yes");
console.log(`Sauvegarde : ${manifest.date} (projet ${manifest.projet})`);
console.log(`Cible      : ${new URL(url).host}`);
console.log(`Mode       : ${write ? "ÉCRITURE" : "simulation (ajoute --yes pour écrire)"}`);
if (excluded.length) console.log(`Exclues    : ${excluded.join(", ")} — la base les recalcule`);
console.log("");

let failures = 0;
for (const name of order) {
  const rows = JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), "utf8"));
  if (rows.length === 0) {
    console.log(`${name.padEnd(24)} vide`);
    continue;
  }

  // Garde-fou 3 : on n'écrase pas des données déjà présentes.
  const probe = await db.from(name).select("*", { count: "exact", head: true }).then(
    (r) => r,
    (e) => ({ count: null, error: { message: String(e?.message ?? e) } }),
  );
  const { count, error: countErr } = probe;
  if (countErr) {
    const injoignable = /abort|fetch failed|ENOTFOUND|timeout/i.test(countErr.message);
    console.log(`${name.padEnd(24)} ${injoignable ? "cible injoignable : " + countErr.message : "table absente dans la cible — migrations à jouer d'abord"}`);
    failures++;
    if (injoignable) break;
    continue;
  }
  if ((count ?? 0) > 0 && !flag("--force")) {
    console.log(`${name.padEnd(24)} ${count} ligne(s) déjà présentes — ignorée (--force pour passer outre)`);
    continue;
  }

  if (!write) {
    console.log(`${name.padEnd(24)} ${rows.length} ligne(s) à écrire`);
    continue;
  }

  let written = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await db.from(name).upsert(chunk, { onConflict: "id", ignoreDuplicates: false });
    if (error) {
      console.log(`${name.padEnd(24)} ÉCHEC : ${error.message}`);
      failures++;
      break;
    }
    written += chunk.length;
  }
  if (written) console.log(`${name.padEnd(24)} ${written} ligne(s) écrites`);
}

console.log("");
if (!write) console.log("Simulation terminée : rien n'a été écrit.");
console.log(
  failures
    ? `${failures} table(s) en échec.`
    : "Terminé. Les comptes d'authentification ne sont pas repris : crée-les depuis /enskri ou la console Supabase.",
);
process.exit(failures ? 1 : 0);
