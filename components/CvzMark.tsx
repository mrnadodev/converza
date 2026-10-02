import Image from "next/image";

/**
 * Le logo PASRÈL, tel que fourni.
 *
 * C'est le fichier du marchand de la marque, pas un dessin refait : il avait
 * d'abord été redessiné en SVG « au plus près », et le résultat n'était pas
 * le logo — les deux rubans de l'arche y étaient devenus deux filets
 * concentriques. Un logo se livre, il ne se réinterprète pas.
 *
 * `public/pasrel-logo.png` est la source ; les trois icônes d'application à
 * côté en sont dérivées. Si le logo change, les quatre sont à refaire
 * ensemble.
 */
export function CvzMark({ size = 72 }: { size?: number }) {
  return (
    <Image
      src="/pasrel-logo.png"
      alt="PASRÈL"
      width={size}
      height={size}
      priority
      className="rounded-[26px]"
    />
  );
}
