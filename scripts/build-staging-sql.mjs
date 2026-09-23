// Assemble les douze fichiers de db/ en un seul script, dans l'ordre de
// montage. C'est ce qu'on colle dans l'éditeur SQL d'un projet neuf — pour un
// staging, ou pour remonter la base après un incident.
//
// Fichier généré : ne pas le modifier à la main. `npm run staging-sql`.
import { readFileSync, writeFileSync } from "node:fs";
import { ORDRE_MONTAGE } from "../db/ordre.mjs";

const entete = `-- ============================================================
-- CONVERZA — montage complet d'une base neuve
--
-- GÉNÉRÉ par scripts/build-staging-sql.mjs — ne pas modifier à la main.
-- Source : les ${ORDRE_MONTAGE.length} fichiers de db/, dans l'ordre de montage.
--
-- À coller dans l'éditeur SQL d'un projet Supabase VIDE.
-- Ne jamais lancer sur la production : le script recrée tout.
--
-- Après exécution, lancer db/verifier-rls.sql pour contrôler l'isolation.
-- ============================================================

`;

const corps = ORDRE_MONTAGE.map((f, i) => {
  const sql = readFileSync(new URL(`../db/${f}`, import.meta.url), "utf8").trimEnd();
  return `\n-- ══════════════════════════════════════════════════════════\n` +
         `-- ÉTAPE ${i + 1} / ${ORDRE_MONTAGE.length} — ${f}\n` +
         `-- ══════════════════════════════════════════════════════════\n\n${sql}\n`;
}).join("\n");

const sortie = new URL("../db/staging-complet.sql", import.meta.url);
writeFileSync(sortie, entete + corps, "utf8");
console.log(`db/staging-complet.sql : ${(entete + corps).split("\n").length} lignes`);
