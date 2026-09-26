// Le mot CONVERZA, avec son Z en vert.
//
// Le Z est toujours vert. Sur blanc, sur gris, sur le noir d'encre de la page
// d'accueil, c'est le vert de la marque — #008069 — qui le distingue du reste
// du mot.
//
// Une exception, et une seule : sur le vert de la marque lui-même, écrans de
// connexion et d'invitation, ce même vert se confondrait avec le fond. Le Z y
// prend un vert plus sombre, qui tranche sur le vert vif sans cesser d'être
// vert. Un vert clair avait été essayé : il se voyait, mais se lisait comme
// une couleur d'accent plutôt que comme la lettre du logo.
//
// Le noir a été essayé et écarté : la page d'accueil est noir d'encre, pas
// verte, et un Z noir s'y effaçait entièrement.
//
// Écrit en dur dans une quinzaine de fichiers, ce Z n'aurait jamais été
// cohérent — et une correction de teinte aurait demandé quinze modifications.
//
// Le mot reste un seul nœud de texte pour les lecteurs d'écran et le
// copier-coller : la coupure n'est que visuelle.

/** Vert de la marque, sur tout fond qui n'est pas lui-même vert. */
const VERT = "#008069";
/** Vert sombre, pour trancher sur le vert vif de la bannière de connexion. */
const VERT_SOMBRE = "#044D40";

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
  return (
    <span className={className}>
      CONVER
      <span style={{ color: tone === "onBrand" ? VERT_SOMBRE : VERT }}>Z</span>
      A
    </span>
  );
}
