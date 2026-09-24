"use client";

import type { CSSProperties } from "react";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import { categoryLabel } from "@/lib/categories";
import { storefrontCopy, type StorefrontCopy } from "@/lib/i18n/storefront";
import { useLanguage } from "@/components/LanguageContext";

// Vocabulaire commun d'un produit sur la vitrine : sa photo, sa catégorie, son
// prix, son compteur de ventes, son bouton d'achat.
//
// La vitrine a deux familles de cartes — le catalogue complet
// (components/storefront/cards.tsx) et les designs de secteur
// (components/storefront/designs.tsx). Elles ont longtemps décrit chacune de
// leur côté comment afficher une catégorie ou un prix : une correction dans
// l'une laissait l'autre inchangée, et la catégorie est restée affichée en
// créole sur un site en français bien après avoir été corrigée.
//
// Règle : tout ce qui décide de CE QU'UN PRODUIT MONTRE vit ici. Les deux
// autres fichiers ne décident que de la mise en page.

export type CartOps = { add: (id: string) => void; sub: (id: string) => void };

export function useCopy(): StorefrontCopy {
  const { language } = useLanguage();
  return storefrontCopy(language);
}

export function photosOf(p: Product): string[] {
  if (p.photos && p.photos.length > 0) return p.photos.filter(Boolean);
  return p.photo_url ? [p.photo_url] : [];
}

/**
 * Image produit, ou emplacement neutre quand le marchand n'a pas mis de photo.
 *
 * La photo est toujours montrée en entier : jamais recadrée, jamais étirée.
 * Les marchands photographient au téléphone, en portrait comme en paysage, et
 * une carte de vitrine a une forme fixe — il reste donc du vide autour de
 * beaucoup de photos.
 *
 * Ce vide est comblé par la photo elle-même, agrandie et floutée derrière :
 * la carte garde sa forme, l'article reste entier, et aucune couleur étrangère
 * n'entre dans la vitrine du marchand.
 */
export function ProductImage({
  photos,
  name,
  dark,
  compact,
  onZoom,
  index = 0,
}: {
  photos: string[];
  name: string;
  dark?: boolean;
  compact?: boolean;
  onZoom?: (photos: string[], index: number) => void;
  index?: number;
}) {
  if (photos.length === 0) {
    return (
      <div className={`flex h-full w-full items-center justify-center ${dark ? "bg-slate-800" : "bg-[#F1F4F2]"}`} aria-label={name}>
        <BagIcon color={dark ? "#64748B" : "#A3B5AF"} size={compact ? 18 : 34} />
      </div>
    );
  }
  return (
    // Les deux images sont hors du flux : une image restée dans le flux impose
    // sa propre hauteur au conteneur, et la carte prend alors le format de la
    // photo au lieu du sien. La grille devient irrégulière dès que deux photos
    // n'ont pas le même format — ce qui est désormais la règle, puisque les
    // envois gardent leur format d'origine.
    <div className="absolute inset-0 h-full w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[index]}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[index]}
        alt={name}
        draggable={false}
        onClick={onZoom ? () => onZoom(photos, index) : undefined}
        className={`absolute inset-0 h-full w-full object-contain ${onZoom ? "cursor-zoom-in" : ""}`}
      />
    </div>
  );
}

/**
 * Catégorie du produit, dans la langue du visiteur.
 *
 * Les catégories sont enregistrées telles que le marchand les a choisies — en
 * créole, en français, ou écrites à la main. Elles ne s'affichent jamais
 * brutes : un client francophone lit « Promotions », pas « Pwomo Flach ».
 *
 * Jamais par-dessus la photo : beaucoup de produits sont photographiés sur
 * fond chargé, et l'étiquette rendait l'article illisible.
 */
export function ProductCategory({ p, className, style }: { p: Product; className?: string; style?: CSSProperties }) {
  const { language } = useLanguage();
  const label = categoryLabel(p.category, language);
  if (!label) return null;
  return (
    <span className={className} style={style}>
      {label}
    </span>
  );
}

/** Compteur de ventes : la preuve que d'autres ont déjà acheté. */
export function SoldBadge({ p, className, prefix }: { p: Product; className?: string; prefix?: string }) {
  const c = useCopy();
  if (p.sold_count <= 0) return null;
  return (
    <span className={className}>
      {prefix}
      {c.sold(p.sold_count)}
    </span>
  );
}

/** Prix du catalogue : la devise en petit, à côté du montant. */
export function PriceLabel({ p }: { p: Product }) {
  return (
    <span className="text-base font-extrabold">
      {formatMoney(p.price_cents, p.currency).replace(` ${p.currency}`, "")}{" "}
      <span className="text-[11px] font-semibold opacity-60">{p.currency}</span>
    </span>
  );
}

/** Prix des designs de secteur : montant complet, unité de vente si elle existe. */
export function PriceText({ p, className, style, wrap }: { p: Product; className?: string; style?: CSSProperties; wrap?: boolean }) {
  return (
    <span className={`${wrap ? "" : "whitespace-nowrap"} font-extrabold ${className ?? ""}`} style={style}>
      {formatMoney(p.price_cents, p.currency)}
      {p.unit ? <span className="text-[11px] font-semibold opacity-70"> / {p.unit}</span> : null}
    </span>
  );
}

/** Bouton d'ajout, puis compteur −/+ une fois le produit dans le panier. */
export function QtyControl({ p, qty, ops, onDark }: { p: Product; qty: number; ops: CartOps; onDark?: boolean }) {
  const c = useCopy();
  if (p.stock_state === "fini") {
    return <span className={`text-[12px] font-bold ${onDark ? "text-white/70" : "text-ink-faint"}`}>{c.soldOut}</span>;
  }
  if (qty === 0) {
    return (
      <button onClick={() => ops.add(p.id)}
        className="flex h-9 items-center justify-center gap-1.5 rounded-[11px] bg-[#E7F7F1] px-3 text-brand active:scale-95">
        <PlusIcon /><span className="text-[12.5px] font-bold">{c.add}</span>
      </button>
    );
  }
  return (
    <div className="flex h-9 items-center gap-2 rounded-[11px] bg-[#E7F7F1] px-1.5">
      <button onClick={() => ops.sub(p.id)} aria-label="−" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white font-bold text-brand">−</button>
      <span className="min-w-4 text-center text-sm font-extrabold text-brand">{qty}</span>
      <button onClick={() => ops.add(p.id)} aria-label="+" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white font-bold text-brand">+</button>
    </div>
  );
}

/* ─────────── Icônes ─────────── */

export function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}
export function BagIcon({ color, size = 40 }: { color: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
}
export function ChevronIcon({ color, dir, size = 18 }: { color: string; dir: "left" | "right"; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"} /></svg>;
}
