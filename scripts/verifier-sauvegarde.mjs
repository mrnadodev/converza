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
//
// Le découpage ne peut pas se faire sur un simple « ; » : les corps de
// fonctions PostgreSQL sont entourés de $$ et contiennent eux-mêmes des
// points-virgules. Un découpage naïf les met en pièces et fait échouer la
// restauration pour de mauvaises raisons.
function decouper(texte) {
  const sorties = [];
  let courant = "";
  let i = 0;
  while (i < texte.length) {
    const c = texte[i];
    const deux = texte.slice(i, i + 2);

    if (deux === "--") {                        // commentaire de ligne
      const fin = texte.indexOf("\n", i);
      i = fin === -1 ? texte.length : fin;
      continue;
    }
    if (deux === "/*") {                        // commentaire de bloc
      const fin = texte.indexOf("*/", i + 2);
      i = fin === -1 ? texte.length : fin + 2;
      continue;
    }
    if (c === "'" || c === '"') {               // chaîne ou identifiant cité
      let j = i + 1;
      while (j < texte.length) {
        if (texte[j] === c && texte[j + 1] === c) { j += 2; continue; }
        if (texte[j] === c) break;
        j++;
      }
      courant += texte.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === "$") {                            // corps de fonction $tag$…$tag$
      const balise = /^\$[A-Za-z_0-9]*\$/.exec(texte.slice(i));
      if (balise) {
        const fin = texte.indexOf(balise[0], i + balise[0].length);
        const j = fin === -1 ? texte.length : fin + balise[0].length;
        courant += texte.slice(i, j);
        i = j;
        continue;
      }
    }
    if (c === ";") { sorties.push(courant); courant = ""; i++; continue; }
    courant += c;
    i++;
  }
  if (courant.trim()) sorties.push(courant);
  return sorties
    .map((x) => x.trim())
    .filter((x) => x && !x.startsWith("\\") && !/^COPY /.test(x));  // \restrict, \unrestrict, et les COPY traites plus bas
}

// Les blocs « COPY … FROM stdin » sont une convention de psql : les lignes de
// données suivent la commande, hors SQL. Un moteur qui ne parle que le SQL ne
// peut pas les lire. On les traduit en INSERT pour pouvoir rejouer le dump
// ailleurs que dans psql.
function extraireCopies(texte) {
  const sorties = [];
  const reste = [];
  const lignes = texte.split("\n");
  const AS = String.fromCharCode(92);
  const FIN = AS + ".";
  const desechapper = (v) => {
    if (v === AS + "N") return null;
    return v
      .split(AS + "r").join("\r")
      .split(AS + "n").join("\n")
      .split(AS + "t").join("\t")
      .split(AS + AS).join(AS);
  };
  const citer = (v) => (v === null ? "NULL" : "'" + v.split("'").join("''") + "'");

  for (let i = 0; i < lignes.length; i++) {
    const entete = /^COPY (\S+) \(([^)]*)\) FROM stdin;/.exec(lignes[i]);
    if (!entete) { reste.push(lignes[i]); continue; }
    const [, table, colonnes] = entete;
    const valeurs = [];
    let j = i + 1;
    for (; j < lignes.length && lignes[j] !== FIN; j++) {
      if (lignes[j] === "") continue;
      valeurs.push("(" + lignes[j].split("\t").map(desechapper).map(citer).join(", ") + ")");
    }
    i = j;
    // Par paquets : une seule requête de dix mille lignes est plus lente
    // qu'une dizaine de mille.
    for (let k = 0; k < valeurs.length; k += 500) {
      sorties.push(`INSERT INTO ${table} (${colonnes}) VALUES ` + valeurs.slice(k, k + 500).join(", "));
    }
  }
  return { inserts: sorties, sansCopies: reste.join("\n") };
}

// Les blocs COPY sont retirés du texte avant le découpage : leurs lignes de
// données ne sont pas du SQL et rendraient l'instruction suivante illisible.
const { inserts, sansCopies } = extraireCopies(sql);

// « session_replication_role = replica » met les déclencheurs en sommeil le
// temps du chargement. Sans ça, insérer un produit rejoue le déclencheur de
// mouvement de stock et fabrique des lignes qui n'étaient pas dans la
// sauvegarde — on croirait restaurer plus que ce qu'on a sauvegardé.
// pg_dump obtient le même résultat en créant les déclencheurs après les
// données ; ici les INSERT arrivent en dernier, d'où cette précaution.
const instructions = [
  ...decouper(sansCopies),
  "SET session_replication_role = replica",
  ...inserts,
  "SET session_replication_role = origin",
];

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
  const b = await q(`select name, slug from "public"."businesses" order by created_at`);
  console.log(`\nboutiques retrouvées (${b.length}) :`);
  for (const x of b) console.log(`  · ${x.name} — /b/${x.slug}`);
} catch {
  console.log("\nLa table businesses n'a pas été restaurée.");
}

const verdict = total > 0 && tables.length > 10;
console.log(`\n${verdict ? "CETTE SAUVEGARDE EST RESTAURABLE" : "PROBLÈME : la restauration n'a pas produit de données"}`);
process.exit(verdict ? 0 : 1);
