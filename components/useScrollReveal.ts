"use client";

import { useEffect, useState, type RefObject } from "react";

/** Marge sous le bord bas de l'écran : l'élément se révèle un peu avant d'entrer. */
const TRIGGER_MARGIN = 0.12;

/**
 * Révèle les éléments marqués `data-reveal` à l'intérieur de `rootRef`
 * lorsqu'ils entrent dans l'écran.
 *
 * On mesure les positions plutôt que d'utiliser IntersectionObserver. Celui-ci
 * ne livre ses entrées qu'au moment où le navigateur peint : dans un onglet
 * masqué, une capture automatisée ou un aperçu intégré, il ne se déclenche
 * jamais et le contenu resterait invisible. Un calcul de rectangle donne le
 * même résultat sans dépendre du compositeur.
 *
 * Chaque élément n'est révélé qu'une fois, et la liste se vide au fur et à
 * mesure ; quand elle est vide, on cesse d'écouter.
 */
export function useScrollReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let pending = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (pending.length === 0) return;

    const revealAll = () => {
      pending.forEach((n) => n.classList.add("is-revealed"));
      pending = [];
    };

    // Mouvement réduit demandé : on affiche tout, sans transition.
    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      revealAll();
      return;
    }

    let frame = 0;
    let stopped = false;
    let revealed = 0;

    const check = () => {
      frame = 0;
      if (stopped || pending.length === 0) return;

      const viewport = window.innerHeight || document.documentElement.clientHeight || 0;
      // Hauteur nulle : la page n'est pas encore mise en page. On ne décide
      // rien maintenant, le filet de sécurité plus bas prendra le relais.
      if (viewport === 0) return;

      const limit = viewport * (1 - TRIGGER_MARGIN);
      const still: HTMLElement[] = [];

      for (const node of pending) {
        // `top < limite` suffit : un élément déjà remonté au-dessus de l'écran
        // a un `top` négatif et doit lui aussi être visible.
        if (node.getBoundingClientRect().top < limit) {
          node.classList.add("is-revealed");
          revealed++;
        } else {
          still.push(node);
        }
      }

      pending = still;
      if (pending.length === 0) teardown();
    };

    // Étranglement par minuteur plutôt que par requestAnimationFrame : un
    // onglet qui n'est pas peint (arrière-plan, pré-rendu, webview, capture)
    // suspend les frames d'animation, et le contenu resterait masqué.
    const schedule = () => {
      if (frame || stopped) return;
      frame = window.setTimeout(check, 60);
    };

    function teardown() {
      if (stopped) return;
      stopped = true;
      if (frame) window.clearTimeout(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    // Premier passage immédiat pour ce qui est déjà à l'écran, puis deux
    // reprises : la mise en page bouge encore quand les polices arrivent.
    check();
    const settle = window.setTimeout(check, 120);
    const settle2 = window.setTimeout(check, 500);

    // Filet de sécurité. Si au bout de deux secondes rien n'a pu être révélé,
    // c'est que la mesure est impossible dans cet environnement (onglet jamais
    // peint, capture automatisée, mise en page inattendue). Mieux vaut une
    // page sans animation qu'une page vide.
    const safety = window.setTimeout(() => {
      if (revealed === 0) revealAll();
    }, 2000);

    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(settle2);
      window.clearTimeout(safety);
      teardown();
    };
  }, [rootRef]);
}

/**
 * `true` dès que la page a défilé au-delà de `offset`. Sert à densifier
 * l'en-tête une fois qu'on a quitté le haut de la page.
 *
 * Démarre à `false` pour que le rendu serveur et le premier rendu client
 * concordent.
 */
export function useScrolledPast(offset = 24): boolean {
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const onScroll = () => setPassed(window.scrollY > offset);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);

  return passed;
}
