// Sauvegarde de la base CONVERZA : chaque table est exportée ligne par ligne,
// avec l'inventaire des fichiers stockés.
//
//   node scripts/backup.mjs                 → backups/<date>/
//   node scripts/backup.mjs --out D:/sauve  → ailleurs (clé USB, disque externe)
//   node scripts/backup.mjs --with-files    → télécharge aussi les images
//
// CE QUE CET OUTIL FAIT : un état complet et lisible de la base, à une date.
// Il sert à retrouver une ligne supprimée, le catalogue d'un marchand, ou à
// remplir une base de préproduction.
//
// CE QU'IL NE FAIT PAS : remplacer une restauration à un instant T. Il ne
// sauvegarde ni les comptes d'authentification, ni les politiques de sécurité,
// ni les déclencheurs. Pour une vraie reprise après sinistre, la sauvegarde
// continue de Supabase (PITR) reste indispensable.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { TABLES } from "./tables.mjs";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
  );
}

const env = { ...readEnv(path.join(process.cwd(), ".env.local")), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Il manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = path.join(value("--out", path.join(process.cwd(), "backups")), stamp);
fs.mkdirSync(outDir, { recursive: true });

const PAGE = 1000;
const manifest = {
  date: new Date().toISOString(),
  projet: new URL(url).host, // jamais la clé, seulement le domaine du projet
  tables: {},
  fichiers: {},
  avertissements: [],
};

for (const { name } of TABLES) {
  const rows = [];
  let from = 0;
  let missing = false;
  for (;;) {
    const { data, error } = await db.from(name).select("*").range(from, from + PAGE - 1);
    if (error) {
      // Table absente : la migration correspondante n'a pas encore été jouée.
      missing = true;
      manifest.avertissements.push(`${name} : ${error.message}`);
      break;
    }
    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  if (missing) {
    manifest.tables[name] = null;
    console.log(`${name.padEnd(24)} absente`);
    continue;
  }
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(rows, null, 1), "utf8");
  manifest.tables[name] = rows.length;
  console.log(`${name.padEnd(24)} ${rows.length} ligne(s)`);
}

// Inventaire des fichiers : les images du catalogue et les pièces d'identité
// vivent dans le stockage, pas dans la base.
const { data: buckets, error: bucketErr } = await db.storage.listBuckets();
if (bucketErr) {
  manifest.avertissements.push(`stockage : ${bucketErr.message}`);
} else {
  for (const bucket of buckets) {
    const objects = [];
    const walk = async (prefix) => {
      const { data, error } = await db.storage.from(bucket.name).list(prefix, { limit: 1000 });
      if (error) {
        manifest.avertissements.push(`${bucket.name}/${prefix} : ${error.message}`);
        return;
      }
      for (const entry of data) {
        const full = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.id === null) await walk(full); // dossier
        else objects.push({ chemin: full, taille: entry.metadata?.size ?? null, modifie: entry.updated_at ?? null });
      }
    };
    await walk("");
    manifest.fichiers[bucket.name] = { public: bucket.public, nombre: objects.length, objets: objects };
    console.log(`fichiers ${bucket.name.padEnd(15)} ${objects.length}`);

    if (flag("--with-files")) {
      const dir = path.join(outDir, "fichiers", bucket.name);
      let saved = 0;
      for (const obj of objects) {
        const { data, error } = await db.storage.from(bucket.name).download(obj.chemin);
        if (error || !data) {
          manifest.avertissements.push(`téléchargement ${bucket.name}/${obj.chemin} : ${error?.message ?? "vide"}`);
          continue;
        }
        const target = path.join(dir, obj.chemin);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, Buffer.from(await data.arrayBuffer()));
        saved++;
      }
      console.log(`   téléchargés : ${saved}/${objects.length}`);
    }
  }
}

fs.writeFileSync(path.join(outDir, "manifeste.json"), JSON.stringify(manifest, null, 2), "utf8");
const total = Object.values(manifest.tables).reduce((a, n) => a + (n ?? 0), 0);
console.log(`\nSauvegarde écrite dans ${outDir}`);
console.log(`${total} ligne(s) au total${manifest.avertissements.length ? `, ${manifest.avertissements.length} avertissement(s) — voir manifeste.json` : ""}`);
console.log("Ce dossier contient les données de tes marchands : garde-le hors du dépôt et hors d'un partage public.");
