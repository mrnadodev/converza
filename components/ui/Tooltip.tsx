"use client";

import { useState, type ReactNode } from "react";

// Infobulle dessinée par nous.
//
// L'attribut `title` du HTML produit une bulle dessinée par le système
// d'exploitation : police grise, coins carrés, délai d'une seconde, et aucune
// existence au toucher. Sur la barre de navigation du marchand, ces rectangles
// donnaient à l'application un air d'ébauche.
//
// Celle-ci apparaît tout de suite, se déclenche aussi au clavier — un `title`
// ne le fait pas — et porte le vert de la marque plutôt qu'un gris système. Le
// nom accessible reste porté par l'élément lui-même (aria-label) : l'infobulle
// est un confort visuel, pas le support de l'information.
//
// Le liseré blanc n'est pas décoratif : plusieurs en-têtes de l'application
// sont eux-mêmes verts, et sans lui la bulle s'y fondrait.

export function Tooltip({
  label,
  children,
  side = "bottom",
  className = "",
  hiddenFrom,
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
  /**
   * Largeur à partir de laquelle la bulle disparaît.
   *
   * Une infobulle ne sert que si le bouton n'a pas son nom écrit à côté. La
   * barre de navigation affiche ses libellés à partir de « lg » : au-delà, la
   * bulle répéterait un mot déjà lisible.
   */
  hiddenFrom?: "sm" | "md" | "lg";
}) {
  const [visible, setVisible] = useState(false);
  const masquee = hiddenFrom ? { sm: "sm:hidden", md: "md:hidden", lg: "lg:hidden" }[hiddenFrom] : "";

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocusCapture={() => setVisible(true)}
      onBlurCapture={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="presentation"
          className={`${masquee} pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand px-2.5 py-1 text-[11.5px] font-bold text-white ring-1 ring-white/60 shadow-[0_6px_18px_rgba(0,128,105,0.35)] ${
            side === "bottom" ? "top-[calc(100%+6px)]" : "bottom-[calc(100%+6px)]"
          }`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
