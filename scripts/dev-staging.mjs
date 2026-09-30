// Lance le serveur de développement contre la base de STAGING, sans toucher
// à .env.local.
//
// Pourquoi ce script existe : vérifier une migration demande de voir
// l'application tourner contre la base migrée. Les déploiements d'aperçu
// Vercel sont derrière le SSO de l'organisation, et échanger .env.local
// contre .env.staging finit un jour par ne pas être remis en place — avec un
// serveur local qui écrit dans la mauvaise base sans que rien ne le dise.
//
// Next ne remplace pas une variable déjà présente dans process.env par celle
// d'un fichier .env : charger .env.staging ici suffit à ce que .env.local
// soit ignoré, tout en le laissant intact sur le disque.
//
//   node scripts/dev-staging.mjs [port]   (3001 par défaut)

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const FICHIER = ".env.staging";
if (!existsSync(FICHIER)) {
  console.error(`${FICHIER} est introuvable. Ce script ne sert qu'à viser staging.`);
  process.exit(1);
}

for (const ligne of readFileSync(FICHIER, "utf8").split(/\r?\n/)) {
  if (!ligne.includes("=") || ligne.trim().startsWith("#")) continue;
  const i = ligne.indexOf("=");
  const cle = ligne.slice(0, i).trim();
  const valeur = ligne.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  process.env[cle] = valeur;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Garde-fou : si .env.staging pointait un jour sur la production, ce script
// deviendrait un moyen silencieux d'écrire dans la vraie base.
if (url.includes("ftezqvnzaeoqlgqwjxst")) {
  console.error("STOP : .env.staging pointe sur la base de PRODUCTION. Rien n'a été lancé.");
  process.exit(1);
}

const port = process.argv[2] ?? "3001";
console.log(`staging : ${url}\nhttp://localhost:${port}`);

spawn("npx", ["next", "dev", "-p", port], { stdio: "inherit", shell: true }).on("exit", (c) => process.exit(c ?? 0));
