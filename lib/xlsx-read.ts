/**
 * Lire un classeur .xlsx, assez pour en tirer un tableau de cellules.
 *
 * Pourquoi écrire ça plutôt que prendre une bibliothèque : le projet écrit
 * déjà ses .xlsx à la main (lib/xlsx.ts) pour ne dépendre de rien, et les
 * lecteurs du marché pèsent plusieurs centaines de kilo-octets pour un besoin
 * qui tient en une page — le marchand dépose un tableau de six colonnes.
 *
 * Ce que ça sait faire : un .xlsx est un ZIP. On y cherche la première
 * feuille et la table des chaînes partagées, on les décompresse, et on relit
 * les cellules. Les formules, les dates, les styles et les feuilles multiples
 * ne sont pas interprétés : un fichier d'import n'en a pas besoin, et
 * prétendre les gérer à moitié serait pire que de ne pas les gérer.
 *
 * Ce que ça ne sait pas faire : les archives chiffrées, et les entrées
 * compressées autrement qu'en « deflate » ou « stocké ». Les deux cas
 * remontent une erreur explicite plutôt qu'un tableau vide, parce qu'un
 * tableau vide se lit comme « votre fichier ne contient rien ».
 */

interface EntreeZip {
  nom: string;
  methode: number;
  debut: number;
  taille: number;
}

/** Lit le répertoire central du ZIP, qui est en fin de fichier. */
function lireEntrees(buf: Uint8Array): EntreeZip[] {
  const vue = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  // Fin du répertoire central : signature 0x06054b50, cherchée depuis la fin.
  let fin = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 65557; i--) {
    if (vue.getUint32(i, true) === 0x06054b50) { fin = i; break; }
  }
  if (fin < 0) throw new Error("Ce fichier n'est pas un classeur Excel.");

  const nb = vue.getUint16(fin + 10, true);
  let p = vue.getUint32(fin + 16, true);
  const entrees: EntreeZip[] = [];
  for (let i = 0; i < nb; i++) {
    if (vue.getUint32(p, true) !== 0x02014b50) break;
    const methode = vue.getUint16(p + 10, true);
    const taille = vue.getUint32(p + 20, true);
    const nLen = vue.getUint16(p + 28, true);
    const eLen = vue.getUint16(p + 30, true);
    const cLen = vue.getUint16(p + 32, true);
    const offLocal = vue.getUint32(p + 42, true);
    const nom = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nLen));
    // L'en-tête local porte ses propres longueurs : celles du répertoire
    // central ne valent pas pour lui.
    const nLen2 = vue.getUint16(offLocal + 26, true);
    const eLen2 = vue.getUint16(offLocal + 28, true);
    entrees.push({ nom, methode, debut: offLocal + 30 + nLen2 + eLen2, taille });
    p += 46 + nLen + eLen + cLen;
  }
  return entrees;
}

async function contenu(buf: Uint8Array, e: EntreeZip): Promise<string> {
  const brut = buf.subarray(e.debut, e.debut + e.taille);
  if (e.methode === 0) return new TextDecoder().decode(brut);
  if (e.methode !== 8) throw new Error("Ce classeur utilise une compression que nous ne savons pas lire.");
  // « deflate-raw » : le flux ZIP n'a pas l'en-tête zlib.
  const copie = new Uint8Array(brut); // detache la vue du tampon d origine
  const flux = new Blob([copie]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return await new Response(flux).text();
}

function decoder(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, "&");
}

/** Numéro de colonne depuis sa référence : A→0, B→1, AA→26. */
function indiceColonne(ref: string): number {
  const lettres = ref.replace(/\d+/g, "");
  let n = 0;
  for (const c of lettres) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * Rend la première feuille sous forme de lignes de chaînes.
 *
 * Les lignes et colonnes absentes sont comblées : Excel n'écrit pas les
 * cellules vides, et sans ce remplissage une ligne dont la catégorie est vide
 * verrait son prix glisser dans la colonne de la catégorie.
 */
export async function lireClasseur(donnees: ArrayBuffer): Promise<string[][]> {
  const buf = new Uint8Array(donnees);
  const entrees = lireEntrees(buf);

  const feuille = entrees.find((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.nom));
  if (!feuille) throw new Error("Ce classeur ne contient aucune feuille.");

  const partagees: string[] = [];
  const ss = entrees.find((e) => e.nom === "xl/sharedStrings.xml");
  if (ss) {
    const xml = await contenu(buf, ss);
    for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      // Une chaîne peut être découpée en plusieurs <t> par Excel.
      const morceaux = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decoder(x[1]));
      partagees.push(morceaux.join(""));
    }
  }

  const xml = await contenu(buf, feuille);
  const lignes: string[][] = [];
  for (const mLigne of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const numero = parseInt(mLigne[1], 10) - 1;
    const cols: string[] = [];
    for (const mC of mLigne[2].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = mC[1];
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const type = /t="([^"]+)"/.exec(attrs)?.[1];
      const i = ref ? indiceColonne(ref) : cols.length;
      let valeur = "";
      if (type === "inlineStr") {
        valeur = [...mC[2].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decoder(x[1])).join("");
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(mC[2])?.[1];
        if (v !== undefined) valeur = type === "s" ? (partagees[+v] ?? "") : decoder(v);
      }
      while (cols.length < i) cols.push("");
      cols[i] = valeur;
    }
    while (lignes.length < numero) lignes.push([]);
    lignes[numero] = cols;
  }
  return lignes;
}

/** Vrai si le fichier commence par la signature d'un ZIP, donc d'un .xlsx. */
export function estClasseur(donnees: ArrayBuffer): boolean {
  const b = new Uint8Array(donnees, 0, Math.min(4, donnees.byteLength));
  return b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 3 || b[2] === 5 || b[2] === 7);
}
