"use client";

import { useState } from "react";

// Bouton pour partager le lien public de la vitrine (pour les pubs / statuts WhatsApp).
export function ShareStorefront({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/b/${slug}`;
    const payload = {
      title: "Kòmande sou WhatsApp",
      text: "Gade katalòg nou an epi kòmande fasil sou WhatsApp:",
      url,
    };
    // Partage natif (mobile) si dispo, sinon copie dans le presse-papier.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* annulé par l'utilisateur : on retombe sur la copie */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papier indisponible */
    }
  }

  return (
    <button
      onClick={share}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-brand/25 bg-[#E7F7F1] text-brand active:scale-[0.99]"
    >
      {copied ? (
        <>
          <CheckIcon />
          <span className="text-sm font-bold">Lyen kopye!</span>
        </>
      ) : (
        <>
          <ShareIcon />
          <span className="text-sm font-bold">Pataje vitrin mwen</span>
        </>
      )}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
