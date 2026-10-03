import { NextResponse } from "next/server";
import { buildImportTemplate } from "@/lib/import-template";

/**
 * Le modèle d'importation, en vrai classeur Excel.
 *
 * C'était un CSV à points-virgules. Excel ne découpe un CSV que si son
 * séparateur correspond à celui du système : sur une machine configurée en
 * anglais, le fichier arrivait entièrement dans la colonne A, guillemets
 * compris. Le marchand voyait une colonne illisible et n'avait aucun moyen de
 * savoir que le fichier était pourtant correct.
 */
export async function GET(request: Request) {
  const demandee = new URL(request.url).searchParams.get("lang");
  const langue = demandee === "ht" || demandee === "en" ? demandee : "fr";
  const classeur = buildImportTemplate(langue);

  return new NextResponse(classeur as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="modele-katalog-pasrel.xlsx"',
      "Content-Length": String(classeur.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
