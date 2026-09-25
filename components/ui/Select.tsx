"use client";

import { Children, isValidElement, useEffect, useId, useRef, useState, type ReactNode } from "react";

// Liste déroulante dessinée par nous.
//
// Un <select> natif ne peut pas être habillé : le navigateur confie sa liste
// ouverte au système, qui la dessine avec sa police, ses marges et son bleu de
// sélection. Sur la vitrine d'un marchand, cette fenêtre grise tombait au
// milieu d'une page orange et donnait l'impression d'un site inachevé.
//
// Celle-ci garde le comportement qu'on attend d'une liste déroulante — clavier,
// fermeture au clic extérieur, lecture par les lecteurs d'écran — et s'habille
// comme le reste de l'application.

export interface SelectOption {
  value: string;
  label: string;
  /** Ligne secondaire, en plus petit (prix d'une zone, détail d'un plan…). */
  hint?: string;
}

export function Select({
  value,
  onChange,
  options,
  children,
  className = "",
  triggerClassName,
  ariaLabel,
  align = "left",
  tone = "light",
  disabled,
}: {
  value: string;
  /**
   * Reçoit un objet de la même forme qu'un événement de <select> natif. C'est
   * volontaire : les vingt-quatre listes du projet étaient écrites ainsi, et
   * garder la signature évite de récrire chaque gestionnaire — donc d'y
   * introduire des fautes pour un changement d'apparence.
   */
  onChange: (e: { target: { value: string } }) => void;
  /** Soit les options en clair… */
  options?: SelectOption[];
  /** …soit des <option> comme dans un select natif. */
  children?: ReactNode;
  className?: string;
  /**
   * Habillage du bouton. Les champs remplacés portaient déjà leur style — on le
   * reprend tel quel, sinon on obtiendrait deux bordures superposées.
   */
  triggerClassName?: string;
  ariaLabel?: string;
  /** Côté par lequel le panneau s'aligne sur le bouton. */
  align?: "left" | "right";
  /** « sur-couleur » : bouton transparent sur un fond coloré (en-tête de vitrine). */
  tone?: "light" | "onColor";
  disabled?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [survol, setSurvol] = useState(0);
  const boite = useRef<HTMLDivElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  const id = useId();

  // Les <option> enfants sont lus comme le ferait un select natif.
  const liste2: SelectOption[] =
    options ??
    Children.toArray(children)
      .filter(isValidElement)
      .map((e) => {
        const props = e.props as { value?: string | number; children?: ReactNode };
        // Un <option> peut contenir plusieurs morceaux ({nom} · {prix}) :
        // les concaténer, sinon String() d'un tableau rend « a,b,c ».
        const brut = props.children;
        const label = Array.isArray(brut) ? brut.map((x) => (x == null ? "" : String(x))).join("") : String(brut ?? "");
        return { value: String(props.value ?? ""), label };
      });

  const choisi = liste2.findIndex((o) => o.value === value);
  const courant = liste2[choisi] ?? liste2[0];

  // Fermer au clic ailleurs et sur Échap : sans ça, le panneau reste ouvert
  // derrière la page et suit le défilement.
  useEffect(() => {
    if (!ouvert) return;
    const auClic = (e: MouseEvent) => {
      if (!boite.current?.contains(e.target as Node)) setOuvert(false);
    };
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", auClavier);
    };
  }, [ouvert]);

  // À l'ouverture, le doigt part de la valeur actuelle, pas du premier choix.
  useEffect(() => {
    if (ouvert) setSurvol(Math.max(0, choisi));
  }, [ouvert, choisi]);

  useEffect(() => {
    if (ouvert) liste.current?.focus();
  }, [ouvert]);

  function valider(i: number) {
    const o = liste2[i];
    if (!o) return;
    onChange({ target: { value: o.value } });
    setOuvert(false);
  }

  function auClavierListe(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setSurvol((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + liste2.length) % liste2.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      valider(survol);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setSurvol(e.key === "Home" ? 0 : liste2.length - 1);
    }
  }

  const bouton =
    tone === "onColor"
      ? "bg-white/15 text-white hover:bg-white/25"
      : "border border-line bg-white text-ink hover:border-ink-faint";

  return (
    <div ref={boite} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOuvert((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-label={ariaLabel}
        className={`flex w-full items-center justify-between gap-2 text-left transition-colors disabled:opacity-50 ${
          triggerClassName ?? `rounded-xl px-3 py-2 text-[13px] font-semibold ${bouton}`
        }`}
      >
        <span className="truncate">{courant?.label ?? ""}</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
          stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 opacity-70 transition-transform ${ouvert ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {ouvert && (
        <div
          ref={liste}
          role="listbox"
          id={id}
          tabIndex={-1}
          aria-activedescendant={`${id}-${survol}`}
          onKeyDown={auClavierListe}
          className={`absolute z-50 mt-1.5 max-h-[min(300px,60vh)] min-w-full overflow-auto rounded-xl border border-line bg-white p-1 shadow-[0_12px_32px_rgba(17,27,33,0.16)] outline-none ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {liste2.map((o, i) => {
            const actif = o.value === value;
            return (
              <button
                key={o.value}
                id={`${id}-${i}`}
                type="button"
                role="option"
                aria-selected={actif}
                onMouseEnter={() => setSurvol(i)}
                onClick={() => valider(i)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                  i === survol ? "bg-[#E7F7F1]" : ""
                } ${actif ? "font-extrabold text-brand" : "font-semibold text-ink"}`}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{o.label}</span>
                  {o.hint && <span className="truncate text-[11.5px] font-medium text-ink-muted">{o.hint}</span>}
                </span>
                {actif && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
