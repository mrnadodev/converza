"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { logSiteEvent } from "@/app/boutik/actions";

/**
 * Lien vers une vitrine, depuis l'annuaire, qui note le clic au passage.
 *
 * C'est la mesure qui compte : les visites disent que l'annuaire est trouvé,
 * les recherches qu'il est utilisé, mais seuls les clics disent qu'il envoie
 * du monde chez les marchands.
 *
 * La navigation n'attend pas l'enregistrement. Un annuaire qui hésite une
 * demi-seconde avant d'ouvrir une boutique perdrait plus de visiteurs que la
 * mesure n'en expliquerait.
 */
export function ShopLink({
  slug,
  businessId,
  className,
  children,
}: {
  slug: string;
  businessId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/b/${slug}`}
      className={className}
      onClick={() => void logSiteEvent({ kind: "shop_click", path: `/b/${slug}`, businessId })}
    >
      {children}
    </Link>
  );
}
