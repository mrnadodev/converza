import Image from "next/image";

/**
 * La marque PASRÈL, telle que fournie.
 *
 * Ce sont les fichiers du marchand de la marque, pas des dessins refaits :
 * l'arche avait d'abord été redessinée en SVG « au plus près », et le
 * résultat n'était pas le logo — ses deux rubans y étaient devenus deux
 * filets concentriques. Un logo se livre, il ne se réinterprète pas.
 *
 * DEUX VERSIONS, et le choix se mesure. Contrastes relevés sur les fonds
 * réels de l'application, avec les teintes dominantes de chaque fichier :
 *
 *                                    positive        inversée
 *   fond blanc                       4,8 et 10,2     1,1 et 2,0
 *   barre d'accueil (encre)          3,4 et 1,6      15,8 et 8,3
 *   bannière connexion, côté foncé   1,6 et 1,3      7,3 et 3,8
 *   bannière connexion, côté clair   2,4 et 5,2      1,9 et 1,0
 *
 * Autrement dit : la positive sur les fonds clairs, l'inversée sur les fonds
 * sombres, et aucune des deux ne tient sur le vert vif de la marque — le
 * ruban vert de l'inversée s'y confond à 1,01, c'est-à-dire exactement la
 * même couleur. C'est pour ça que l'écran de connexion garde une plaque.
 *
 * Les fichiers : `pasrel-transparent.png` et `pasrel-white.png` sont les
 * originaux fournis ; les deux `-cadree` en sont le recadrage au plus près,
 * pour que l'arche ne flotte pas dans du vide.
 */
export function CvzMark({
  size = 72,
  tone = "onLight",
  cadrage = "serre",
  variante = "arche",
}: {
  size?: number;
  /** « onDark » dès que le fond est sombre : l'arche positive y disparaît. */
  tone?: "onLight" | "onDark";
  /**
   * « entier » sert le fichier d'origine, carré, où l'arche occupe 97 % de la
   * largeur mais 41 % de la hauteur — 24 % de vide au-dessus, 35 % en dessous.
   * « serre » sert le recadrage au plus près, sans vide.
   *
   * Le choix n'est pas cosmétique : l'écran de connexion fait chevaucher le
   * mot sur l'arche, et ce chevauchement est calé au pixel sur le rapport du
   * fichier serré. Lui servir le carré décalerait le mot de trente pixels.
   */
  cadrage?: "serre" | "entier";
  variante?: "arche" | "complet";
}) {
  if (variante === "complet") {
    return <Image src="/pasrel-logo.png" alt="PASRÈL" width={size} height={size} priority />;
  }
  const entier = cadrage === "entier";
  const src = entier
    ? tone === "onDark"
      ? "/pasrel-white.png"
      : "/pasrel-transparent.png"
    : tone === "onDark"
      ? "/pasrel-white-cadree.png"
      : "/pasrel-arche-cadree.png";
  return (
    <Image
      src={src}
      alt="PASRÈL"
      width={size}
      height={entier ? size : Math.round(size * 0.4265)}
      priority
    />
  );
}
