import Image from "next/image";

/**
 * La marque PASRÈL, telle que fournie.
 *
 * Ce sont les fichiers du marchand de la marque, pas des dessins refaits :
 * l'arche avait d'abord été redessinée en SVG « au plus près », et le
 * résultat n'était pas le logo — ses deux rubans y étaient devenus deux
 * filets concentriques. Un logo se livre, il ne se réinterprète pas.
 *
 * Deux fichiers, deux emplois :
 *
 *  - `pasrel-arche-cadree.png` : l'arche seule, sans le mot, recadrée au
 *    plus près. Le fichier d'origine `pasrel-arche.png` est un carré où
 *    l'arche occupe la moitié haute ; posée telle quelle, elle flottait. C'est le défaut, et
 *    c'est ce qu'il faut partout où le mot est déjà écrit à côté — sinon le
 *    nom apparaît deux fois. C'est aussi la seule version qui tienne en
 *    petit : à 84 px, le mot gravé dans le logo complet n'est plus lisible.
 *  - `pasrel-logo.png` : le logo complet, arche et mot. Pour les surfaces
 *    qui n'ont rien d'autre autour, comme une image de partage.
 *
 * Les trois icônes d'application sont dérivées de l'arche, recentrée dans un
 * carré : l'arche est large et courte, et posée telle quelle elle flottait
 * en haut de la tuile.
 */
export function CvzMark({
  size = 72,
  variante = "arche",
}: {
  size?: number;
  variante?: "arche" | "complet";
}) {
  const complet = variante === "complet";
  return (
    <Image
      src={complet ? "/pasrel-logo.png" : "/pasrel-arche-cadree.png"}
      alt="PASRÈL"
      width={size}
      height={complet ? size : Math.round(size * 0.465)}
      priority
    />
  );
}
