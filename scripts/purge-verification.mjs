// Filet de sécurité sur les pièces justificatives (bucket privé « verification »).
//
//   node scripts/purge-verification.mjs            → état des lieux, rien supprimé
//   node scripts/purge-verification.mjs --yes      → supprime
//   node scripts/purge-verification.mjs --jours 14 → autre délai (défaut : 7)
//
// En temps normal, les pièces sont supprimées dès que la demande est tranchée
// (app/admin/actions.ts) ou annulée. Restent deux cas que personne ne surveille :
//
//   1. l'envoi abandonné : le marchand dépose sa pièce d'identité puis quitte le
//      formulaire. Le fichier existe, aucune demande ne le référence ;
//   2. la demande jamais tranchée : elle garde ses pièces aussi longtemps que
//      personne ne décide.
//
// On ne garde pas une pièce d'identité « au cas où ». Ce script supprime les
// fichiers orphelins passé le délai, et les pièces des demandes en attente
// depuis plus de 30 jours (la demande reste, avec la trace de la purge : le
// marchand devra renvoyer ses pièces si la décision arrive plus tard).

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const num = (n, d) => {
  const i = args.indexOf(n);
  const v = i >= 0 ? Number(args[i + 1]) : NaN;
  return Number.isFinite(v) && v >= 0 ? v : d;
};

const ORPHAN_DAYS = num("--jours", 7);
const PENDING_DAYS = num("--jours-attente", 30);
const BUCKET = "verification";
const write = flag("--yes");

const env = {
  ...Object.fromEntries(
    fs.existsSync(path.join(process.cwd(), ".env.local"))
      ? fs
          .readFileSync(path.join(process.cwd(), ".env.local"), "utf8")
          .split(/\r?\n/)
          .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
          .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
      : [],
  ),
  ...process.env,
};
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Il manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

// --- Fichiers présents dans le bucket ---
const files = [];
const walk = async (prefix) => {
  const { data, error } = await db.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) {
    console.error(`Lecture de ${BUCKET}/${prefix} impossible : ${error.message}`);
    process.exit(1);
  }
  for (const entry of data) {
    const full = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) await walk(full);
    else files.push({ chemin: full, cree: entry.created_at ?? entry.updated_at ?? null });
  }
};
await walk("");

// --- Fichiers encore référencés par une demande ---
const { data: requests, error: reqErr } = await db
  .from("phone_change_requests")
  .select("id, business_id, status, created_at, proof_paths, id_doc_path, docs_purged_at");
if (reqErr) {
  console.error(`Table phone_change_requests illisible : ${reqErr.message} (migration 4 jouée ?)`);
  process.exit(1);
}

const referenced = new Map(); // chemin -> demande
for (const r of requests) {
  for (const p of [...(r.proof_paths ?? []), r.id_doc_path].filter(Boolean)) referenced.set(p, r);
}

const now = Date.now();
const age = (iso) => (iso ? (now - Date.parse(iso)) / 86_400_000 : Infinity);

const orphans = files.filter((f) => !referenced.has(f.chemin) && age(f.cree) > ORPHAN_DAYS);
const recentOrphans = files.filter((f) => !referenced.has(f.chemin) && age(f.cree) <= ORPHAN_DAYS);
const stale = requests.filter((r) => r.status === "pending" && age(r.created_at) > PENDING_DAYS && (r.id_doc_path || (r.proof_paths ?? []).length));

console.log(`Fichiers dans ${BUCKET} : ${files.length}`);
console.log(`  référencés par une demande : ${referenced.size}`);
console.log(`  abandonnés depuis plus de ${ORPHAN_DAYS} j : ${orphans.length}`);
console.log(`  abandonnés récents (gardés) : ${recentOrphans.length}`);
console.log(`Demandes en attente depuis plus de ${PENDING_DAYS} j avec pièces : ${stale.length}`);
if (!write) {
  console.log("\nÉtat des lieux seulement. Ajoute --yes pour supprimer.");
  process.exit(0);
}

let removed = 0;
if (orphans.length) {
  const { error } = await db.storage.from(BUCKET).remove(orphans.map((o) => o.chemin));
  if (error) console.error(`Suppression des orphelins : ${error.message}`);
  else removed += orphans.length;
}

for (const r of stale) {
  const paths = [...(r.proof_paths ?? []), r.id_doc_path].filter(Boolean);
  const { error } = await db.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error(`Demande ${r.id} : ${error.message}`);
    continue;
  }
  removed += paths.length;
  await db
    .from("phone_change_requests")
    .update({ proof_paths: [], id_doc_path: null, docs_purged_at: new Date().toISOString() })
    .eq("id", r.id);
  console.log(`Demande ${r.id} : pièces supprimées (en attente depuis ${Math.round(age(r.created_at))} j)`);
}

console.log(`\n${removed} fichier(s) supprimé(s).`);
