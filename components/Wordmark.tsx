// Le mot PASRÈL, avec son È en vert, et l'arche de la marque.
//
// L'accent porte la marque. « Passerelle » s'écrit sans accent en français :
// c'est le È qui dit que le mot est créole, et c'est pour ça qu'il est la
// seule lettre colorée. Le colorer n'est pas un ornement, c'est le propos.
//
// Le vert est celui de la marque — #008069 — sur blanc, sur gris et sur le
// noir d'encre de la page d'accueil.
//
// Une exception, et une seule : sur le vert de la marque, le mot est écrit
// tout blanc, sans accent coloré.
//
// Ce fond n'est pas un vert, c'est un dégradé qui va de #25D366 à #075E54.
// Entre ces deux extrémités il y a presque un facteur huit de luminance, et
// aucune couleur unique ne tient sur les deux : le vert sombre hérité de
// l'ancien nom mesurait 1,24:1 contre l'extrémité foncée — le mot se lisait
// « PASR L », l'accent avait purement disparu. Un vert pâle passait l'autre
// extrémité de justesse, en se lisant délavé.
//
// Là où la couleur ne peut pas marquer la lettre, c'est l'arche posée
// au-dessus du mot qui porte la marque. Le mot n'a pas à la porter deux fois.
//
// Écrit en dur dans une quinzaine de fichiers, cet accent n'aurait jamais été
// cohérent — et une correction de teinte aurait demandé quinze modifications.
//
// Le mot reste un seul nœud de texte pour les lecteurs d'écran et le
// copier-coller : la coupure n'est que visuelle.

/** Vert de la marque, sur tout fond qui n'est pas lui-même vert. */
const VERT = "#008069";

export function Wordmark({
  tone = "onLight",
  className = "",
}: {
  /**
   * « onBrand » uniquement quand le fond est le vert de la marque. Partout
   * ailleurs — blanc, gris, noir d'encre — le défaut convient.
   */
  tone?: "onLight" | "onBrand";
  className?: string;
}) {
  if (tone === "onBrand") return <span className={className}>PASRÈL</span>;
  return (
    <span className={className}>
      PASR
      <span style={{ color: VERT }}>È</span>
      L
    </span>
  );
}
