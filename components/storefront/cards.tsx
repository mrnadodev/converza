"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import { storefrontCopy, type StorefrontCopy } from "@/lib/i18n/storefront";
import { useLanguage } from "@/components/LanguageContext";

// Cartes produit de la vitrine publique, partagées par la page, le catalogue
// complet et les designs de secteur (components/storefront/designs.tsx).

export type CartOps = { add: (id: string) => void; sub: (id: string) => void };

export function useCopy(): StorefrontCopy {
  const { language } = useLanguage();
  return storefrontCopy(language);
}

export function photosOf(p: Product): string[] {
  if (p.photos && p.photos.length > 0) return p.photos.filter(Boolean);
  return p.photo_url ? [p.photo_url] : [];
}

/* ─────────── Cartes produit ─────────── */

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

export function PriceLabel({ p }: { p: Product }) {
  return (
    <span className="text-base font-extrabold">
      {formatMoney(p.price_cents, p.currency).replace(` ${p.currency}`, "")}{" "}
      <span className="text-[11px] font-semibold opacity-60">{p.currency}</span>
    </span>
  );
}

/** Image produit, ou emplacement neutre quand le marchand n'a pas mis de photo. */
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photos[index]}
      alt={name}
      draggable={false}
      onClick={onZoom ? () => onZoom(photos, index) : undefined}
      className={`h-full w-full object-contain ${dark ? "bg-slate-800" : "bg-[#F1F4F2]"} ${onZoom ? "cursor-zoom-in" : ""}`}
    />
  );
}

/** Carte à image pleine avec texte en surimpression. */
export function OverlayCard({
  p,
  qty = 0,
  ops,
  onZoom,
  className,
  action,
}: {
  p: Product;
  qty?: number;
  ops?: CartOps;
  onZoom: (photos: string[], index: number) => void;
  className: string;
  action?: React.ReactNode;
}) {
  const photos = photosOf(p);
  return (
    <div className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-slate-900 text-white shadow-md ${className}`}>
      <div className="absolute inset-0">
        <ProductImage photos={photos} name={p.name} dark onZoom={onZoom} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="relative z-10 flex flex-col gap-1 p-3">
        <h4 className="line-clamp-1 text-sm font-extrabold">{p.name}</h4>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="text-[13px] font-extrabold text-emerald-200">{formatMoney(p.price_cents, p.currency)}</span>
          {action ?? (ops ? <QtyControl p={p} qty={qty} ops={ops} onDark /> : null)}
        </div>
      </div>
    </div>
  );
}

export function GridCard({
  p,
  qty,
  ops,
  dark,
  onZoom,
}: {
  p: Product;
  qty: number;
  ops: CartOps;
  dark?: boolean;
  onZoom: (photos: string[], index: number) => void;
}) {
  const c = useCopy();
  const photos = photosOf(p);
  const [imgIdx, setImgIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  function handleEnd(clientX: number) {
    if (touchStartX === null) return;
    const deltaX = touchStartX - clientX;
    setTouchStartX(null);
    if (photos.length < 2) return;
    if (deltaX > 30) setImgIdx((prev) => (prev + 1) % photos.length);
    else if (deltaX < -30) setImgIdx((prev) => (prev - 1 + photos.length) % photos.length);
  }

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl shadow-[0_2px_10px_rgba(17,27,33,0.06)] ring-1 ${dark ? "bg-[#1F2937] text-white ring-gray-700" : "bg-white text-ink ring-line"}`}>
      <div
        className="relative aspect-[4/5] w-full select-none"
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
      >
        <ProductImage photos={photos} name={p.name} dark={dark} onZoom={onZoom} index={imgIdx} />

        {p.sold_count > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-bold text-brand shadow-sm">
            {c.sold(p.sold_count)}
          </span>
        )}
        {p.stock_state === "fini" && (
          <span className="absolute right-2 top-2 rounded-full bg-[#FCE4E4] px-2 py-0.5 text-[10.5px] font-bold text-[#C0392B]">{c.soldOut}</span>
        )}

        {photos.length > 1 && (
          <>
            <button onClick={() => setImgIdx((prev) => (prev - 1 + photos.length) % photos.length)} aria-label={c.previous}
              className="absolute left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow active:scale-90">
              <ChevronIcon color="#111B21" dir="left" size={14} />
            </button>
            <button onClick={() => setImgIdx((prev) => (prev + 1) % photos.length)} aria-label={c.next}
              className="absolute right-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow active:scale-90">
              <ChevronIcon color="#111B21" dir="right" size={14} />
            </button>
            <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5">
              {photos.map((_, idx) => (
                <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === imgIdx ? "w-4 bg-brand" : "w-1.5 bg-white/80"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-1 p-3">
        <div>
          <span className="line-clamp-1 text-[13.5px] font-semibold">{p.name}</span>
          <div className="mt-0.5"><PriceLabel p={p} /></div>
        </div>
        <div className="mt-2">
          {p.stock_state === "fini" ? <span className="text-[12px] text-ink-faint">{c.unavailable}</span> : <QtyControl p={p} qty={qty} ops={ops} />}
        </div>
      </div>
    </div>
  );
}

export function MenuRow({ p, qty, ops, dark, boxed }: { p: Product; qty: number; ops: CartOps; dark?: boolean; boxed?: boolean }) {
  const c = useCopy();
  const photos = photosOf(p);
  const shell = boxed
    ? `rounded-2xl border p-3 ${dark ? "border-slate-700 bg-[#1F2937]" : "border-slate-200 bg-white"}`
    : `border-b px-4 py-3 ${dark ? "border-gray-800 bg-[#111827]" : "border-[#F2F4F5] bg-white"}`;
  return (
    <div className={`flex items-center gap-3 ${shell}`}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
        <ProductImage photos={photos} name={p.name} dark={dark} compact />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-1 text-[15px] font-bold leading-snug">{p.name}</span>
        <div className="flex items-center gap-2">
          <PriceLabel p={p} />
          {p.sold_count > 0 && <span className="text-[11px] text-ink-faint">· {c.sold(p.sold_count)}</span>}
        </div>
      </div>
      <QtyControl p={p} qty={qty} ops={ops} />
    </div>
  );
}

export function FoodCard({
  p,
  qty,
  ops,
  dark,
  onZoom,
}: {
  p: Product;
  qty: number;
  ops: CartOps;
  dark?: boolean;
  onZoom: (photos: string[], index: number) => void;
}) {
  const c = useCopy();
  const photos = photosOf(p);
  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border shadow-md transition-shadow hover:shadow-xl sm:rounded-3xl ${dark ? "border-slate-700 bg-[#1E293B] text-white" : "border-slate-200 bg-white text-ink"}`}>
      {/* Format 4:5 pour voir le plat en entier */}
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <ProductImage photos={photos} name={p.name} dark={dark} onZoom={onZoom} />
        <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1">
          {p.sold_count > 0 && (
            <span className="hidden rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-white sm:inline-block">{c.bestSeller}</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2 p-2.5 sm:p-3.5">
        <div>
          <h3 className="line-clamp-1 text-[13px] font-extrabold leading-tight sm:text-sm">{p.name}</h3>
          {p.unit && <span className="mt-0.5 block line-clamp-1 text-[11px] text-slate-400">{p.unit}</span>}
          <div className="mt-1 text-amber-600"><PriceLabel p={p} /></div>
        </div>
        <div className={`border-t pt-2 ${dark ? "border-slate-800" : "border-slate-200"}`}>
          <QtyControl p={p} qty={qty} ops={ops} />
        </div>
      </div>
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
