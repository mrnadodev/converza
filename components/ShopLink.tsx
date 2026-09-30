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
 * Le clic part par `sendBeacon`, pas par l'action serveur.
 *
 * L'action serveur était la première idée, et elle perdait un clic sur un :
 * la requête partait en même temps que la navigation, et mourait avec la page.
 * Mesuré en production — visites et recherches arrivaient, aucun clic. Le
 * navigateur s'engage au contraire à livrer un beacon même si la page
 * disparaît dans la seconde ; c'est précisément le cas qu'il traite.
 *
 * L'action serveur reste en second rideau, pour les navigateurs sans beacon.
 * Elle n'y est pas fiable, mais un clic compté de temps en temps vaut mieux
 * qu'aucun.
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
  function noter() {
    const charge = JSON.stringify({ kind: "shop_click", path: `/b/${slug}`, businessId });
    try {
      if (navigator.sendBeacon?.(evtUrl(), new Blob([charge], { type: "application/json" }))) return;
    } catch {
      /* beacon refusé : on retombe sur l'action serveur */
    }
    void logSiteEvent({ kind: "shop_click", path: `/b/${slug}`, businessId });
  }

  return (
    <Link href={`/b/${slug}`} className={className} onClick={noter}>
      {children}
    </Link>
  );
}

/** Chemin absolu : `sendBeacon` n'accepte pas d'URL relative partout. */
function evtUrl(): string {
  return `${window.location.origin}/api/evt`;
}
