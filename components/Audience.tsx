"use client";

import { useEffect, useRef } from "react";
import { logSiteEvent, type SiteEventKind } from "@/app/boutik/actions";

/**
 * Enregistre une visite ou une recherche, une fois par affichage.
 *
 * Déclenché depuis le navigateur et non pendant le rendu serveur : Next rend
 * une page plusieurs fois — préchargement, revalidation, rendu statique — et
 * compter là aurait gonflé le chiffre sans qu'un seul visiteur soit venu.
 *
 * Le garde `envoye` couvre le double montage du mode strict en développement.
 */
export function Audience({ kind, path, term }: { kind: SiteEventKind; path: string; term?: string }) {
  const envoye = useRef("");

  useEffect(() => {
    const cle = `${kind}|${path}|${term ?? ""}`;
    if (envoye.current === cle) return;
    envoye.current = cle;
    // Sans `await` ni `catch` visible : l'action se tait déjà d'elle-même, et
    // le visiteur n'a pas à attendre une mesure qui ne le concerne pas.
    void logSiteEvent({ kind, path, term });
  }, [kind, path, term]);

  return null;
}
