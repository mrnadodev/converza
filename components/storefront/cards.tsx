"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import {
  PriceLabel,
  ProductImage,
  QtyControl,
  SoldBadge,
  ChevronIcon,
  photosOf,
  useCopy,
  type CartOps,
} from "@/components/storefront/product";

// Cartes du catalogue complet : la liste où le client retrouve tout ce que la
// boutique vend, sous la section « À la une ».
//
// Ce fichier ne décide que de la mise en page. Ce qu'une carte montre d'un
// produit — photo, catégorie, prix, compteur de ventes, bouton d'achat — vient
// de components/storefront/product.tsx, partagé avec les designs de secteur.

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

        <SoldBadge p={p} className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-bold text-brand shadow-sm" />
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
          <SoldBadge p={p} prefix="· " className="text-[11px] text-ink-faint" />
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
