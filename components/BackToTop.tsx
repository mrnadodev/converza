"use client";

import { useScrolledPast } from "@/components/useScrollReveal";

// Flèche de retour en haut, en bas à gauche de l'écran.
//
// Le pied de page portait un lien « Page d'accueil ». Il fallait avoir fini de
// descendre pour s'en servir : celui qui abandonnait au milieu n'avait rien.
// Une flèche qui suit le défilement est disponible tout du long.
//
// À gauche, parce que la droite est occupée sur les écrans de l'application
// (bouton d'ajout flottant) et que le pouce d'un droitier y passe déjà.
//
// Elle n'apparaît qu'une fois la première hauteur d'écran dépassée : plus haut,
// elle ne servirait à rien et masquerait le contenu.

export function BackToTop({ label }: { label: string }) {
  const visible = useScrolledPast(600);

  function remonter() {
    // Le défilement animé est refusé à qui demande moins de mouvement : sur un
    // document de cette longueur, l'animation peut donner le vertige.
    const brusque =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: brusque ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={remonter}
      aria-label={label}
      title={label}
      // `aria-hidden` et `tabIndex` suivent la visibilité : un bouton
      // transparent mais atteignable au clavier enverrait l'utilisateur en haut
      // de la page sans qu'il sache pourquoi.
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-5 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-[0_6px_20px_rgba(0,64,52,0.35)] transition-all duration-200 hover:bg-brand-dark active:scale-95 md:bottom-7 md:left-7 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
